import { z } from 'zod';

export const createPropertyTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
  }),
});

export const updatePropertyTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    parentId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getPropertyTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listPropertyTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
    parentId: z.string().optional(),
    rootOnly: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreatePropertyTypeInput = z.infer<typeof createPropertyTypeSchema>['body'];
export type UpdatePropertyTypeInput = z.infer<typeof updatePropertyTypeSchema>['body'];
export type ListPropertyTypesQuery = z.infer<typeof listPropertyTypesSchema>['query'];
