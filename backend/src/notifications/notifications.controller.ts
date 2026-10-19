import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import type { CreateNotificationDto, QueryNotificationsDto } from './dto/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(
    @Req() req: { user: { clinicId: string; userId: string } },
    @Query() query: QueryNotificationsDto,
  ) {
    return this.notificationsService.list(req.user.clinicId, req.user.userId, query);
  }

  @Patch(':id/read')
  markAsRead(
    @Req() req: { user: { clinicId: string; userId: string } },
    @Param('id') id: string,
  ) {
    return this.notificationsService.markAsRead(req.user.clinicId, req.user.userId, id);
  }

  @Patch('read-all')
  markAllAsRead(@Req() req: { user: { clinicId: string; userId: string } }) {
    return this.notificationsService.markAllAsRead(req.user.clinicId, req.user.userId);
  }

  @Post()
  create(
    @Req() req: { user: { clinicId: string } },
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(req.user.clinicId, dto);
  }
}
