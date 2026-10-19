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
  CreatePatientDto,
  UpdatePatientDto,
  QueryPatientsDto,
  CreateLabReportDto,
} from './dto/patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('Patient Management & Lab Reports')
@Controller('patients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get summary statistics of patients and lab reports' })
  getStats(@Req() req: any) {
    return this.patientsService.getStats(req.user.clinicId);
  }

  @Get()
  @ApiOperation({ summary: 'List and filter clinic patients with pagination' })
  listPatients(@Req() req: any, @Query() query: QueryPatientsDto) {
    return this.patientsService.listPatients(req.user.clinicId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full patient profile with lab reports and history' })
  getPatientById(@Req() req: any, @Param('id') id: string) {
    return this.patientsService.getPatientById(req.user.clinicId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new patient' })
  @ApiResponse({ status: 201, description: 'Patient registered successfully' })
  createPatient(@Req() req: any, @Body() dto: CreatePatientDto) {
    return this.patientsService.createPatient(req.user.clinicId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update patient details' })
  updatePatient(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.updatePatient(req.user.clinicId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete patient record' })
  deletePatient(@Req() req: any, @Param('id') id: string) {
    return this.patientsService.deletePatient(req.user.clinicId, id);
  }

  // ─────────────────────────────────────────────
  // LAB REPORTS ENDPOINTS
  // ─────────────────────────────────────────────
  @Post(':id/lab-reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a lab test report (e.g. CBC, LFT, RFT, Lipid) for a patient' })
  addLabReport(
    @Req() req: any,
    @Param('id') patientId: string,
    @Body() dto: CreateLabReportDto,
  ) {
    return this.patientsService.addLabReport(req.user.clinicId, patientId, dto);
  }

  @Delete(':id/lab-reports/:reportId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a lab test report' })
  deleteLabReport(
    @Req() req: any,
    @Param('reportId') reportId: string,
  ) {
    return this.patientsService.deleteLabReport(req.user.clinicId, reportId);
  }
}
