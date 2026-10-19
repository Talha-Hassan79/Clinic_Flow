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
  CreateDoctorDto,
  UpdateDoctorDto,
  QueryDoctorsDto,
} from './dto/doctor.dto';
import { DoctorsService } from './doctors.service';

@ApiTags('Doctor Management')
@Controller('doctors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get summary statistics of doctors and departments' })
  getDoctorStats(@Req() req: any) {
    return this.doctorsService.getDoctorStats(req.user.clinicId);
  }

  @Get('departments')
  @ApiOperation({ summary: 'List all clinic medical departments' })
  listDepartments(@Req() req: any) {
    return this.doctorsService.listDepartments(req.user.clinicId);
  }

  @Get()
  @ApiOperation({ summary: 'List clinic doctors with filters and pagination' })
  listDoctors(@Req() req: any, @Query() query: QueryDoctorsDto) {
    return this.doctorsService.listDoctors(req.user.clinicId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get doctor profile with qualifications and schedule' })
  getDoctorById(@Req() req: any, @Param('id') id: string) {
    return this.doctorsService.getDoctorById(req.user.clinicId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new doctor profile' })
  @ApiResponse({ status: 201, description: 'Doctor created successfully' })
  createDoctor(@Req() req: any, @Body() dto: CreateDoctorDto) {
    return this.doctorsService.createDoctor(req.user.clinicId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update doctor details, consultation fees, and schedule' })
  updateDoctor(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateDoctorDto,
  ) {
    return this.doctorsService.updateDoctor(req.user.clinicId, id, dto);
  }

  @Patch(':id/toggle-availability')
  @ApiOperation({ summary: 'Toggle doctor active availability status' })
  toggleAvailability(@Req() req: any, @Param('id') id: string) {
    return this.doctorsService.toggleAvailability(req.user.clinicId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete doctor record' })
  deleteDoctor(@Req() req: any, @Param('id') id: string) {
    return this.doctorsService.deleteDoctor(req.user.clinicId, id);
  }
}
