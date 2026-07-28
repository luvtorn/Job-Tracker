import { CalendarSyncOperation, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const googleCalendarRepository = {
  findConnection(userId: string) {
    return prisma.googleCalendarConnection.findUnique({ where: { userId } });
  },

  upsertConnection(data: {
    userId: string;
    googleAccountEmail: string;
    encryptedRefreshToken: string;
    scopes: string;
  }) {
    const connection = {
      googleAccountEmail: data.googleAccountEmail,
      encryptedRefreshToken: data.encryptedRefreshToken,
      scopes: data.scopes,
      revokedAt: null,
    };
    return prisma.googleCalendarConnection.upsert({
      where: { userId: data.userId },
      create: { userId: data.userId, ...connection },
      update: connection,
    });
  },

  deleteConnection(userId: string) {
    return prisma.googleCalendarConnection.deleteMany({ where: { userId } });
  },

  findSyncJob(jobId: string) {
    return prisma.calendarSyncJob.findUnique({
      where: { id: jobId },
      include: {
        user: { select: { id: true } },
        calendarEvent: {
          include: {
            application: {
              include: {
                user: { select: { email: true } },
                vacancy: { select: { title: true } },
              },
            },
          },
        },
      },
    });
  },

  findSyncJobByEvent(eventId: string, userId: string) {
    return prisma.calendarSyncJob.findFirst({
      where: { calendarEventId: eventId, userId },
      select: { id: true },
    });
  },

  async claimSyncJob(jobId: string) {
    const claimed = await prisma.calendarSyncJob.updateMany({
      where: { id: jobId, status: { in: ['PENDING', 'FAILED'] } },
      data: { status: 'PROCESSING', attempts: { increment: 1 }, lastErrorCode: null },
    });
    return claimed.count === 1;
  },

  completeSyncJob(
    jobId: string,
    eventId: string | null,
    syncState: 'SYNCED' | 'NOT_REQUIRED',
    meetingUrl?: string,
  ) {
    return prisma.$transaction(async (transaction) => {
      if (eventId) {
        await transaction.calendarEvent.updateMany({
          where: { id: eventId },
          data: {
            meetingUrl: meetingUrl || undefined,
            syncState,
            syncErrorCode: null,
          },
        });
      }
      await transaction.calendarSyncJob.update({
        where: { id: jobId },
        data: { status: 'SUCCEEDED', lastErrorCode: null },
      });
    });
  },

  failSyncJob(jobId: string, eventId: string | null, errorCode: string, attempts: number) {
    const delayMinutes = Math.min(60, 2 ** Math.min(attempts, 5));
    return prisma.$transaction(async (transaction) => {
      if (eventId) {
        await transaction.calendarEvent.updateMany({
          where: { id: eventId },
          data: { syncState: 'FAILED', syncErrorCode: errorCode },
        });
      }
      await transaction.calendarSyncJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          lastErrorCode: errorCode,
          nextAttemptAt: new Date(Date.now() + delayMinutes * 60 * 1000),
        },
      });
    });
  },

  retryEvent(userId: string, eventId: string) {
    return prisma.calendarSyncJob.updateMany({
      where: { calendarEventId: eventId, userId },
      data: { status: 'PENDING', nextAttemptAt: new Date(), lastErrorCode: null },
    });
  },
};

export const upsertCalendarSyncJob = (
  transaction: Prisma.TransactionClient,
  data: {
    calendarEventId: string;
    userId: string;
    operation: CalendarSyncOperation;
    googleEventId: string | null;
  },
) => transaction.calendarSyncJob.upsert({
  where: { calendarEventId: data.calendarEventId },
  create: { ...data, status: 'PENDING' },
  update: {
    operation: data.operation,
    googleEventId: data.googleEventId,
    status: 'PENDING',
    nextAttemptAt: new Date(),
    lastErrorCode: null,
  },
});
