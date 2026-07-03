import { z } from 'zod';

export const createVacancySchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  requirements: z.string().optional(),
  position: z.string().optional(),
  company: z.string().min(2, 'Company name is required').max(200),
  location: z.string().min(2, 'Location is required').max(200),
  salaryMin: z.number().int().positive('Salary must be positive').optional(),
  salaryMax: z.number().int().positive('Salary must be positive').optional(),
  currency: z.string().default('USD'),
});

export type CreateVacancyInput = z.infer<typeof createVacancySchema>;
