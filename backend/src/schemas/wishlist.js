import { z } from 'zod';

export const addWishlistSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive().optional(),
});
