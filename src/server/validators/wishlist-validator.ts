import { z } from 'zod';

export const wishlistIdSchema = z.string().uuid();
export const createWishlistSchema = z.object({ vacancyId: z.string().uuid() }).strict();
