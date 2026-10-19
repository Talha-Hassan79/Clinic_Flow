import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus, PaymentMethod } from '@prisma/client';

export class CreateInvoiceDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tax?: number;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  tax?: number;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class RecordPaymentDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsOptional()
  @IsString()
  transactionReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryInvoicesDto {
  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
