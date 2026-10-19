import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type { CreatePrescriptionDto, QueryPrescriptionsDto, UpdatePrescriptionDto } from './dto/prescription.dto';

function parseDoctorName(bio: unknown): string {
  if (!bio) return 'Unknown Doctor';
  try {
    const parsed = typeof bio === 'string' ? JSON.parse(bio) : bio;
    return (parsed as { name?: string })?.name ?? 'Unknown Doctor';
  } catch {
    return 'Unknown Doctor';
  }
}

const PATIENT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  gender: true,
  dateOfBirth: true,
  phone: true,
};

const DOCTOR_SELECT = {
  id: true,
  bio: true,
};

@Injectable()
export class PrescriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(clinicId: string) {
    const [total, today, thisMonth] = await Promise.all([
      this.prisma.prescription.count({ where: { clinicId, deletedAt: null } }),
      this.prisma.prescription.count({
        where: {
          clinicId,
          deletedAt: null,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.prescription.count({
        where: {
          clinicId,
          deletedAt: null,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);
    return { total, today, thisMonth };
  }

  async list(clinicId: string, query: QueryPrescriptionsDto) {
    const where: Record<string, unknown> = { clinicId, deletedAt: null };
    if (query.patientId) where.patientId = query.patientId;
    if (query.doctorId) where.doctorId = query.doctorId;
    if (query.search) {
      where.OR = [
        { diagnosis: { contains: query.search, mode: 'insensitive' } },
        { patient: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where,
      include: {
        patient: { select: PATIENT_SELECT },
        doctor: { select: DOCTOR_SELECT },
        items: { include: { medicine: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return prescriptions.map((rx) => ({
      ...rx,
      doctorName: parseDoctorName(rx.doctor.bio),
      patientName: `${rx.patient.firstName} ${rx.patient.lastName}`,
    }));
  }

  async findOne(clinicId: string, id: string) {
    const rx = await this.prisma.prescription.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: {
        patient: { select: PATIENT_SELECT },
        doctor: { select: DOCTOR_SELECT },
        appointment: { select: { id: true, appointmentDate: true, appointmentTime: true } },
        items: { include: { medicine: true } },
      },
    });
    if (!rx) throw new NotFoundException('Prescription not found');
    return {
      ...rx,
      doctorName: parseDoctorName(rx.doctor.bio),
      patientName: `${rx.patient.firstName} ${rx.patient.lastName}`,
    };
  }

  async create(clinicId: string, dto: CreatePrescriptionDto) {
    const existing = await this.prisma.prescription.findFirst({
      where: { appointmentId: dto.appointmentId, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('A prescription already exists for this appointment');
    }

    // Auto-create medicine records if they do not exist
    const resolvedItems = await Promise.all(
      dto.items.map(async (item) => {
        let medicine = await this.prisma.medicine.findFirst({
          where: {
            clinicId,
            name: { equals: item.medicineName, mode: 'insensitive' },
            deletedAt: null,
          },
        });
        if (!medicine) {
          medicine = await this.prisma.medicine.create({
            data: { clinicId, name: item.medicineName },
          });
        }
        return { ...item, medicineId: medicine.id };
      }),
    );

    const rx = await this.prisma.prescription.create({
      data: {
        clinicId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentId: dto.appointmentId,
        diagnosis: dto.diagnosis,
        instructions: dto.instructions,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        items: {
          create: resolvedItems.map((item) => ({
            medicineId: item.medicineId,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            quantity: item.quantity,
            notes: [item.route ? `route:${item.route}` : '', item.notes ?? '']
              .filter(Boolean)
              .join('|') || undefined,
          })),
        },
      },
      include: {
        patient: { select: PATIENT_SELECT },
        doctor: { select: DOCTOR_SELECT },
        items: { include: { medicine: true } },
      },
    });

    return {
      ...rx,
      doctorName: parseDoctorName(rx.doctor.bio),
      patientName: `${rx.patient.firstName} ${rx.patient.lastName}`,
    };
  }

  async update(clinicId: string, id: string, dto: UpdatePrescriptionDto) {
    await this.findOne(clinicId, id);
    const rx = await this.prisma.prescription.update({
      where: { id },
      data: {
        diagnosis: dto.diagnosis,
        instructions: dto.instructions,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
      },
      include: {
        patient: { select: PATIENT_SELECT },
        doctor: { select: DOCTOR_SELECT },
        items: { include: { medicine: true } },
      },
    });
    return {
      ...rx,
      doctorName: parseDoctorName(rx.doctor.bio),
      patientName: `${rx.patient.firstName} ${rx.patient.lastName}`,
    };
  }

  async remove(clinicId: string, id: string) {
    await this.findOne(clinicId, id);
    await this.prisma.prescription.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Prescription deleted' };
  }
}
