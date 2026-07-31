import { z } from 'zod';

export const VACANCY_LIMITS = {
  title: { min: 5, max: 200 },
  company: { min: 2, max: 200 },
  location: { min: 2, max: 200 },
  position: { min: 2, max: 100 },
  description: { min: 100, max: 5000 },
  requirements: { min: 50, max: 5000 },
} as const;

export const vacancyValidationCodes = {
  titleMin: 'vacancy.title.min',
  titleMax: 'vacancy.title.max',
  companyMin: 'vacancy.company.min',
  companyMax: 'vacancy.company.max',
  locationMin: 'vacancy.location.min',
  locationMax: 'vacancy.location.max',
  positionMin: 'vacancy.position.min',
  positionMax: 'vacancy.position.max',
  descriptionMin: 'vacancy.description.min',
  descriptionMax: 'vacancy.description.max',
  requirementsMin: 'vacancy.requirements.min',
  requirementsMax: 'vacancy.requirements.max',
  salaryPositive: 'vacancy.salary.positive',
  salaryPair: 'vacancy.salary.pair',
  salaryRange: 'vacancy.salary.range',
  currency: 'vacancy.currency.invalid',
} as const;

export const createVacancySchema = z.object({
  title: z.string().trim()
    .min(VACANCY_LIMITS.title.min, vacancyValidationCodes.titleMin)
    .max(VACANCY_LIMITS.title.max, vacancyValidationCodes.titleMax),
  company: z.string().trim()
    .min(VACANCY_LIMITS.company.min, vacancyValidationCodes.companyMin)
    .max(VACANCY_LIMITS.company.max, vacancyValidationCodes.companyMax),
  location: z.string().trim()
    .min(VACANCY_LIMITS.location.min, vacancyValidationCodes.locationMin)
    .max(VACANCY_LIMITS.location.max, vacancyValidationCodes.locationMax),
  position: z.string().trim()
    .min(VACANCY_LIMITS.position.min, vacancyValidationCodes.positionMin)
    .max(VACANCY_LIMITS.position.max, vacancyValidationCodes.positionMax),
  description: z.string().trim()
    .min(VACANCY_LIMITS.description.min, vacancyValidationCodes.descriptionMin)
    .max(VACANCY_LIMITS.description.max, vacancyValidationCodes.descriptionMax),
  requirements: z.string().trim()
    .min(VACANCY_LIMITS.requirements.min, vacancyValidationCodes.requirementsMin)
    .max(VACANCY_LIMITS.requirements.max, vacancyValidationCodes.requirementsMax),
  salaryMin: z.number().int().positive(vacancyValidationCodes.salaryPositive).optional(),
  salaryMax: z.number().int().positive(vacancyValidationCodes.salaryPositive).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD'], { error: vacancyValidationCodes.currency }).default('USD'),
}).strict().superRefine((data, context) => {
  if ((data.salaryMin === undefined) !== (data.salaryMax === undefined)) {
    const missingField = data.salaryMin === undefined ? 'salaryMin' : 'salaryMax';
    context.addIssue({ code: 'custom', path: [missingField], message: vacancyValidationCodes.salaryPair });
  }
  if (data.salaryMin !== undefined && data.salaryMax !== undefined && data.salaryMax < data.salaryMin) {
    context.addIssue({ code: 'custom', path: ['salaryMax'], message: vacancyValidationCodes.salaryRange });
  }
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
  meetingType: z.enum(['NONE', 'MANUAL_GOOGLE_MEET', 'GOOGLE_MEET']).default('NONE'),
  manualMeetingUrl: z.string().trim().url().max(500).optional(),
  sendCalendarInvite: z.boolean().optional(),
}).strict().superRefine((data, context) => {
  if (
    data.meetingType === 'MANUAL_GOOGLE_MEET'
    && !/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}(?:\?.*)?$/.test(
      data.manualMeetingUrl ?? '',
    )
  ) {
    context.addIssue({
      code: 'custom',
      path: ['manualMeetingUrl'],
      message: 'A valid Google Meet URL is required',
    });
  }
  if (data.meetingType !== 'MANUAL_GOOGLE_MEET' && data.manualMeetingUrl) {
    context.addIssue({
      code: 'custom',
      path: ['manualMeetingUrl'],
      message: 'Manual URL is not allowed for this meeting type',
    });
  }
  if (data.meetingType !== 'GOOGLE_MEET' && data.sendCalendarInvite) {
    context.addIssue({
      code: 'custom',
      path: ['sendCalendarInvite'],
      message: 'Calendar invitations require automatic Google Meet',
    });
  }
}).transform((data) => ({
  ...data,
  sendCalendarInvite: data.sendCalendarInvite ?? data.meetingType === 'GOOGLE_MEET',
}));

export const updateVacancyStatusSchema = z.object({
  status: z.enum(['PUBLISHED', 'CLOSED', 'ARCHIVED']),
}).strict();

export const vacanciesQuerySchema = z.object({
  scope: z.enum(['active', 'archived', 'all']).default('active'),
  status: z.enum(['PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(['createdAt', 'publishedAt']).default('createdAt'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
}).strict();

export type CreateVacancyInput = z.infer<typeof createVacancySchema>;
export type UpdateVacancyInput = z.infer<typeof updateVacancySchema>;
export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type UpdateVacancyStatusInput = z.infer<typeof updateVacancyStatusSchema>;
