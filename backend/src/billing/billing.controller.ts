import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import type {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  RecordPaymentDto,
  QueryInvoicesDto,
} from './dto/billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('stats')
  getStats(@Req() req: { user: { clinicId: string } }) {
    return this.billingService.getStats(req.user.clinicId);
  }

  @Get('invoices')
  list(
    @Req() req: { user: { clinicId: string } },
    @Query() query: QueryInvoicesDto,
  ) {
    return this.billingService.list(req.user.clinicId, query);
  }

  @Get('invoices/:id')
  findOne(
    @Req() req: { user: { clinicId: string } },
    @Param('id') id: string,
  ) {
    return this.billingService.findOne(req.user.clinicId, id);
  }

  @Post('invoices')
  create(
    @Req() req: { user: { clinicId: string } },
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.billingService.create(req.user.clinicId, dto);
  }

  @Patch('invoices/:id')
  update(
    @Req() req: { user: { clinicId: string } },
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.billingService.update(req.user.clinicId, id, dto);
  }

  @Post('invoices/:id/payments')
  recordPayment(
    @Req() req: { user: { clinicId: string } },
    @Param('id') id: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.billingService.recordPayment(req.user.clinicId, id, dto);
  }

  @Delete('invoices/:id')
  remove(
    @Req() req: { user: { clinicId: string } },
    @Param('id') id: string,
  ) {
    return this.billingService.remove(req.user.clinicId, id);
  }
}
