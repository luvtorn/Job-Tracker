import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
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

export const notificationRepository = {
  create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        type: data.type,
        userId: data.userId,
        title: data.title,
        message: data.message,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
        applicationId: data.applicationId,
        vacancyId: data.vacancyId,
      },
    });
  },

  findByUserId(userId: string, limit = 50, offset = 0) {
    return prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit, skip: offset });
  },

  findUnreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  updateReadForUser(id: string, userId: string) {
    return prisma.notification.updateMany({ where: { id, userId, isRead: false }, data: { isRead: true } });
  },

  updateAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  },

  deleteForUser(id: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id, userId } });
  },
};
