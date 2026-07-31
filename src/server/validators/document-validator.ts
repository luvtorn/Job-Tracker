import { z } from 'zod';

export const documentTypeSchema = z.enum(['RESUME', 'COVER_LETTER']);
export const documentIdSchema = z.string().uuid();

export const documentUploadIntentSchema = z.object({
  type: documentTypeSchema,
  originalFilename: z.string()
    .trim()
    .min(1)
    .max(255)
    .refine((value) => !/[\\/\0]/.test(value), 'Invalid filename'),
  contentType: z.enum([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]),
  size: z.number().int().positive().max(10 * 1024 * 1024),
}).strict().superRefine((value, context) => {
  const extension = value.originalFilename.split('.').pop()?.toLowerCase();
  const expectedExtension = value.contentType === 'application/pdf' ? 'pdf' : 'docx';
  if (extension !== expectedExtension) {
    context.addIssue({
      code: 'custom',
      path: ['originalFilename'],
      message: 'File extension does not match its type',
    });
  }
});

export const cloudinaryScanWebhookSchema = z.object({
  public_id: z.string().min(1),
  moderation_kind: z.string().optional(),
  moderation_status: z.enum(['approved', 'rejected']).optional(),
  moderation: z.array(z.object({
    kind: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
  })).optional(),
}).passthrough();

export const cloudinaryResourceSchema = z.object({
  public_id: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  moderation: z.array(z.object({
    kind: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
  })).optional(),
}).passthrough();

export type CloudinaryResource = z.infer<typeof cloudinaryResourceSchema>;

export type DocumentUploadIntentInput = z.infer<typeof documentUploadIntentSchema>;
