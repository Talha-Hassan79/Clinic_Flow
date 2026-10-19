import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreatePatientDto,
  UpdatePatientDto,
  QueryPatientsDto,
  CreateLabReportDto,
} from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async listPatients(clinicId: string, query: QueryPatientsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId,
      deletedAt: null,
    };

    if (query.gender) {
      where.gender = { equals: query.gender, mode: 'insensitive' };
    }

    if (query.bloodGroup) {
      where.bloodGroup = query.bloodGroup;
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { firstName: { contains: s, mode: 'insensitive' } },
        { lastName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { cnic: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, patients] = await Promise.all([
      this.prisma.patient.count({ where }),
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              appointments: true,
              prescriptions: true,
              labReports: true,
              invoices: true,
            },
          },
        },
      }),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(clinicId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, maleCount, femaleCount, newThisMonth, totalLabTests] =
      await Promise.all([
        this.prisma.patient.count({
          where: { clinicId, deletedAt: null },
        }),
        this.prisma.patient.count({
          where: {
            clinicId,
            gender: { equals: 'Male', mode: 'insensitive' },
            deletedAt: null,
          },
        }),
        this.prisma.patient.count({
          where: {
            clinicId,
            gender: { equals: 'Female', mode: 'insensitive' },
            deletedAt: null,
          },
        }),
        this.prisma.patient.count({
          where: {
            clinicId,
            createdAt: { gte: startOfMonth },
            deletedAt: null,
          },
        }),
        this.prisma.labReport.count({
          where: { clinicId },
        }),
      ]);

    return {
      total,
      maleCount,
      femaleCount,
      otherCount: total - (maleCount + femaleCount),
      newThisMonth,
      totalLabTests,
    };
  }

  async getPatientById(clinicId: string, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: {
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 10,
          include: {
            doctor: {
              select: {
                id: true,
                specialization: true,
              },
            },
          },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: true,
          },
        },
        labReports: {
          orderBy: { uploadedAt: 'desc' },
        },
        invoices: {
          orderBy: { issuedAt: 'desc' },
          take: 10,
        },
        medicalRecords: {
          orderBy: { visitDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient record not found in this clinic.');
    }

    return patient;
  }

  async createPatient(clinicId: string, dto: CreatePatientDto) {
    return this.prisma.patient.create({
      data: {
        clinicId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
        bloodGroup: dto.bloodGroup,
        phone: dto.phone,
        email: dto.email,
        cnic: dto.cnic,
        address: dto.address,
        city: dto.city,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        allergies: dto.allergies,
        notes: dto.notes,
      },
    });
  }

  async updatePatient(clinicId: string, id: string, dto: UpdatePatientDto) {
    const existing = await this.prisma.patient.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Patient record not found in this clinic.');
    }

    const data: any = { ...dto };
    if (dto.dateOfBirth) {
      data.dateOfBirth = new Date(dto.dateOfBirth);
    }

    return this.prisma.patient.update({
      where: { id },
      data,
    });
  }

  async deletePatient(clinicId: string, id: string) {
    const existing = await this.prisma.patient.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Patient record not found in this clinic.');
    }

    return this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ─────────────────────────────────────────────
  // LAB REPORTS
  // ─────────────────────────────────────────────
  async addLabReport(
    clinicId: string,
    patientId: string,
    dto: CreateLabReportDto,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, clinicId, deletedAt: null },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found in this clinic.');
    }

    // Ensure a doctor is referenced; if none provided or exists, find or create clinic default doctor
    let doctorId = dto.doctorId;
    if (!doctorId) {
      let doctor = await this.prisma.doctor.findFirst({
        where: { clinicId, deletedAt: null },
      });
      if (!doctor) {
        doctor = await this.prisma.doctor.create({
          data: {
            clinicId,
            specialization: 'General Physician',
            qualification: 'MBBS',
          },
        });
      }
      doctorId = doctor.id;
    }

    // Embed structured results as JSON inside fileUrl if no external URL provided
    let fileUrl = dto.fileUrl || '';
    if (dto.testResults) {
      const payload = {
        results: dto.testResults,
        testType: dto.testType || 'General Lab Test',
        fileUrl: dto.fileUrl || null,
      };
      fileUrl = JSON.stringify(payload);
    }

    return this.prisma.labReport.create({
      data: {
        clinicId,
        patientId,
        doctorId,
        reportName: dto.reportName,
        fileUrl: fileUrl || 'https://cdn.clinicflow.com/reports/default.pdf',
      },
    });
  }

  async deleteLabReport(clinicId: string, reportId: string) {
    const report = await this.prisma.labReport.findFirst({
      where: { id: reportId, clinicId },
    });

    if (!report) {
      throw new NotFoundException('Lab report not found.');
    }

    return this.prisma.labReport.delete({
      where: { id: reportId },
    });
  }
}
