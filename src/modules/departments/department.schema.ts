import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    divisionId: z.string(),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    divisionId: z.string().optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getDepartmentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listDepartmentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    divisionId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>['body'];
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>['body'];
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsSchema>['query'];
