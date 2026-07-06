import { notificationRepository } from '@/server/repositories/notification-repository';

type NotificationType = 'APPLICATION_STATUS_CHANGED' | 'NEW_APPLICATION';

interface CreateNotificationInput {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  applicationId?: string;
  vacancyId?: string;
}

export const notificationService = {
  async createNotification(input: CreateNotificationInput) {
    console.log('Creating notification:', input);
    const result = await notificationRepository.create(input);
    console.log('Notification created:', result);
    return result;
  },

  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
    return notificationRepository.findByUserId(userId, limit, offset);
  },

  async getUnreadCount(userId: string) {
    return notificationRepository.findUnreadCount(userId);
  },

  async markAsRead(notificationId: string) {
    return notificationRepository.updateRead(notificationId);
  },

  async markAllAsRead(userId: string) {
    return notificationRepository.updateAllRead(userId);
  },

  async deleteNotification(notificationId: string) {
    return notificationRepository.delete(notificationId);
  },

  async getNotification(notificationId: string) {
    return notificationRepository.findById(notificationId);
  },
};
