import { apiClient } from './axios';

export interface NotificationItem {
  id: string;
  source: string;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  getNotifications: async (): Promise<NotificationItem[]> => {
    const response = await apiClient.get<NotificationItem[]>('/notifications');
    return response.data;
  },

  markAsRead: async (notificationIds: string[]): Promise<void> => {
    await apiClient.post('/notifications/mark-read', {
      notification_ids: notificationIds,
    });
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.post('/notifications/mark-all-read');
  },
};
