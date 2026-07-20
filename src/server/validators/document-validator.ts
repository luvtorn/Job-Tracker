import { z } from 'zod';

export const documentTypeSchema = z.enum(['RESUME', 'COVER_LETTER']);
export const documentIdSchema = z.string().uuid();
export const documentDispositionSchema = z.enum(['inline', 'attachment']);
