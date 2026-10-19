import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type { CreateNotificationDto, QueryNotificationsDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(clinicId: string, userId: string, query?: QueryNotificationsDto) {
    const where: any = {
      clinicId,
      userId,
    };

    if (query?.type) where.type = query.type;
    if (query?.isRead !== undefined) where.isRead = query.isRead;

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.notification.count({
        where: {
          clinicId,
          userId,
          isRead: false,
        },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(clinicId: string, userId: string, id: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, clinicId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Notification not found.');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(clinicId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { clinicId, userId, isRead: false },
      data: { isRead: true },
    });

    return { message: 'All notifications marked as read.' };
  }

  async create(clinicId: string, dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        clinicId,
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type,
      },
    });
  }
}
