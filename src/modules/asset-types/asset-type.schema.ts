import { z } from 'zod';

export const createAssetTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const updateAssetTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getAssetTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listAssetTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateAssetTypeInput = z.infer<typeof createAssetTypeSchema>['body'];
export type UpdateAssetTypeInput = z.infer<typeof updateAssetTypeSchema>['body'];
export type ListAssetTypesQuery = z.infer<typeof listAssetTypesSchema>['query'];
