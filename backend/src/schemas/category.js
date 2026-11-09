import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  image: z.string().max(500).optional(),
  description: z.string().optional(),
  parentId: z.number().int().positive().nullable().default(null),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial().omit({ slug: true });
