import { z } from 'zod';

export const createUnitTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const updateUnitTypeSchema = z.object({
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

export const getUnitTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listUnitTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateUnitTypeInput = z.infer<typeof createUnitTypeSchema>['body'];
export type UpdateUnitTypeInput = z.infer<typeof updateUnitTypeSchema>['body'];
export type ListUnitTypesQuery = z.infer<typeof listUnitTypesSchema>['query'];
