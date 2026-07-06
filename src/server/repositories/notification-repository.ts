import { prisma } from '@/lib/prisma';

type NotificationType = 'APPLICATION_STATUS_CHANGED' | 'NEW_APPLICATION';

interface CreateNotificationInput {
  type: NotificationType;
  userId: string;
  title: string;
  message: string;
  applicationId?: string;
  vacancyId?: string;
}

export const notificationRepository = {
  async create(data: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        type: data.type,
        userId: data.userId,
        title: data.title,
        message: data.message,
        applicationId: data.applicationId,
        vacancyId: data.vacancyId,
      },
    });
  },

  async findByUserId(userId: string, limit: number = 50, offset: number = 0) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  },

  async findUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  },

  async updateRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  },

  async updateAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  },

  async delete(id: string) {
    return prisma.notification.delete({
      where: { id },
    });
  },

  async findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  },
};
