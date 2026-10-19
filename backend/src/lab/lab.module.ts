import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { LabController } from './lab.controller';
import { LabService } from './lab.service';

@Module({
  controllers: [LabController],
  providers: [LabService, PrismaService],
  exports: [LabService],
})
export class LabModule {}
