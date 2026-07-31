import { z } from 'zod';

const googleCalendarCallbackStateSchema = z.string().min(32);

export const googleCalendarCallbackQuerySchema = z.union([
  z.object({
    code: z.string().min(1),
    state: googleCalendarCallbackStateSchema,
  }),
  z.object({
    error: z.string().min(1).max(100),
    state: googleCalendarCallbackStateSchema,
  }),
]);

export const retryCalendarSyncSchema = z.object({
  eventId: z.string().uuid(),
}).strict();
