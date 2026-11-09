import { z } from 'zod';

const variantSchema = z.object({
  colorName: z.string().max(100),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  size: z.string().max(255),
  design: z.string().max(255).optional(),
  price: z.number().positive(),
  mrp: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().min(1).max(100),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categoryId: z.number().int().positive(),
  subcategoryId: z.number().int().positive().optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  sellingUnit: z.enum(['piece', 'metre']).default('piece'),
  basePrice: z.number().positive(),
  tags: z.array(z.string()).default([]),
  fabric: z.string().max(100).optional(),
  weave: z.string().max(100).optional(),
  weight: z.string().max(50).optional(),
  careInstructions: z.string().optional(),
  occasions: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  isBestseller: z.boolean().default(false),
  variants: z.array(variantSchema).min(1),
});

export const updateProductSchema = createProductSchema.partial().omit({ slug: true });

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sort: z.enum(['price-asc', 'price-desc', 'newest', 'rating', 'name-asc', 'name-desc']).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  priceMin: z.coerce.number().min(0).optional(),
  priceMax: z.coerce.number().min(0).optional(),
  colors: z.string().optional(),
  fabrics: z.string().optional(),
  occasions: z.string().optional(),
  search: z.string().max(200).optional(),
});
