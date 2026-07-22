import { z } from 'zod';

export const notificationIdSchema = z.string().uuid();

export const updateNotificationSchema = z.object({
  isRead: z.literal(true),
});

export const notificationMetadataSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('NEW_APPLICATION'), candidateName: z.string(), vacancyTitle: z.string(), company: z.string().nullable() }),
  z.object({ kind: z.literal('APPLICATION_STATUS_CHANGED'), status: z.string(), vacancyTitle: z.string(), company: z.string().nullable() }),
  z.object({ kind: z.literal('INTERVIEW_SCHEDULED'), vacancyTitle: z.string(), company: z.string().nullable(), interviewDate: z.string(), interviewTime: z.string(), rescheduled: z.boolean() }),
]);

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  isRead: z.enum(['true', 'false']).optional(),
});

export type NotificationsQueryInput = z.infer<typeof notificationsQuerySchema>;
