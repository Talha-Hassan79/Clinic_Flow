import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateLabOrderDto,
  UpdateLabResultsDto,
  QueryLabOrdersDto,
  CollectSampleDto,
  ApproveLabOrderDto,
  CreateCatalogTestDto,
  UpdateCatalogTestDto,
} from './dto/lab.dto';
import { LabService } from './lab.service';

@ApiTags('Laboratory & Diagnostics')
@Controller('lab')
export class LabController {
  constructor(private readonly labService: LabService) {}

  // ── Public verification for QR code scan on printed report ──
  @Get('public/verify/:id')
  @ApiOperation({ summary: 'Public endpoint to verify authentic lab report via QR code' })
  verifyReportPublic(@Param('id') id: string) {
    return this.labService.getPublicVerificationReport(id);
  }

  // ── Protected endpoints ──
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get clinic laboratory queue statistics' })
  getLabStats(@Req() req: any) {
    return this.labService.getLabStats(req.user.clinicId);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all diagnostic lab orders and test reports' })
  listLabOrders(@Req() req: any, @Query() query: QueryLabOrdersDto) {
    return this.labService.listLabOrders(req.user.clinicId, query);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get full lab test report with patient info for printing' })
  getLabOrderById(@Req() req: any, @Param('id') id: string) {
    return this.labService.getLabOrderById(req.user.clinicId, id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Doctor orders a lab test for a patient' })
  @ApiResponse({ status: 201, description: 'Lab order created successfully' })
  createLabOrder(@Req() req: any, @Body() dto: CreateLabOrderDto) {
    return this.labService.createLabOrder(req.user.clinicId, dto);
  }

  @Patch('orders/:id/collect-sample')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Record sample collection and barcode token' })
  collectSample(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CollectSampleDto,
  ) {
    return this.labService.collectSample(req.user.clinicId, id, dto);
  }

  @Patch('orders/:id/results')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Lab technician enters test findings and submits for sign-off' })
  updateLabResults(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateLabResultsDto,
  ) {
    return this.labService.updateLabResults(req.user.clinicId, id, dto);
  }

  @Patch('orders/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Pathologist / Senior Doctor reviews, signs off and releases report' })
  approveLabOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApproveLabOrderDto,
  ) {
    return this.labService.approveLabOrder(
      req.user.clinicId,
      id,
      req.user.userId || req.user.id,
      dto,
    );
  }

  @Delete('orders/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel or delete lab order' })
  deleteLabOrder(@Req() req: any, @Param('id') id: string) {
    return this.labService.deleteLabOrder(req.user.clinicId, id);
  }

  // ── Custom Test Catalog Endpoints ──
  @Get('catalog')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List custom lab test catalog profiles' })
  listCatalog(@Req() req: any) {
    return this.labService.listCatalog(req.user.clinicId);
  }

  @Get('catalog/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get single catalog test template' })
  getCatalogItem(@Req() req: any, @Param('id') id: string) {
    return this.labService.getCatalogItem(req.user.clinicId, id);
  }

  @Post('catalog')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create custom test profile with parameters and pricing' })
  createCatalogItem(@Req() req: any, @Body() dto: CreateCatalogTestDto) {
    return this.labService.createCatalogItem(req.user.clinicId, dto);
  }

  @Patch('catalog/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update test profile, parameters or pricing' })
  updateCatalogItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCatalogTestDto,
  ) {
    return this.labService.updateCatalogItem(req.user.clinicId, id, dto);
  }

  @Delete('catalog/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete custom test catalog item' })
  deleteCatalogItem(@Req() req: any, @Param('id') id: string) {
    return this.labService.deleteCatalogItem(req.user.clinicId, id);
  }
}
