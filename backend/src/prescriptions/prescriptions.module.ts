import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';

@Module({
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrismaService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
