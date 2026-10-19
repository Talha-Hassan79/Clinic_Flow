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
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
  QueryMedicalRecordsDto,
} from './dto/medical-record.dto';
import { MedicalRecordsService } from './medical-records.service';

@ApiTags('Medical Records (EMR)')
@Controller('medical-records')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class MedicalRecordsController {
  constructor(private readonly medicalRecordsService: MedicalRecordsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get clinical encounter and diagnosis statistics' })
  getStats(@Req() req: any) {
    return this.medicalRecordsService.getStats(req.user.clinicId);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter medical records with pagination' })
  listRecords(@Req() req: any, @Query() query: QueryMedicalRecordsDto) {
    return this.medicalRecordsService.listRecords(req.user.clinicId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single medical record encounter' })
  getRecordById(@Req() req: any, @Param('id') id: string) {
    return this.medicalRecordsService.getRecordById(req.user.clinicId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new clinical encounter (EMR)' })
  @ApiResponse({ status: 201, description: 'Medical record created successfully' })
  createRecord(@Req() req: any, @Body() dto: CreateMedicalRecordDto) {
    return this.medicalRecordsService.createRecord(req.user.clinicId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update clinical encounter notes' })
  updateRecord(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMedicalRecordDto,
  ) {
    return this.medicalRecordsService.updateRecord(req.user.clinicId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete clinical record' })
  deleteRecord(@Req() req: any, @Param('id') id: string) {
    return this.medicalRecordsService.deleteRecord(req.user.clinicId, id);
  }
}
