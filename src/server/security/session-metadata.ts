import { z } from 'zod';

const userAgentSchema = z
  .string()
  .trim()
  .min(1)
  .max(512)
  .refine((value) => !/[\u0000-\u001F\u007F]/.test(value));

export type SessionMetadata = {
  userAgent: string | null;
};

export function getSessionMetadata(request: Request): SessionMetadata {
  const result = userAgentSchema.safeParse(request.headers.get('user-agent'));
  return { userAgent: result.success ? result.data : null };
}
