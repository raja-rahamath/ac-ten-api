import { z } from 'zod';

export const createBlockSchema = z.object({
  body: z.object({
    areaId: z.string(),
    blockNo: z.string().min(1),
    name: z.string().optional(),
    nameAr: z.string().optional(),
  }),
});

export const updateBlockSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    areaId: z.string().optional(),
    blockNo: z.string().min(1).optional(),
    name: z.string().optional(),
    nameAr: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getBlockSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listBlocksSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    areaId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>['body'];
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>['body'];
export type ListBlocksQuery = z.infer<typeof listBlocksSchema>['query'];
