import { Module } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';

@Module({
  controllers: [DoctorsController],
  providers: [DoctorsService, PrismaService],
  exports: [DoctorsService],
})
export class DoctorsModule {}
