import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { InvoiceStatus, PaymentMethod, Prisma } from '@prisma/client';
import type {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  RecordPaymentDto,
  QueryInvoicesDto,
} from './dto/billing.dto';

const PATIENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  cnic: true,
  gender: true,
  dateOfBirth: true,
};

function parseDoctorName(bio: unknown): string {
  if (!bio) return 'Unknown Doctor';
  try {
    const parsed = typeof bio === 'string' ? JSON.parse(bio) : bio;
    return (parsed as { name?: string })?.name ?? 'Unknown Doctor';
  } catch {
    return 'Unknown Doctor';
  }
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private calculatePaidAndRemaining(invoice: {
    total: Prisma.Decimal | number;
    payments: { amount: Prisma.Decimal | number }[];
  }) {
    const total = Number(invoice.total);
    const paid = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );
    const remaining = Math.max(0, total - paid);
    return { paid, remaining };
  }

  async getStats(clinicId: string) {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalInvoices, pendingCount, paidCount, paymentsToday, paymentsThisMonth, allPayments] =
      await Promise.all([
        this.prisma.invoice.count({ where: { clinicId, deletedAt: null } }),
        this.prisma.invoice.count({
          where: {
            clinicId,
            status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID] },
            deletedAt: null,
          },
        }),
        this.prisma.invoice.count({
          where: { clinicId, status: InvoiceStatus.PAID, deletedAt: null },
        }),
        this.prisma.payment.aggregate({
          where: { clinicId, paymentDate: { gte: startOfToday } },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: { clinicId, paymentDate: { gte: startOfMonth } },
          _sum: { amount: true },
        }),
        this.prisma.payment.aggregate({
          where: { clinicId },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalInvoices,
      pendingCount,
      paidCount,
      revenueToday: Number(paymentsToday._sum.amount || 0),
      revenueThisMonth: Number(paymentsThisMonth._sum.amount || 0),
      totalRevenue: Number(allPayments._sum.amount || 0),
    };
  }

  async list(clinicId: string, query: QueryInvoicesDto) {
    const where: Prisma.InvoiceWhereInput = { clinicId, deletedAt: null };

    if (query.patientId) where.patientId = query.patientId;
    if (query.status) where.status = query.status;

    if (query.startDate || query.endDate) {
      where.issuedAt = {};
      if (query.startDate) where.issuedAt.gte = new Date(query.startDate);
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.issuedAt.lte = end;
      }
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: s, mode: 'insensitive' } },
        { patient: { firstName: { contains: s, mode: 'insensitive' } } },
        { patient: { lastName: { contains: s, mode: 'insensitive' } } },
        { patient: { phone: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        patient: { select: PATIENT_SELECT },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            doctor: { select: { id: true, bio: true, specialization: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((inv) => {
      const { paid, remaining } = this.calculatePaidAndRemaining(inv);
      return {
        ...inv,
        subtotal: Number(inv.subtotal),
        discount: Number(inv.discount),
        tax: Number(inv.tax),
        total: Number(inv.total),
        amountPaid: paid,
        amountRemaining: remaining,
        patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
        doctorName: inv.appointment?.doctor
          ? parseDoctorName(inv.appointment.doctor.bio)
          : null,
      };
    });
  }

  async findOne(clinicId: string, id: string) {
    const inv = await this.prisma.invoice.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: {
        patient: { select: PATIENT_SELECT },
        clinic: { select: { id: true, name: true, phone: true, email: true, address: true, city: true } },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            doctor: { select: { id: true, bio: true, specialization: true } },
          },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!inv) throw new NotFoundException('Invoice not found');

    const { paid, remaining } = this.calculatePaidAndRemaining(inv);
    return {
      ...inv,
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      tax: Number(inv.tax),
      total: Number(inv.total),
      amountPaid: paid,
      amountRemaining: remaining,
      patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
      doctorName: inv.appointment?.doctor
        ? parseDoctorName(inv.appointment.doctor.bio)
        : null,
    };
  }

  async create(clinicId: string, dto: CreateInvoiceDto) {
    if (dto.appointmentId) {
      const existing = await this.prisma.invoice.findFirst({
        where: { appointmentId: dto.appointmentId, deletedAt: null },
      });
      if (existing) {
        throw new ConflictException('An invoice already exists for this appointment');
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const countToday = await this.prisma.invoice.count({
      where: {
        clinicId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });
    const invoiceNumber = `INV-${todayStr}-${String(countToday + 1).padStart(3, '0')}`;

    const subtotal = Number(dto.subtotal);
    const discount = Number(dto.discount || 0);
    const tax = Number(dto.tax || 0);
    const total = Math.max(0, subtotal - discount + tax);

    const inv = await this.prisma.invoice.create({
      data: {
        clinicId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId || undefined,
        invoiceNumber,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
        status: dto.status || InvoiceStatus.PENDING,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        patient: { select: PATIENT_SELECT },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            doctor: { select: { id: true, bio: true } },
          },
        },
        payments: true,
      },
    });

    const { paid, remaining } = this.calculatePaidAndRemaining(inv);
    return {
      ...inv,
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      tax: Number(inv.tax),
      total: Number(inv.total),
      amountPaid: paid,
      amountRemaining: remaining,
      patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
      doctorName: inv.appointment?.doctor
        ? parseDoctorName(inv.appointment.doctor.bio)
        : null,
    };
  }

  async update(clinicId: string, id: string, dto: UpdateInvoiceDto) {
    const existing = await this.findOne(clinicId, id);

    const subtotal = dto.subtotal !== undefined ? Number(dto.subtotal) : existing.subtotal;
    const discount = dto.discount !== undefined ? Number(dto.discount) : existing.discount;
    const tax = dto.tax !== undefined ? Number(dto.tax) : existing.tax;
    const total = Math.max(0, subtotal - discount + tax);

    const inv = await this.prisma.invoice.update({
      where: { id },
      data: {
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discount),
        tax: new Prisma.Decimal(tax),
        total: new Prisma.Decimal(total),
        status: dto.status || undefined,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include: {
        patient: { select: PATIENT_SELECT },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            doctor: { select: { id: true, bio: true } },
          },
        },
        payments: true,
      },
    });

    const { paid, remaining } = this.calculatePaidAndRemaining(inv);
    return {
      ...inv,
      subtotal: Number(inv.subtotal),
      discount: Number(inv.discount),
      tax: Number(inv.tax),
      total: Number(inv.total),
      amountPaid: paid,
      amountRemaining: remaining,
      patientName: `${inv.patient.firstName} ${inv.patient.lastName}`,
      doctorName: inv.appointment?.doctor
        ? parseDoctorName(inv.appointment.doctor.bio)
        : null,
    };
  }

  async recordPayment(clinicId: string, invoiceId: string, dto: RecordPaymentDto) {
    const invoice = await this.findOne(clinicId, invoiceId);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payment for a cancelled invoice');
    }

    const payAmount = Number(dto.amount);
    if (payAmount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }

    if (payAmount > invoice.amountRemaining) {
      throw new BadRequestException(
        `Payment amount (${payAmount}) exceeds remaining balance (${invoice.amountRemaining})`,
      );
    }

    // Create payment entry
    await this.prisma.payment.create({
      data: {
        clinicId,
        invoiceId,
        paymentMethod: dto.paymentMethod,
        amount: new Prisma.Decimal(payAmount),
        transactionReference: dto.transactionReference || undefined,
        notes: dto.notes || undefined,
      },
    });

    // Re-evaluate invoice payments & status
    const updatedInvoice = await this.findOne(clinicId, invoiceId);
    let nextStatus = updatedInvoice.status;
    if (updatedInvoice.amountRemaining <= 0) {
      nextStatus = InvoiceStatus.PAID;
    } else if (updatedInvoice.amountPaid > 0) {
      nextStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    if (nextStatus !== updatedInvoice.status) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: nextStatus },
      });
      updatedInvoice.status = nextStatus;
    }

    return updatedInvoice;
  }

  async remove(clinicId: string, id: string) {
    await this.findOne(clinicId, id);
    await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date(), status: InvoiceStatus.CANCELLED },
    });
    return { message: 'Invoice cancelled and archived' };
  }
}
