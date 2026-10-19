import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentsDto,
  AppointmentStatus,
} from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  private parseDoctorName(bioStr?: string | null) {
    if (!bioStr) return 'Doctor';
    try {
      if (bioStr.startsWith('{')) {
        const parsed = JSON.parse(bioStr);
        return parsed.name || 'Doctor';
      }
    } catch {
      // fallback
    }
    return 'Doctor';
  }

  async getStats(clinicId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, todayCount, waitingCount, inConsultationCount, completedToday] =
      await Promise.all([
        this.prisma.appointment.count({
          where: { clinicId, deletedAt: null },
        }),
        this.prisma.appointment.count({
          where: {
            clinicId,
            appointmentDate: { gte: today, lt: tomorrow },
            deletedAt: null,
          },
        }),
        this.prisma.appointment.count({
          where: {
            clinicId,
            appointmentDate: { gte: today, lt: tomorrow },
            status: AppointmentStatus.WAITING,
            deletedAt: null,
          },
        }),
        this.prisma.appointment.count({
          where: {
            clinicId,
            appointmentDate: { gte: today, lt: tomorrow },
            status: AppointmentStatus.IN_CONSULTATION,
            deletedAt: null,
          },
        }),
        this.prisma.appointment.count({
          where: {
            clinicId,
            appointmentDate: { gte: today, lt: tomorrow },
            status: AppointmentStatus.COMPLETED,
            deletedAt: null,
          },
        }),
      ]);

    return {
      total,
      todayCount,
      waitingCount,
      inConsultationCount,
      completedToday,
    };
  }

  async listAppointments(clinicId: string, query: QueryAppointmentsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId,
      deletedAt: null,
    };

    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.date) {
      const targetDate = new Date(query.date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      where.appointmentDate = {
        gte: targetDate,
        lt: nextDay,
      };
    } else if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);

      where.appointmentDate = {
        gte: start,
        lte: end,
      };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { patient: { firstName: { contains: s, mode: 'insensitive' } } },
        { patient: { lastName: { contains: s, mode: 'insensitive' } } },
        { patient: { phone: { contains: s, mode: 'insensitive' } } },
        { reason: { contains: s, mode: 'insensitive' } },
        { notes: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, appointments] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ appointmentDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              cnic: true,
              gender: true,
              dateOfBirth: true,
              bloodGroup: true,
            },
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              qualification: true,
              consultationFee: true,
              bio: true,
              department: {
                select: { id: true, name: true },
              },
            },
          },
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              status: true,
            },
          },
        },
      }),
    ]);

    const formatted = appointments.map((apt, index) => {
      let tokenStr = `Token #${String(index + 1).padStart(2, '0')}`;
      if (apt.notes && apt.notes.includes('Token #')) {
        const match = apt.notes.match(/Token #\d+/);
        if (match) tokenStr = match[0];
      }

      return {
        ...apt,
        token: tokenStr,
        doctor: {
          ...apt.doctor,
          fullName: this.parseDoctorName(apt.doctor.bio),
        },
      };
    });

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAppointmentById(clinicId: string, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: {
        patient: true,
        doctor: {
          include: {
            department: true,
          },
        },
        prescription: {
          include: {
            items: true,
          },
        },
        invoice: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment record not found.');
    }

    return {
      ...appointment,
      doctor: {
        ...appointment.doctor,
        fullName: this.parseDoctorName(appointment.doctor.bio),
      },
    };
  }

  async createAppointment(clinicId: string, dto: CreateAppointmentDto) {
    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findFirst({
        where: { id: dto.patientId, clinicId, deletedAt: null },
      }),
      this.prisma.doctor.findFirst({
        where: { id: dto.doctorId, clinicId, deletedAt: null },
      }),
    ]);

    if (!patient) throw new NotFoundException('Patient not found.');
    if (!doctor) throw new NotFoundException('Doctor not found.');

    const aptDate = new Date(dto.appointmentDate);
    aptDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(aptDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Calculate sequential token number for this doctor on this day
    const count = await this.prisma.appointment.count({
      where: {
        clinicId,
        doctorId: dto.doctorId,
        appointmentDate: { gte: aptDate, lt: nextDay },
        deletedAt: null,
      },
    });

    const tokenNumber = `Token #${String(count + 1).padStart(2, '0')}`;
    const notesCombined = `${tokenNumber}${dto.type ? ` | ${dto.type}` : ''}${dto.notes ? ` — ${dto.notes}` : ''}`;

    return this.prisma.appointment.create({
      data: {
        clinicId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        appointmentDate: aptDate,
        appointmentTime: dto.appointmentTime,
        status: AppointmentStatus.CONFIRMED,
        reason: dto.reason,
        notes: notesCombined,
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async updateAppointment(clinicId: string, id: string, dto: UpdateAppointmentDto) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Appointment not found.');
    }

    const data: any = { ...dto };
    if (dto.appointmentDate) {
      const d = new Date(dto.appointmentDate);
      d.setHours(0, 0, 0, 0);
      data.appointmentDate = d;
    }

    return this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async updateStatus(clinicId: string, id: string, status: AppointmentStatus) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Appointment not found.');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async deleteAppointment(clinicId: string, id: string) {
    const existing = await this.prisma.appointment.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Appointment not found.');
    }

    return this.prisma.appointment.update({
      where: { id },
      data: { deletedAt: new Date(), status: AppointmentStatus.CANCELLED },
    });
  }

  async getAvailableSlots(clinicId: string, doctorId: string, dateStr: string) {
    const defaultSlots = [
      '09:00 AM',
      '09:30 AM',
      '10:00 AM',
      '10:30 AM',
      '11:00 AM',
      '11:30 AM',
      '12:00 PM',
      '12:30 PM',
      '02:00 PM',
      '02:30 PM',
      '03:00 PM',
      '03:30 PM',
      '04:00 PM',
      '04:30 PM',
      '05:00 PM',
    ];

    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const booked = await this.prisma.appointment.findMany({
      where: {
        clinicId,
        doctorId,
        appointmentDate: { gte: targetDate, lt: nextDay },
        status: { notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] },
        deletedAt: null,
      },
      select: { appointmentTime: true },
    });

    const bookedTimes = new Set(booked.map((b) => b.appointmentTime));

    return defaultSlots.map((slot) => ({
      time: slot,
      isBooked: bookedTimes.has(slot),
    }));
  }
}
