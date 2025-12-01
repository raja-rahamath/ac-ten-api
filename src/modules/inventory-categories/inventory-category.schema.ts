import { z } from 'zod';

export const createInventoryCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
  }),
});

export const updateInventoryCategorySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getInventoryCategorySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listInventoryCategoriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateInventoryCategoryInput = z.infer<typeof createInventoryCategorySchema>['body'];
export type UpdateInventoryCategoryInput = z.infer<typeof updateInventoryCategorySchema>['body'];
export type ListInventoryCategoriesQuery = z.infer<typeof listInventoryCategoriesSchema>['query'];
