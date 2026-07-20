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
  interviewDate: z.string().refine(
    (date) => new Date(date) > new Date(),
    'Interview date must be in the future'
  ),
  interviewTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time format must be HH:mm'),
  interviewNotes: z.string().optional(),
});

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
