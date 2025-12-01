import { z } from 'zod';

export const createBuildingTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const updateBuildingTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getBuildingTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listBuildingTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateBuildingTypeInput = z.infer<typeof createBuildingTypeSchema>['body'];
export type UpdateBuildingTypeInput = z.infer<typeof updateBuildingTypeSchema>['body'];
export type ListBuildingTypesQuery = z.infer<typeof listBuildingTypesSchema>['query'];
