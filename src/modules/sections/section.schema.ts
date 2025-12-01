import { z } from 'zod';

export const createSectionSchema = z.object({
  body: z.object({
    departmentId: z.string(),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().optional(),
  }),
});

export const updateSectionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    departmentId: z.string().optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getSectionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listSectionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    departmentId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>['body'];
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>['body'];
export type ListSectionsQuery = z.infer<typeof listSectionsSchema>['query'];
