import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  QueryMedicalRecordsDto,
} from './dto/medical-record.dto';

@Injectable()
export class MedicalRecordsService {
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

  private parseExamination(examStr?: string | null) {
    if (!examStr) return { notes: '', vitals: {} };
    try {
      if (examStr.startsWith('{')) {
        const parsed = JSON.parse(examStr);
        return { notes: parsed.notes || '', vitals: parsed.vitals || {} };
      }
    } catch {
      // fallback
    }
    return { notes: examStr, vitals: {} };
  }

  async getStats(clinicId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, todayCount, uniquePatients] = await Promise.all([
      this.prisma.medicalRecord.count({
        where: { clinicId, deletedAt: null },
      }),
      this.prisma.medicalRecord.count({
        where: {
          clinicId,
          visitDate: { gte: today, lt: tomorrow },
          deletedAt: null,
        },
      }),
      this.prisma.medicalRecord.findMany({
        where: { clinicId, deletedAt: null },
        select: { patientId: true },
        distinct: ['patientId'],
      }),
    ]);

    const topDiagnoses = await this.prisma.medicalRecord.groupBy({
      by: ['diagnosis'],
      where: { clinicId, deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    return {
      total,
      todayCount,
      uniquePatientsCount: uniquePatients.length,
      topDiagnoses: topDiagnoses.map((d) => ({
        diagnosis: d.diagnosis || 'General Clinical Review',
        count: d._count.id,
      })),
    };
  }

  async listRecords(clinicId: string, query: QueryMedicalRecordsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId,
      deletedAt: null,
    };

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.doctorId) {
      where.doctorId = query.doctorId;
    }

    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      where.visitDate = { gte: start, lte: end };
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { diagnosis: { contains: s, mode: 'insensitive' } },
        { chiefComplaint: { contains: s, mode: 'insensitive' } },
        { treatment: { contains: s, mode: 'insensitive' } },
        { patient: { firstName: { contains: s, mode: 'insensitive' } } },
        { patient: { lastName: { contains: s, mode: 'insensitive' } } },
        { patient: { phone: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, records] = await Promise.all([
      this.prisma.medicalRecord.count({ where }),
      this.prisma.medicalRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ visitDate: 'desc' }, { createdAt: 'desc' }],
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
              allergies: true,
            },
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              qualification: true,
              licenseNumber: true,
              bio: true,
              department: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    const formatted = records.map((r) => {
      const examParsed = this.parseExamination(r.examination);
      return {
        ...r,
        examinationNotes: examParsed.notes,
        vitals: examParsed.vitals,
        doctor: {
          ...r.doctor,
          fullName: this.parseDoctorName(r.doctor.bio),
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

  async getRecordById(clinicId: string, id: string) {
    const record = await this.prisma.medicalRecord.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: {
        patient: true,
        doctor: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found.');
    }

    const examParsed = this.parseExamination(record.examination);

    return {
      ...record,
      examinationNotes: examParsed.notes,
      vitals: examParsed.vitals,
      doctor: {
        ...record.doctor,
        fullName: this.parseDoctorName(record.doctor.bio),
      },
    };
  }

  async createRecord(clinicId: string, dto: CreateMedicalRecordDto) {
    const [patient, doctor] = await Promise.all([
      this.prisma.patient.findFirst({
        where: { id: dto.patientId, clinicId, deletedAt: null },
      }),
      this.prisma.doctor.findFirst({
        where: { id: dto.doctorId, clinicId, deletedAt: null },
      }),
    ]);

    if (!patient) throw new NotFoundException('Patient record not found.');
    if (!doctor) throw new NotFoundException('Doctor record not found.');

    const visitD = new Date(dto.visitDate);
    visitD.setHours(0, 0, 0, 0);

    const examPayload = JSON.stringify({
      notes: dto.examination || '',
      vitals: dto.vitals || {},
    });

    return this.prisma.medicalRecord.create({
      data: {
        clinicId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        visitDate: visitD,
        chiefComplaint: dto.chiefComplaint,
        history: dto.history,
        examination: examPayload,
        diagnosis: dto.diagnosis,
        treatment: dto.treatment,
        attachments: dto.attachments || [],
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async updateRecord(clinicId: string, id: string, dto: UpdateMedicalRecordDto) {
    const existing = await this.prisma.medicalRecord.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Medical record not found.');
    }

    const currentExam = this.parseExamination(existing.examination);
    const updatedExamPayload = JSON.stringify({
      notes: dto.examination !== undefined ? dto.examination : currentExam.notes,
      vitals: dto.vitals !== undefined ? dto.vitals : currentExam.vitals,
    });

    const data: any = {};
    if (dto.visitDate) {
      const d = new Date(dto.visitDate);
      d.setHours(0, 0, 0, 0);
      data.visitDate = d;
    }
    if (dto.chiefComplaint !== undefined) data.chiefComplaint = dto.chiefComplaint;
    if (dto.history !== undefined) data.history = dto.history;
    if (dto.diagnosis !== undefined) data.diagnosis = dto.diagnosis;
    if (dto.treatment !== undefined) data.treatment = dto.treatment;
    if (dto.attachments !== undefined) data.attachments = dto.attachments;
    data.examination = updatedExamPayload;

    return this.prisma.medicalRecord.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async deleteRecord(clinicId: string, id: string) {
    const existing = await this.prisma.medicalRecord.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Medical record not found.');
    }

    return this.prisma.medicalRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
