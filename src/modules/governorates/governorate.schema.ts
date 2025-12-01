import { z } from 'zod';

export const createGovernorateSchema = z.object({
  body: z.object({
    districtId: z.string().min(1),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().optional(),
  }),
});

export const updateGovernorateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    districtId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getGovernorateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listGovernoratesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    districtId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateGovernorateInput = z.infer<typeof createGovernorateSchema>['body'];
export type UpdateGovernorateInput = z.infer<typeof updateGovernorateSchema>['body'];
export type ListGovernoratesQuery = z.infer<typeof listGovernoratesSchema>['query'];
