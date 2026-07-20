import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
export const workspaceIdSchema = z.string().uuid();
export const companyInputSchema = z.object({ name: z.string().trim().min(1).max(255), website: optionalText(500), location: optionalText(255), notes: optionalText(5000) });
export const contactInputSchema = z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), email: z.string().trim().email().max(255).optional().nullable().or(z.literal('')), phone: optionalText(50), role: optionalText(100), notes: optionalText(5000), companyId: z.string().uuid().optional().nullable() });
export const noteInputSchema = z.object({ content: z.string().trim().min(1).max(10000), applicationId: z.string().uuid() });
export const tagInputSchema = z.object({ name: z.string().trim().min(1).max(50), color: z.enum(['blue', 'green', 'amber', 'red', 'purple', 'neutral']).default('blue') });
export const applicationTagInputSchema = z.object({ applicationId: z.string().uuid(), tagId: z.string().uuid() });
export const reminderInputSchema = z.object({ title: z.string().trim().min(1).max(255), dueAt: z.coerce.date(), applicationId: z.string().uuid().optional().nullable() });
export const reminderUpdateSchema = reminderInputSchema.partial().extend({ completed: z.boolean().optional() });

export type CompanyInput = z.infer<typeof companyInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
export type NoteInput = z.infer<typeof noteInputSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;
export type ReminderInput = z.infer<typeof reminderInputSchema>;
export type ReminderUpdate = z.infer<typeof reminderUpdateSchema>;
