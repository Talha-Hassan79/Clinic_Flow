import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum LabOrderStatus {
  ORDERED = 'ORDERED',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum LabVerificationStatus {
  PENDING_TECH_ENTRY = 'PENDING_TECH_ENTRY',
  PENDING_PATHOLOGIST_APPROVAL = 'PENDING_PATHOLOGIST_APPROVAL',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

export enum LabOrderPriority {
  ROUTINE = 'ROUTINE',
  URGENT = 'URGENT',
  STAT = 'STAT',
}

export class CreateLabOrderDto {
  @ApiProperty({ example: 'patient-uuid-here' })
  @IsNotEmpty()
  @IsUUID()
  patientId!: string;

  @ApiPropertyOptional({ example: 'doctor-uuid-here' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiProperty({ example: 'Complete Blood Count (CBC)' })
  @IsNotEmpty()
  @IsString()
  testName!: string;

  @ApiPropertyOptional({ example: 'Hematology' })
  @IsOptional()
  @IsString()
  testCategory?: string;

  @ApiPropertyOptional({ example: 'Suspected Dengue fever. Check platelet count urgently.' })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @ApiPropertyOptional({ enum: LabOrderPriority, default: LabOrderPriority.ROUTINE })
  @IsOptional()
  @IsEnum(LabOrderPriority)
  priority?: LabOrderPriority = LabOrderPriority.ROUTINE;
}

export class CollectSampleDto {
  @ApiPropertyOptional({ example: 'SMP-2026-9481' })
  @IsOptional()
  @IsString()
  sampleToken?: string;

  @ApiPropertyOptional({ example: 'EDTA Whole Blood / Red Top Tube' })
  @IsOptional()
  @IsString()
  sampleType?: string;
}

export class UpdateLabResultsDto {
  @ApiPropertyOptional({ enum: LabOrderStatus })
  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;

  @ApiPropertyOptional({
    example: {
      hemoglobin: { value: '14.2', unit: 'g/dL', normalRange: '13.0 - 17.0', flag: 'NORMAL' },
      wbc: { value: '12,500', unit: '/mcL', normalRange: '4,000 - 11,000', flag: 'HIGH' },
      platelets: { value: '110,000', unit: '/mcL', normalRange: '150,000 - 450,000', flag: 'LOW' },
    },
  })
  @IsOptional()
  results?: Record<string, any>;

  @ApiPropertyOptional({ example: 'Sample showed mild thrombocytopenia.' })
  @IsOptional()
  @IsString()
  technicianNotes?: string;

  @ApiPropertyOptional({ example: 'https://cdn.clinicflow.com/reports/sample.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string;
}

export class ApproveLabOrderDto {
  @ApiPropertyOptional({ example: 'Results verified and consistent with clinical diagnosis.' })
  @IsOptional()
  @IsString()
  pathologistNotes?: string;

  @ApiPropertyOptional({ example: 'Dr. Tariq Mahmood (FCPS Pathology)' })
  @IsOptional()
  @IsString()
  pathologistName?: string;
}

export class CatalogParameterItemDto {
  @ApiProperty({ example: 'hb' })
  @IsNotEmpty()
  @IsString()
  paramKey!: string;

  @ApiProperty({ example: 'Hemoglobin' })
  @IsNotEmpty()
  @IsString()
  paramLabel!: string;

  @ApiProperty({ example: 'g/dL' })
  @IsNotEmpty()
  @IsString()
  unit!: string;

  @ApiProperty({ example: '13.5 - 17.5' })
  @IsNotEmpty()
  @IsString()
  normalRange!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateCatalogTestDto {
  @ApiProperty({ example: 'Liver Function Test (LFT)' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Biochemistry' })
  @IsNotEmpty()
  @IsString()
  category!: string;

  @ApiPropertyOptional({ example: 'Panel measuring bilirubin, ALT, AST, ALP, total protein' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1200 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: '4-6 hours' })
  @IsOptional()
  @IsString()
  turnaround?: string;

  @ApiPropertyOptional({ type: [CatalogParameterItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogParameterItemDto)
  parameters?: CatalogParameterItemDto[];
}

export class UpdateCatalogTestDto {
  @ApiPropertyOptional({ example: 'Liver Function Test (LFT)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Biochemistry' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Panel measuring bilirubin, ALT, AST, ALP, total protein' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ example: '3-4 hours' })
  @IsOptional()
  @IsString()
  turnaround?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [CatalogParameterItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogParameterItemDto)
  parameters?: CatalogParameterItemDto[];
}

export class QueryLabOrdersDto {
  @ApiPropertyOptional({ example: 'Tariq' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LabOrderStatus })
  @IsOptional()
  @IsEnum(LabOrderStatus)
  status?: LabOrderStatus;

  @ApiPropertyOptional({ example: 'Hematology' })
  @IsOptional()
  @IsString()
  testCategory?: string;

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
