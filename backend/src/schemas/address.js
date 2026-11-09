import { z } from 'zod';

export const addressSchema = z.object({
  label: z.string().max(50).optional().default(''),
  fullName: z.string().min(1).max(255),
  phone: z.string().max(20).optional().default(''),
  line1: z.string().min(1).max(500),
  line2: z.string().max(500).optional().default(''),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  pincode: z.string().min(1).max(10),
  isDefault: z.boolean().optional().default(false),
});
