import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto, DashboardActivityDto } from './dto/dashboard.dto';

@ApiTags('Dashboard Analytics')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get current workspace statistics and timeline chart metrics' })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  getStats(@Req() req: any): Promise<DashboardStatsDto> {
    return this.dashboardService.getStats(req.user.clinicId);
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent activity logs/actions in this workspace' })
  @ApiResponse({ status: 200, type: [DashboardActivityDto] })
  getActivities(@Req() req: any): Promise<DashboardActivityDto[]> {
    return this.dashboardService.getActivities(req.user.clinicId);
  }
}
