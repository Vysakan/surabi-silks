import { z } from 'zod';

const addressSchema = z.object({
  fullName: z.string().trim().min(1).max(255),
  phone: z.string().trim().min(1).max(30),
  line1: z.string().trim().min(1).max(500),
  line2: z.string().trim().max(500).optional().default(''),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  pincode: z.string().trim().min(1).max(10),
});

export const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    variantId: z.coerce.number().int().positive(),
    quantity: z.number().int().min(1).max(100),
  })).min(1).max(100),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(['upi', 'card', 'cod']),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled']).optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(['pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled']),
});
