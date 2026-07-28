import { z } from 'zod';

export const googleCalendarCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(32),
}).strict();

export const retryCalendarSyncSchema = z.object({
  eventId: z.string().uuid(),
}).strict();
