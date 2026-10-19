import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VitalsDto {
  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional()
  @IsString()
  bp?: string;

  @ApiPropertyOptional({ example: '76' })
  @IsOptional()
  @IsString()
  pulse?: string;

  @ApiPropertyOptional({ example: '98.6' })
  @IsOptional()
  @IsString()
  temp?: string;

  @ApiPropertyOptional({ example: '70' })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiPropertyOptional({ example: '98' })
  @IsOptional()
  @IsString()
  spo2?: string;
}

export class CreateMedicalRecordDto {
  @ApiProperty({ example: 'patient-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  patientId!: string;

  @ApiProperty({ example: 'doctor-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  doctorId!: string;

  @ApiProperty({ example: '2026-09-09' })
  @IsNotEmpty()
  @IsDateString()
  visitDate!: string;

  @ApiProperty({ example: 'Severe throat pain and high fever for 3 days' })
  @IsNotEmpty()
  @IsString()
  chiefComplaint!: string;

  @ApiPropertyOptional({ example: 'Patient has difficulty swallowing, accompanied by dry cough.' })
  @IsOptional()
  @IsString()
  history?: string;

  @ApiPropertyOptional({ example: 'Pharyngeal erythema, tonsillar exudate present, no lymphadenopathy.' })
  @IsOptional()
  @IsString()
  examination?: string;

  @ApiProperty({ example: 'Acute Tonsillitis' })
  @IsNotEmpty()
  @IsString()
  diagnosis!: string;

  @ApiProperty({ example: 'Amoxicillin 500mg TDS x 5 days, Paracetamol 500mg SOS, warm saline gargles' })
  @IsNotEmpty()
  @IsString()
  treatment!: string;

  @ApiPropertyOptional({ type: () => VitalsDto })
  @IsOptional()
  vitals?: VitalsDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class UpdateMedicalRecordDto {
  @ApiPropertyOptional({ example: '2026-09-09' })
  @IsOptional()
  @IsDateString()
  visitDate?: string;

  @ApiPropertyOptional({ example: 'Severe throat pain' })
  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'Patient symptoms worsening' })
  @IsOptional()
  @IsString()
  history?: string;

  @ApiPropertyOptional({ example: 'Erythema improved' })
  @IsOptional()
  @IsString()
  examination?: string;

  @ApiPropertyOptional({ example: 'Acute Tonsillitis' })
  @IsOptional()
  @IsString()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Continue medications for 2 more days' })
  @IsOptional()
  @IsString()
  treatment?: string;

  @ApiPropertyOptional({ type: () => VitalsDto })
  @IsOptional()
  vitals?: VitalsDto;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  attachments?: string[];
}

export class QueryMedicalRecordsDto {
  @ApiPropertyOptional({ example: 'Tonsillitis' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'patient-uuid-here' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: 'doctor-uuid-here' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

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
