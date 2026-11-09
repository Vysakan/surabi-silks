import { z } from 'zod';

export const createReviewSchema = z.object({
  productId: z.coerce.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(5).max(5000),
});
