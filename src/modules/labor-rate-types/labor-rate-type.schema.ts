import { z } from 'zod';

export const createLaborRateTypeSchema = z.object({
  body: z.object({
    tenantId: z.string().min(1, 'Tenant ID is required'),
    code: z.string().min(1, 'Code is required').max(50),
    name: z.string().min(1, 'Name is required').max(100),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    hourlyRate: z.number().min(0, 'Hourly rate must be non-negative').default(0),
    dailyRate: z.number().min(0, 'Daily rate must be non-negative').default(0),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  }),
});

export const updateLaborRateTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(100).optional(),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    hourlyRate: z.number().min(0).optional(),
    dailyRate: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  }),
});

export const getLaborRateTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listLaborRateTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
    tenantId: z.string().optional(),
  }),
});

export type CreateLaborRateTypeInput = z.infer<typeof createLaborRateTypeSchema>['body'];
export type UpdateLaborRateTypeInput = z.infer<typeof updateLaborRateTypeSchema>['body'];
export type ListLaborRateTypesQuery = z.infer<typeof listLaborRateTypesSchema>['query'];
