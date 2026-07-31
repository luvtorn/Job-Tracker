import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
export const workspaceIdSchema = z.string().uuid();
export const contactInputSchema = z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(100), email: z.string().trim().email().max(255).optional().nullable().or(z.literal('')), phone: optionalText(50), role: optionalText(100), notes: optionalText(5000) }).strict();
export const noteInputSchema = z.object({ content: z.string().trim().min(1).max(10000), applicationId: z.string().uuid() }).strict();
export const tagInputSchema = z.object({ name: z.string().trim().min(1).max(50), color: z.enum(['blue', 'green', 'amber', 'red', 'purple', 'neutral']).default('blue') }).strict();
export const applicationTagInputSchema = z.object({ applicationId: z.string().uuid(), tagId: z.string().uuid() }).strict();

export type ContactInput = z.infer<typeof contactInputSchema>;
export type NoteInput = z.infer<typeof noteInputSchema>;
export type TagInput = z.infer<typeof tagInputSchema>;
