import { z } from "zod";

export const calendarEventIdSchema = z.string().uuid();
export const calendarMonthQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
}).strict();

const baseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(1000).optional().nullable(),
  eventType: z.enum(["INTERVIEW", "MEETING", "DEADLINE", "FOLLOW_UP", "NOTE", "OTHER"]),
  color: z.string().default("blue"),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().max(255).optional().nullable(),
  isCompleted: z.boolean().default(false),
  applicationId: z.string().optional().nullable(),
});

export const createCalendarEventSchema = baseSchema.refine((data) => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const createCustomCalendarEventSchema = baseSchema
  .omit({ applicationId: true, eventType: true })
  .extend({
    eventType: z.enum(["MEETING", "DEADLINE", "FOLLOW_UP", "NOTE", "OTHER"]),
  })
  .strict()
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updateCalendarEventSchema = baseSchema.partial().refine((data) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

export const updateCustomCalendarEventSchema = baseSchema
  .omit({ applicationId: true, eventType: true })
  .partial()
  .extend({ eventType: z.enum(["MEETING", "DEADLINE", "FOLLOW_UP", "NOTE", "OTHER"]).optional() })
  .strict()
  .refine((data) => !data.startTime || !data.endTime || data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type CreateCalendarEventInput = z.infer<typeof createCalendarEventSchema>;
export type UpdateCalendarEventInput = z.infer<typeof updateCalendarEventSchema>;

