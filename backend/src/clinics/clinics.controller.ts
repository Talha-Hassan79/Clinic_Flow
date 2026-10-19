import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClinicsService } from './clinics.service';
import { UpdateClinicDto } from './dto/clinic.dto';

@ApiTags('Clinic Workspaces')
@Controller('clinics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get('my-clinic')
  @ApiOperation({ summary: 'Get current clinic tenant profile details' })
  @ApiResponse({ status: 200, description: 'Clinic details retrieved successfully' })
  getClinic(@Req() req: any) {
    return this.clinicsService.getClinicDetails(req.user.clinicId);
  }

  @Patch('my-clinic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update clinic tenant workspace details' })
  @ApiResponse({ status: 200, description: 'Clinic details updated successfully' })
  @ApiResponse({ status: 403, description: 'Only Clinic Owners can modify settings' })
  updateClinic(@Req() req: any, @Body() dto: UpdateClinicDto) {
    // Only Clinic Owner and Super Admin are permitted to modify clinic parameters
    const role = req.user.roleName;
    if (role !== 'Clinic Owner' && role !== 'Super Admin') {
      throw new ForbiddenException('You do not have permissions to modify workspace settings.');
    }

    return this.clinicsService.updateClinicDetails(req.user.clinicId, dto);
  }
}
