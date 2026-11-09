import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100).default(1),
});

export const updateCartQuantitySchema = z.object({
  quantity: z.number().int().min(1).max(100),
});
