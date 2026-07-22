import { z } from 'zod';

export const createVacancySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  requirements: z.string().optional(),
  position: z.string().optional(),
  company: z.string().min(2, 'Company name is required').max(200).optional(),
  location: z.string().min(2, 'Location is required').max(200).optional(),
  salaryMin: z.number().int().positive('Salary must be positive').optional(),
  salaryMax: z.number().int().positive('Salary must be positive').optional(),
  currency: z.string().default('USD'),
});

export const updateVacancySchema = createVacancySchema;

export const scheduleInterviewSchema = z.object({
  interviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  interviewTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:mm'),
  scheduledAt: z.string().datetime({ offset: true }).refine(
    (value) => new Date(value) > new Date(),
    'Interview time must be in the future',
  ),
  interviewNotes: z.string().max(2000).optional(),
}).strict();

export const updateVacancyStatusSchema = z.object({
  status: z.enum(['PUBLISHED', 'CLOSED', 'ARCHIVED']),
});

export const vacanciesQuerySchema = z.object({
  scope: z.enum(['active', 'archived', 'all']).default('active'),
  status: z.enum(['PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['createdAt', 'publishedAt']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateVacancyInput = z.infer<typeof createVacancySchema>;
export type UpdateVacancyInput = z.infer<typeof updateVacancySchema>;
export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type UpdateVacancyStatusInput = z.infer<typeof updateVacancyStatusSchema>;
