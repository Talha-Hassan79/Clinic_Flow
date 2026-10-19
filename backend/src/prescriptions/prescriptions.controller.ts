import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import type { CreatePrescriptionDto, UpdatePrescriptionDto, QueryPrescriptionsDto } from './dto/prescription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get('stats')
  getStats(@Req() req: { user: { clinicId: string } }) {
    return this.prescriptionsService.getStats(req.user.clinicId);
  }

  @Get()
  list(@Req() req: { user: { clinicId: string } }, @Query() query: QueryPrescriptionsDto) {
    return this.prescriptionsService.list(req.user.clinicId, query);
  }

  @Get(':id')
  findOne(@Req() req: { user: { clinicId: string } }, @Param('id') id: string) {
    return this.prescriptionsService.findOne(req.user.clinicId, id);
  }

  @Post()
  create(@Req() req: { user: { clinicId: string } }, @Body() dto: CreatePrescriptionDto) {
    return this.prescriptionsService.create(req.user.clinicId, dto);
  }

  @Patch(':id')
  update(
    @Req() req: { user: { clinicId: string } },
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
  ) {
    return this.prescriptionsService.update(req.user.clinicId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: { user: { clinicId: string } }, @Param('id') id: string) {
    return this.prescriptionsService.remove(req.user.clinicId, id);
  }
}
