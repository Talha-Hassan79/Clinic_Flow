import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';

@Module({
  controllers: [ClinicsController],
  providers: [ClinicsService, PrismaService],
  exports: [ClinicsService],
})
export class ClinicsModule {}
