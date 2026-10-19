import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  WAITING = 'WAITING',
  IN_CONSULTATION = 'IN_CONSULTATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export class CreateAppointmentDto {
  @ApiProperty({ example: 'patient-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  patientId!: string;

  @ApiProperty({ example: 'doctor-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  doctorId!: string;

  @ApiProperty({ example: '2026-09-10' })
  @IsNotEmpty()
  @IsDateString()
  appointmentDate!: string;

  @ApiProperty({ example: '10:00 AM' })
  @IsNotEmpty()
  @IsString()
  appointmentTime!: string;

  @ApiPropertyOptional({ example: 'General checkup & persistent dry cough' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Regular follow-up' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Follow-up' })
  @IsOptional()
  @IsString()
  type?: string;
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: '2026-09-10' })
  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @ApiPropertyOptional({ example: '11:30 AM' })
  @IsOptional()
  @IsString()
  appointmentTime?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: 'Severe headache and fever' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'Patient rescheduled' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({ enum: AppointmentStatus })
  @IsNotEmpty()
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}

export class QueryAppointmentsDto {
  @ApiPropertyOptional({ example: 'Tariq' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'doctor-uuid-here' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'patient-uuid-here' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: '2026-09-10' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}
