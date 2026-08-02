import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const participantSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} as const;

const applicationParticipantWhere = (applicationId: string, userId: string) => ({
  id: applicationId,
  OR: [
    { userId },
    { vacancy: { recruiterId: userId } },
  ],
});

export const chatRepository = {
  findParticipantApplication(applicationId: string, userId: string) {
    return prisma.application.findFirst({
      where: applicationParticipantWhere(applicationId, userId),
      select: {
        id: true,
        status: true,
        userId: true,
        user: { select: { ...participantSelect, email: true, preferredLocale: true, chatEmailNotifications: true } },
        vacancyId: true,
        vacancy: {
          select: {
            title: true,
            company: true,
            recruiterId: true,
            recruiter: { select: { ...participantSelect, email: true, preferredLocale: true, chatEmailNotifications: true } },
          },
        },
      },
    });
  },

  async findChats(userId: string, cursor: string | undefined, limit: number) {
    let cursorPoint: { createdAt: Date; applicationId: string } | null = null;
    if (cursor) {
      const cursorMessage = await prisma.applicationMessage.findFirst({
        where: {
          id: cursor,
          application: {
            OR: [{ userId }, { vacancy: { recruiterId: userId } }],
          },
        },
        select: { createdAt: true, applicationId: true },
      });
      if (cursorMessage) cursorPoint = cursorMessage;
    }

    if (cursor && !cursorPoint) return null;
    return prisma.applicationChatState.findMany({
      where: {
        userId,
        lastMessageAt: { not: null },
        ...(cursorPoint ? {
          OR: [
            { lastMessageAt: { lt: cursorPoint.createdAt } },
            { lastMessageAt: cursorPoint.createdAt, applicationId: { lt: cursorPoint.applicationId } },
          ],
        } : {}),
      },
      include: {
        application: {
          select: {
            id: true,
            status: true,
            userId: true,
            user: { select: participantSelect },
            vacancy: {
              select: {
                title: true,
                company: true,
                recruiterId: true,
                recruiter: { select: participantSelect },
              },
            },
            messages: {
              orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
              take: 1,
              include: { sender: { select: participantSelect } },
            },
          },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { applicationId: 'desc' }],
      take: limit + 1,
    });
  },

  findMessage(applicationId: string, messageId: string) {
    return prisma.applicationMessage.findFirst({
      where: { id: messageId, applicationId },
      select: { id: true, applicationId: true, senderId: true, createdAt: true },
    });
  },

  findMessages(applicationId: string, before: { createdAt: Date; id: string } | null, limit: number) {
    return prisma.applicationMessage.findMany({
      where: {
        applicationId,
        ...(before ? {
          OR: [
            { createdAt: { lt: before.createdAt } },
            { createdAt: before.createdAt, id: { lt: before.id } },
          ],
        } : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      include: { sender: { select: participantSelect } },
    });
  },

  findChatStates(applicationId: string) {
    return prisma.applicationChatState.findMany({
      where: { applicationId },
      select: {
        userId: true,
        unreadCount: true,
        lastReadMessage: { select: { id: true, createdAt: true } },
      },
    });
  },

  getUnreadCount(userId: string) {
    return prisma.applicationChatState.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    });
  },

  async createMessage(input: {
    applicationId: string;
    senderId: string;
    clientMessageId: string;
    content: string;
  }) {
    try {
      return await prisma.$transaction(async (transaction) => {
      const application = await transaction.application.findFirst({
        where: applicationParticipantWhere(input.applicationId, input.senderId),
        select: {
          id: true,
          status: true,
          userId: true,
          user: { select: { ...participantSelect, email: true, preferredLocale: true, chatEmailNotifications: true } },
          vacancyId: true,
          vacancy: {
            select: {
              title: true,
              company: true,
              recruiterId: true,
              recruiter: { select: { ...participantSelect, email: true, preferredLocale: true, chatEmailNotifications: true } },
            },
          },
        },
      });
      if (!application) return { kind: 'NOT_FOUND' as const };

      const existing = await transaction.applicationMessage.findUnique({
        where: { senderId_clientMessageId: { senderId: input.senderId, clientMessageId: input.clientMessageId } },
        include: { sender: { select: participantSelect } },
      });
      if (existing) {
        return existing.applicationId === input.applicationId
          ? { kind: 'EXISTING' as const, message: existing, application }
          : { kind: 'CONFLICT' as const };
      }

      if (['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) {
        return { kind: 'READ_ONLY' as const };
      }

      const recipient = application.userId === input.senderId
        ? application.vacancy.recruiter
        : application.user;
      const sender = application.userId === input.senderId
        ? application.user
        : application.vacancy.recruiter;
      const message = await transaction.applicationMessage.create({
        data: {
          applicationId: application.id,
          senderId: input.senderId,
          clientMessageId: input.clientMessageId,
          content: input.content,
        },
        include: { sender: { select: participantSelect } },
      });

      await transaction.applicationChatState.upsert({
        where: { applicationId_userId: { applicationId: application.id, userId: input.senderId } },
        create: {
          applicationId: application.id,
          userId: input.senderId,
          unreadCount: 0,
          lastMessageAt: message.createdAt,
          lastReadMessageId: message.id,
        },
        update: {
          unreadCount: 0,
          lastMessageAt: message.createdAt,
          lastReadMessageId: message.id,
        },
      });
      const recipientState = await transaction.applicationChatState.upsert({
        where: { applicationId_userId: { applicationId: application.id, userId: recipient.id } },
        create: {
          applicationId: application.id,
          userId: recipient.id,
          unreadCount: 1,
          lastMessageAt: message.createdAt,
        },
        update: {
          unreadCount: { increment: 1 },
          lastMessageAt: message.createdAt,
        },
      });

      const scheduleEmail = recipient.chatEmailNotifications && recipientState.unreadCount === 1;
      const scheduledEmailAt = scheduleEmail
        ? new Date(message.createdAt.getTime() + 4 * 60 * 60 * 1000)
        : null;
      if (scheduledEmailAt) {
        await transaction.applicationChatState.update({
          where: { applicationId_userId: { applicationId: application.id, userId: recipient.id } },
          data: {
            scheduledEmailAt,
            scheduledEmailMessageId: message.id,
            scheduledEmailId: null,
          },
        });
      }

      const senderName = `${sender.firstName ?? ''} ${sender.lastName ?? ''}`.trim() || 'JobTracker user';
      const notification = await transaction.notification.create({
        data: {
          type: 'NEW_MESSAGE',
          userId: recipient.id,
          title: 'New message',
          message: `You have a new message about ${application.vacancy.title}`,
          metadata: {
            kind: 'NEW_MESSAGE',
            senderName,
            vacancyTitle: application.vacancy.title,
          } satisfies Prisma.InputJsonValue,
          applicationId: application.id,
          vacancyId: application.vacancyId,
        },
      });

        return {
          kind: 'CREATED' as const,
          application,
          message,
          recipient,
          sender,
          notification,
          scheduledEmailAt,
        };
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
        throw error;
      }

      const existing = await prisma.applicationMessage.findUnique({
        where: {
          senderId_clientMessageId: {
            senderId: input.senderId,
            clientMessageId: input.clientMessageId,
          },
        },
        include: { sender: { select: participantSelect } },
      });
      if (!existing) throw error;
      if (existing.applicationId !== input.applicationId) return { kind: 'CONFLICT' as const };

      const application = await this.findParticipantApplication(input.applicationId, input.senderId);
      if (!application) return { kind: 'NOT_FOUND' as const };
      return { kind: 'EXISTING' as const, message: existing, application };
    }
  },

  saveScheduledEmail(input: {
    applicationId: string;
    userId: string;
    messageId: string;
    emailId: string;
  }) {
    return prisma.applicationChatState.updateMany({
      where: {
        applicationId: input.applicationId,
        userId: input.userId,
        scheduledEmailMessageId: input.messageId,
        scheduledEmailId: null,
        unreadCount: { gt: 0 },
      },
      data: { scheduledEmailId: input.emailId },
    });
  },

  async markRead(applicationId: string, userId: string, messageId: string) {
    return prisma.$transaction(async (transaction) => {
      const application = await transaction.application.findFirst({
        where: applicationParticipantWhere(applicationId, userId),
        select: { id: true },
      });
      if (!application) return { kind: 'NOT_FOUND' as const };
      const message = await transaction.applicationMessage.findFirst({
        where: { id: messageId, applicationId },
        select: { id: true, createdAt: true },
      });
      if (!message) return { kind: 'MESSAGE_NOT_FOUND' as const };

      const current = await transaction.applicationChatState.findUnique({
        where: { applicationId_userId: { applicationId, userId } },
        include: { lastReadMessage: { select: { createdAt: true, id: true } } },
      });
      if (current?.lastReadMessage && (
        current.lastReadMessage.createdAt > message.createdAt
        || (current.lastReadMessage.createdAt.getTime() === message.createdAt.getTime() && current.lastReadMessage.id >= message.id)
      )) {
        return { kind: 'UNCHANGED' as const, state: current, emailIdToCancel: null };
      }

      const unreadCount = await transaction.applicationMessage.count({
        where: {
          applicationId,
          senderId: { not: userId },
          OR: [
            { createdAt: { gt: message.createdAt } },
            { createdAt: message.createdAt, id: { gt: message.id } },
          ],
        },
      });
      const emailIdToCancel = unreadCount === 0 ? current?.scheduledEmailId ?? null : null;
      const state = await transaction.applicationChatState.upsert({
        where: { applicationId_userId: { applicationId, userId } },
        create: {
          applicationId,
          userId,
          unreadCount,
          lastReadMessageId: message.id,
          ...(unreadCount === 0 ? {
            scheduledEmailId: null,
            scheduledEmailAt: null,
            scheduledEmailMessageId: null,
          } : {}),
        },
        update: {
          unreadCount,
          lastReadMessageId: message.id,
          ...(unreadCount === 0 ? {
            scheduledEmailId: null,
            scheduledEmailAt: null,
            scheduledEmailMessageId: null,
          } : {}),
        },
      });
      return { kind: 'UPDATED' as const, state, emailIdToCancel };
    });
  },

  clearScheduledEmail(applicationId: string, userId: string, emailId: string) {
    return prisma.applicationChatState.updateMany({
      where: { applicationId, userId, scheduledEmailId: emailId, unreadCount: 0 },
      data: {
        scheduledEmailId: null,
        scheduledEmailAt: null,
        scheduledEmailMessageId: null,
      },
    });
  },

  clearDisabledScheduledEmail(applicationId: string, userId: string, emailId: string) {
    return prisma.applicationChatState.updateMany({
      where: { applicationId, userId, scheduledEmailId: emailId },
      data: {
        scheduledEmailId: null,
        scheduledEmailAt: null,
        scheduledEmailMessageId: null,
      },
    });
  },

  findScheduledEmails(userId: string) {
    return prisma.applicationChatState.findMany({
      where: { userId, scheduledEmailId: { not: null } },
      select: { applicationId: true, scheduledEmailId: true },
    });
  },

};
