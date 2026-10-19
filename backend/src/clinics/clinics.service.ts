import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { UpdateClinicDto } from './dto/clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(private prisma: PrismaService) {}

  async getClinicDetails(clinicId: string) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic || clinic.deletedAt) {
      throw new NotFoundException('Clinic workspace not found.');
    }

    return clinic;
  }

  async updateClinicDetails(clinicId: string, dto: UpdateClinicDto) {
    const clinic = await this.prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic || clinic.deletedAt) {
      throw new NotFoundException('Clinic workspace not found.');
    }

    return this.prisma.clinic.update({
      where: { id: clinicId },
      data: dto,
    });
  }
}
