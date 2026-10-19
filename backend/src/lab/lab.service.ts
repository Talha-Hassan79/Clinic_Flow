import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import {
  CreateLabOrderDto,
  UpdateLabResultsDto,
  QueryLabOrdersDto,
  CollectSampleDto,
  ApproveLabOrderDto,
  CreateCatalogTestDto,
  UpdateCatalogTestDto,
  LabOrderStatus,
  LabVerificationStatus,
} from './dto/lab.dto';

@Injectable()
export class LabService {
  constructor(private prisma: PrismaService) {}

  private generateSampleToken(): string {
    const random = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    return `SMP-${dateStr}-${random}`;
  }

  async getLabStats(clinicId: string) {
    const allReports = await this.prisma.labReport.findMany({
      where: { clinicId },
      select: {
        fileUrl: true,
        uploadedAt: true,
        verificationStatus: true,
      },
    });

    let totalOrders = allReports.length;
    let pendingSamples = 0;
    let inProgress = 0;
    let pendingApproval = 0;
    let completedToday = 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const r of allReports) {
      let status = LabOrderStatus.ORDERED;
      try {
        if (r.fileUrl && r.fileUrl.startsWith('{')) {
          const parsed = JSON.parse(r.fileUrl);
          status = parsed.status || LabOrderStatus.COMPLETED;
        }
      } catch {
        // fallback
      }

      if (status === LabOrderStatus.ORDERED) {
        pendingSamples++;
      } else if (status === LabOrderStatus.SAMPLE_COLLECTED || status === LabOrderStatus.IN_PROGRESS) {
        inProgress++;
      } else if (
        status === LabOrderStatus.PENDING_APPROVAL ||
        r.verificationStatus === ('PENDING_PATHOLOGIST_APPROVAL' as any)
      ) {
        pendingApproval++;
      } else if (
        status === LabOrderStatus.COMPLETED ||
        r.verificationStatus === ('APPROVED' as any)
      ) {
        if (new Date(r.uploadedAt) >= todayStart) {
          completedToday++;
        }
      }
    }

    return {
      totalOrders,
      pendingSamples,
      inProgress,
      pendingApproval,
      completedToday,
    };
  }

  async listLabOrders(clinicId: string, query: QueryLabOrdersDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      clinicId,
    };

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { reportName: { contains: s, mode: 'insensitive' } },
        { sampleToken: { contains: s, mode: 'insensitive' } },
        { patient: { firstName: { contains: s, mode: 'insensitive' } } },
        { patient: { lastName: { contains: s, mode: 'insensitive' } } },
        { patient: { phone: { contains: s, mode: 'insensitive' } } },
        { patient: { cnic: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [total, reports] = await Promise.all([
      this.prisma.labReport.count({ where }),
      this.prisma.labReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
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
              bio: true,
            },
          },
        },
      }),
    ]);

    const parsedData = reports.map((r) => {
      let orderMeta: any = {
        status: LabOrderStatus.COMPLETED,
        priority: 'ROUTINE',
        testCategory: 'General Lab Test',
        results: null,
        clinicalNotes: '',
        technicianNotes: '',
        sampleType: 'Blood',
      };

      try {
        if (r.fileUrl && r.fileUrl.startsWith('{')) {
          orderMeta = { ...orderMeta, ...JSON.parse(r.fileUrl) };
        }
      } catch {
        // keep defaults
      }

      return {
        id: r.id,
        clinicId: r.clinicId,
        patientId: r.patientId,
        doctorId: r.doctorId,
        reportName: r.reportName,
        uploadedAt: r.uploadedAt,
        sampleToken: r.sampleToken || orderMeta.sampleToken,
        sampleCollectedAt: r.sampleCollectedAt || orderMeta.sampleCollectedAt,
        verificationStatus: r.verificationStatus,
        pathologistId: r.pathologistId,
        pathologistSignedAt: r.pathologistSignedAt,
        pathologistNotes: r.pathologistNotes || orderMeta.pathologistNotes,
        patient: r.patient,
        doctor: r.doctor,
        ...orderMeta,
      };
    });

    const finalData = query.status
      ? parsedData.filter((item) => item.status === query.status)
      : parsedData;

    return {
      data: finalData,
      meta: {
        total: query.status ? finalData.length : total,
        page,
        limit,
        totalPages: Math.ceil((query.status ? finalData.length : total) / limit),
      },
    };
  }

  async getLabOrderById(clinicId: string, id: string) {
    const report = await this.prisma.labReport.findFirst({
      where: { id, clinicId },
      include: {
        patient: true,
        doctor: true,
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Lab order or report record not found.');
    }

    let orderMeta: any = {
      status: LabOrderStatus.COMPLETED,
      priority: 'ROUTINE',
      testCategory: 'General Lab Test',
      results: null,
      clinicalNotes: '',
      technicianNotes: '',
      sampleType: 'Blood',
    };

    try {
      if (report.fileUrl && report.fileUrl.startsWith('{')) {
        orderMeta = { ...orderMeta, ...JSON.parse(report.fileUrl) };
      }
    } catch {
      // keep defaults
    }

    return {
      ...report,
      sampleToken: report.sampleToken || orderMeta.sampleToken,
      sampleCollectedAt: report.sampleCollectedAt || orderMeta.sampleCollectedAt,
      verificationStatus: report.verificationStatus,
      pathologistSignedAt: report.pathologistSignedAt,
      pathologistNotes: report.pathologistNotes || orderMeta.pathologistNotes,
      ...orderMeta,
    };
  }

  async getPublicVerificationReport(id: string) {
    const report = await this.prisma.labReport.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            bloodGroup: true,
          },
        },
        clinic: {
          select: {
            name: true,
            phone: true,
            email: true,
            address: true,
            city: true,
          },
        },
        doctor: {
          select: {
            specialization: true,
            qualification: true,
            bio: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Diagnostic report not found or invalid QR code.');
    }

    let orderMeta: any = {
      status: LabOrderStatus.COMPLETED,
      priority: 'ROUTINE',
      testCategory: 'General Lab Test',
      results: null,
      technicianNotes: '',
    };

    try {
      if (report.fileUrl && report.fileUrl.startsWith('{')) {
        orderMeta = { ...orderMeta, ...JSON.parse(report.fileUrl) };
      }
    } catch {
      // keep defaults
    }

    return {
      id: report.id,
      reportName: report.reportName,
      uploadedAt: report.uploadedAt,
      sampleToken: report.sampleToken || orderMeta.sampleToken,
      sampleCollectedAt: report.sampleCollectedAt || orderMeta.sampleCollectedAt,
      verificationStatus: report.verificationStatus,
      pathologistSignedAt: report.pathologistSignedAt,
      pathologistNotes: report.pathologistNotes || orderMeta.pathologistNotes,
      patient: report.patient,
      clinic: report.clinic,
      doctor: report.doctor,
      ...orderMeta,
    };
  }

  async createLabOrder(clinicId: string, dto: CreateLabOrderDto) {
    const patient = await this.prisma.patient.findFirst({
      where: { id: dto.patientId, clinicId, deletedAt: null },
    });
    if (!patient) {
      throw new NotFoundException('Patient record not found.');
    }

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

    const sampleToken = this.generateSampleToken();

    const payload = {
      status: LabOrderStatus.ORDERED,
      priority: dto.priority || 'ROUTINE',
      testCategory: dto.testCategory || 'General Pathology',
      clinicalNotes: dto.clinicalNotes || '',
      orderedAt: new Date().toISOString(),
      sampleToken,
      results: null,
      technicianNotes: '',
    };

    return this.prisma.labReport.create({
      data: {
        clinicId,
        patientId: dto.patientId,
        doctorId,
        reportName: dto.testName,
        sampleToken,
        verificationStatus: 'PENDING_TECH_ENTRY' as any,
        fileUrl: JSON.stringify(payload),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            cnic: true,
          },
        },
      },
    });
  }

  async collectSample(clinicId: string, id: string, dto: CollectSampleDto) {
    const report = await this.prisma.labReport.findFirst({
      where: { id, clinicId },
    });

    if (!report) {
      throw new NotFoundException('Lab order not found.');
    }

    let currentMeta: any = {};
    try {
      if (report.fileUrl && report.fileUrl.startsWith('{')) {
        currentMeta = JSON.parse(report.fileUrl);
      }
    } catch {
      // ignore
    }

    const collectedAt = new Date();
    const token = dto.sampleToken || report.sampleToken || this.generateSampleToken();

    const updatedMeta = {
      ...currentMeta,
      status: LabOrderStatus.SAMPLE_COLLECTED,
      sampleToken: token,
      sampleType: dto.sampleType || currentMeta.sampleType || 'Venous Blood',
      sampleCollectedAt: collectedAt.toISOString(),
    };

    return this.prisma.labReport.update({
      where: { id },
      data: {
        sampleToken: token,
        sampleCollectedAt: collectedAt,
        fileUrl: JSON.stringify(updatedMeta),
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async updateLabResults(clinicId: string, id: string, dto: UpdateLabResultsDto) {
    const report = await this.prisma.labReport.findFirst({
      where: { id, clinicId },
    });

    if (!report) {
      throw new NotFoundException('Lab order not found.');
    }

    let currentMeta: any = {
      status: LabOrderStatus.ORDERED,
      priority: 'ROUTINE',
      testCategory: 'General Lab Test',
      results: null,
      clinicalNotes: '',
      technicianNotes: '',
    };

    try {
      if (report.fileUrl && report.fileUrl.startsWith('{')) {
        currentMeta = { ...currentMeta, ...JSON.parse(report.fileUrl) };
      }
    } catch {
      // keep defaults
    }

    // Two-step verification: Tech entry advances status to PENDING_APPROVAL unless explicitly overridden
    const newStatus =
      dto.status ||
      (currentMeta.status === LabOrderStatus.COMPLETED
        ? LabOrderStatus.COMPLETED
        : LabOrderStatus.PENDING_APPROVAL);

    const verificationStatus =
      newStatus === LabOrderStatus.COMPLETED
        ? ('APPROVED' as any)
        : ('PENDING_PATHOLOGIST_APPROVAL' as any);

    const updatedMeta = {
      ...currentMeta,
      status: newStatus,
      results: dto.results !== undefined ? dto.results : currentMeta.results,
      technicianNotes:
        dto.technicianNotes !== undefined
          ? dto.technicianNotes
          : currentMeta.technicianNotes,
      techSubmittedAt: new Date().toISOString(),
      fileUrl: dto.fileUrl || currentMeta.fileUrl,
    };

    return this.prisma.labReport.update({
      where: { id },
      data: {
        verificationStatus,
        fileUrl: JSON.stringify(updatedMeta),
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async approveLabOrder(
    clinicId: string,
    id: string,
    userId: string,
    dto: ApproveLabOrderDto,
  ) {
    const report = await this.prisma.labReport.findFirst({
      where: { id, clinicId },
    });

    if (!report) {
      throw new NotFoundException('Lab order not found.');
    }

    let currentMeta: any = {};
    try {
      if (report.fileUrl && report.fileUrl.startsWith('{')) {
        currentMeta = JSON.parse(report.fileUrl);
      }
    } catch {
      // ignore
    }

    const now = new Date();
    const updatedMeta = {
      ...currentMeta,
      status: LabOrderStatus.COMPLETED,
      pathologistNotes: dto.pathologistNotes || 'Verified & approved by Consultant Pathologist.',
      pathologistName: dto.pathologistName || 'Consultant Pathologist',
      pathologistSignedAt: now.toISOString(),
      completedAt: now.toISOString(),
    };

    return this.prisma.labReport.update({
      where: { id },
      data: {
        verificationStatus: 'APPROVED' as any,
        pathologistId: userId,
        pathologistSignedAt: now,
        pathologistNotes: dto.pathologistNotes || 'Verified & approved by Consultant Pathologist.',
        fileUrl: JSON.stringify(updatedMeta),
      },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async deleteLabOrder(clinicId: string, id: string) {
    const report = await this.prisma.labReport.findFirst({
      where: { id, clinicId },
    });

    if (!report) {
      throw new NotFoundException('Lab order not found.');
    }

    return this.prisma.labReport.delete({
      where: { id },
    });
  }

  // ─────────────────────────────────────────────
  // CUSTOM TEST CATALOG MANAGEMENT
  // ─────────────────────────────────────────────

  async listCatalog(clinicId: string) {
    return this.prisma.labTestCatalog.findMany({
      where: { clinicId },
      include: {
        parameters: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCatalogItem(clinicId: string, id: string) {
    const item = await this.prisma.labTestCatalog.findFirst({
      where: { id, clinicId },
      include: {
        parameters: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Test catalog item not found.');
    }

    return item;
  }

  async createCatalogItem(clinicId: string, dto: CreateCatalogTestDto) {
    return this.prisma.labTestCatalog.create({
      data: {
        clinicId,
        name: dto.name,
        category: dto.category,
        description: dto.description || '',
        price: dto.price !== undefined ? dto.price : 0,
        turnaround: dto.turnaround || '24 hours',
        parameters: {
          create: (dto.parameters || []).map((p, idx) => ({
            paramKey: p.paramKey,
            paramLabel: p.paramLabel,
            unit: p.unit,
            normalRange: p.normalRange,
            sortOrder: p.sortOrder !== undefined ? p.sortOrder : idx,
          })),
        },
      },
      include: {
        parameters: true,
      },
    });
  }

  async updateCatalogItem(clinicId: string, id: string, dto: UpdateCatalogTestDto) {
    const existing = await this.prisma.labTestCatalog.findFirst({
      where: { id, clinicId },
    });

    if (!existing) {
      throw new NotFoundException('Test catalog item not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.parameters && dto.parameters.length > 0) {
        await tx.labCatalogParameter.deleteMany({
          where: { catalogId: id },
        });

        await tx.labCatalogParameter.createMany({
          data: dto.parameters.map((p, idx) => ({
            catalogId: id,
            paramKey: p.paramKey,
            paramLabel: p.paramLabel,
            unit: p.unit,
            normalRange: p.normalRange,
            sortOrder: p.sortOrder !== undefined ? p.sortOrder : idx,
          })),
        });
      }

      return tx.labTestCatalog.update({
        where: { id },
        data: {
          name: dto.name,
          category: dto.category,
          description: dto.description,
          price: dto.price !== undefined ? dto.price : undefined,
          turnaround: dto.turnaround,
          isActive: dto.isActive,
        },
        include: {
          parameters: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    });
  }

  async deleteCatalogItem(clinicId: string, id: string) {
    const existing = await this.prisma.labTestCatalog.findFirst({
      where: { id, clinicId },
    });

    if (!existing) {
      throw new NotFoundException('Test catalog item not found.');
    }

    return this.prisma.labTestCatalog.delete({
      where: { id },
    });
  }
}
