import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateDoctorDto,
  UpdateDoctorDto,
  QueryDoctorsDto,
} from './dto/doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  private parseDoctorBio(bioStr?: string | null) {
    if (!bioStr) {
      return { fullName: 'Doctor', schedule: 'Mon - Fri: 09:00 AM - 05:00 PM', bio: '' };
    }
    try {
      if (bioStr.startsWith('{')) {
        const parsed = JSON.parse(bioStr);
        return {
          fullName: parsed.name || 'Doctor',
          schedule: parsed.schedule || 'Mon - Fri: 09:00 AM - 05:00 PM',
          bio: parsed.bio || '',
        };
      }
    } catch {
      // fallback
    }
    return { fullName: 'Doctor', schedule: 'Mon - Fri: 09:00 AM - 05:00 PM', bio: bioStr };
  }

  async getDoctorStats(clinicId: string) {
    const [total, availableCount, departmentsCount] = await Promise.all([
      this.prisma.doctor.count({
        where: { clinicId, deletedAt: null },
      }),
      this.prisma.doctor.count({
        where: { clinicId, isAvailable: true, deletedAt: null },
      }),
      this.prisma.department.count({
        where: { clinicId, deletedAt: null },
      }),
    ]);

    const specializations = await this.prisma.doctor.findMany({
      where: { clinicId, deletedAt: null },
      select: { specialization: true },
      distinct: ['specialization'],
    });

    return {
      total,
      availableCount,
      onLeaveCount: total - availableCount,
      specializationsCount: specializations.filter((s) => s.specialization).length,
      departmentsCount,
    };
  }

  async listDepartments(clinicId: string) {
    let departments = await this.prisma.department.findMany({
      where: { clinicId, deletedAt: null },
      orderBy: { name: 'asc' },
    });

    if (departments.length === 0) {
      const defaultDepts = [
        'General Medicine',
        'Pediatrics & Child Care',
        'Cardiology',
        'Dermatology',
        'Dental Surgery',
        'Orthopedics',
        'Gynecology & Obstetrics',
      ];
      await this.prisma.department.createMany({
        data: defaultDepts.map((name) => ({
          clinicId,
          name,
        })),
      });
      departments = await this.prisma.department.findMany({
        where: { clinicId, deletedAt: null },
        orderBy: { name: 'asc' },
      });
    }

    return departments;
  }

  async listDoctors(clinicId: string, query: QueryDoctorsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId,
      deletedAt: null,
    };

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable;
    }

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { specialization: { contains: s, mode: 'insensitive' } },
        { qualification: { contains: s, mode: 'insensitive' } },
        { licenseNumber: { contains: s, mode: 'insensitive' } },
        { bio: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, doctors] = await Promise.all([
      this.prisma.doctor.count({ where }),
      this.prisma.doctor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          department: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              appointments: true,
              prescriptions: true,
              labReports: true,
            },
          },
        },
      }),
    ]);

    const formatted = doctors.map((doc) => {
      const parsedBio = this.parseDoctorBio(doc.bio);
      return {
        ...doc,
        fullName: parsedBio.fullName,
        schedule: parsedBio.schedule,
        cleanBio: parsedBio.bio,
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

  async getDoctorById(clinicId: string, id: string) {
    const doctor = await this.prisma.doctor.findFirst({
      where: { id, clinicId, deletedAt: null },
      include: {
        department: true,
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 10,
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                gender: true,
              },
            },
          },
        },
        prescriptions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        labReports: {
          orderBy: { uploadedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found.');
    }

    const parsedBio = this.parseDoctorBio(doctor.bio);

    return {
      ...doctor,
      fullName: parsedBio.fullName,
      schedule: parsedBio.schedule,
      cleanBio: parsedBio.bio,
    };
  }

  async createDoctor(clinicId: string, dto: CreateDoctorDto) {
    let departmentId = dto.departmentId;

    if (!departmentId && dto.departmentName) {
      let dept = await this.prisma.department.findFirst({
        where: { clinicId, name: { equals: dto.departmentName, mode: 'insensitive' }, deletedAt: null },
      });
      if (!dept) {
        dept = await this.prisma.department.create({
          data: { clinicId, name: dto.departmentName },
        });
      }
      departmentId = dept.id;
    }

    const fullName = `${dto.firstName} ${dto.lastName}`.trim();
    const bioPayload = JSON.stringify({
      name: fullName,
      schedule: dto.schedule || 'Mon - Fri: 09:00 AM - 05:00 PM',
      bio: dto.bio || '',
    });

    return this.prisma.doctor.create({
      data: {
        clinicId,
        departmentId,
        userId: dto.userId,
        specialization: dto.specialization,
        licenseNumber: dto.licenseNumber,
        qualification: dto.qualification,
        experienceYears: dto.experienceYears,
        consultationFee: dto.consultationFee,
        bio: bioPayload,
        isAvailable: true,
      },
      include: {
        department: true,
      },
    });
  }

  async updateDoctor(clinicId: string, id: string, dto: UpdateDoctorDto) {
    const existing = await this.prisma.doctor.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Doctor record not found.');
    }

    const currentParsed = this.parseDoctorBio(existing.bio);
    const newFullName = dto.firstName || dto.lastName
      ? `${dto.firstName || ''} ${dto.lastName || ''}`.trim()
      : currentParsed.fullName;

    const newBioPayload = JSON.stringify({
      name: newFullName,
      schedule: dto.schedule !== undefined ? dto.schedule : currentParsed.schedule,
      bio: dto.bio !== undefined ? dto.bio : currentParsed.bio,
    });

    return this.prisma.doctor.update({
      where: { id },
      data: {
        departmentId: dto.departmentId !== undefined ? dto.departmentId : existing.departmentId,
        specialization: dto.specialization !== undefined ? dto.specialization : existing.specialization,
        licenseNumber: dto.licenseNumber !== undefined ? dto.licenseNumber : existing.licenseNumber,
        qualification: dto.qualification !== undefined ? dto.qualification : existing.qualification,
        experienceYears: dto.experienceYears !== undefined ? dto.experienceYears : existing.experienceYears,
        consultationFee: dto.consultationFee !== undefined ? dto.consultationFee : existing.consultationFee,
        isAvailable: dto.isAvailable !== undefined ? dto.isAvailable : existing.isAvailable,
        bio: newBioPayload,
      },
      include: {
        department: true,
      },
    });
  }

  async toggleAvailability(clinicId: string, id: string) {
    const existing = await this.prisma.doctor.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Doctor record not found.');
    }

    return this.prisma.doctor.update({
      where: { id },
      data: { isAvailable: !existing.isAvailable },
    });
  }

  async deleteDoctor(clinicId: string, id: string) {
    const existing = await this.prisma.doctor.findFirst({
      where: { id, clinicId, deletedAt: null },
    });

    if (!existing) {
      throw new NotFoundException('Doctor record not found.');
    }

    return this.prisma.doctor.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
