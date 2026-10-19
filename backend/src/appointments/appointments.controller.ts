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
  CreateAppointmentDto,
  UpdateAppointmentDto,
  UpdateAppointmentStatusDto,
  QueryAppointmentsDto,
} from './dto/appointment.dto';
import { AppointmentsService } from './appointments.service';

@ApiTags('Appointment Scheduling & Queue')
@Controller('appointments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get appointment KPI metrics for clinic' })
  getStats(@Req() req: any) {
    return this.appointmentsService.getStats(req.user.clinicId);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Get available time slots for a doctor on a specific date' })
  getSlots(
    @Req() req: any,
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(
      req.user.clinicId,
      doctorId,
      date || new Date().toISOString().split('T')[0],
    );
  }

  @Get()
  @ApiOperation({ summary: 'List and filter clinic appointments with pagination' })
  listAppointments(@Req() req: any, @Query() query: QueryAppointmentsDto) {
    return this.appointmentsService.listAppointments(req.user.clinicId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single appointment record' })
  getAppointmentById(@Req() req: any, @Param('id') id: string) {
    return this.appointmentsService.getAppointmentById(req.user.clinicId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Book a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  createAppointment(@Req() req: any, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.createAppointment(req.user.clinicId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update or reschedule appointment' })
  updateAppointment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.updateAppointment(req.user.clinicId, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update appointment lifecycle status' })
  updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.appointmentsService.updateStatus(req.user.clinicId, id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel / delete appointment' })
  deleteAppointment(@Req() req: any, @Param('id') id: string) {
    return this.appointmentsService.deleteAppointment(req.user.clinicId, id);
  }
}
