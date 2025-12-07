import { z } from 'zod';

export const createInventoryItemSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    categoryId: z.string().min(1),
    description: z.string().optional(),
    unit: z.string().default('piece'),
    unitPrice: z.number().min(0).default(0),
    currentStock: z.number().int().min(0).default(0),
    minStock: z.number().int().min(0).default(0),
    maxStock: z.number().int().min(0).optional(),
  }),
});

export const updateInventoryItemSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    categoryId: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    unitPrice: z.number().min(0).optional(),
    currentStock: z.number().int().min(0).optional(),
    minStock: z.number().int().min(0).optional(),
    maxStock: z.number().int().min(0).optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const getInventoryItemSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listInventoryItemsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
    lowStock: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>['body'];
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>['body'];
export type ListInventoryItemsQuery = z.infer<typeof listInventoryItemsSchema>['query'];
