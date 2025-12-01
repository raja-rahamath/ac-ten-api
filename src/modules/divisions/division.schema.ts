import { z } from 'zod';

export const createDivisionSchema = z.object({
  body: z.object({
    companyId: z.string().min(1),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().optional(),
  }),
});

export const updateDivisionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    companyId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getDivisionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listDivisionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
    companyId: z.string().optional(),
  }),
});

export type CreateDivisionInput = z.infer<typeof createDivisionSchema>['body'];
export type UpdateDivisionInput = z.infer<typeof updateDivisionSchema>['body'];
export type ListDivisionsQuery = z.infer<typeof listDivisionsSchema>['query'];
