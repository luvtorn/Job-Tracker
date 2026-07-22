import { notFound } from '@/server/errors/application-error';
import { notificationRepository } from '@/server/repositories/notification-repository';
import { toNotificationDto } from '@/server/services/notification-formatter';
import type { NotificationMetadata, NotificationType } from '@/types/notification';

type CreateNotificationInput = {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  applicationId?: string;
  vacancyId?: string;
};

export const notificationService = {
  async createNotification(input: CreateNotificationInput) {
    return toNotificationDto(await notificationRepository.create(input));
  },
  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    return (await notificationRepository.findByUserId(userId, limit, offset)).map(toNotificationDto);
  },
  getUnreadCount(userId: string) {
    return notificationRepository.findUnreadCount(userId);
  },
  async markAsRead(userId: string, notificationId: string) {
    const result = await notificationRepository.updateReadForUser(notificationId, userId);
    if (result.count === 0) throw notFound('Notification not found');
  },
  markAllAsRead(userId: string) {
    return notificationRepository.updateAllRead(userId);
  },
  async deleteNotification(userId: string, notificationId: string) {
    const result = await notificationRepository.deleteForUser(notificationId, userId);
    if (result.count === 0) throw notFound('Notification not found');
  },
};
