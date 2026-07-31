import { z } from "zod";

export const jobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).max(100).optional(),
  location: z.string().trim().min(1).max(100).optional(),
}).strict();

export const resourceIdSchema = z.string().uuid();
