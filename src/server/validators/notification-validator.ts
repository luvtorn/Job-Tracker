import { z } from 'zod';

export const markAsReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export const notificationsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  isRead: z.enum(['true', 'false']).optional(),
});

export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type NotificationsQueryInput = z.infer<typeof notificationsQuerySchema>;
