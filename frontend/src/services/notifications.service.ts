import { api } from './api';

export type NotificationType = 'APPOINTMENT' | 'BILLING' | 'REMINDER' | 'SYSTEM';

export interface NotificationItem {
  id: string;
  clinicId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export const notificationsService = {
  list: async (params?: { type?: NotificationType; isRead?: boolean }): Promise<NotificationsResponse> => {
    const res = await api.get<NotificationsResponse>('/notifications', { params });
    return res.data;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const res = await api.patch<NotificationItem>(`/notifications/${id}/read`);
    return res.data;
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const res = await api.patch<{ message: string }>('/notifications/read-all');
    return res.data;
  },
};
