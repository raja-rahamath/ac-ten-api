import { z } from 'zod';

export const createDistrictSchema = z.object({
  body: z.object({
    stateId: z.string().min(1),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().optional(),
  }),
});

export const updateDistrictSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    stateId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getDistrictSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listDistrictsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    stateId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateDistrictInput = z.infer<typeof createDistrictSchema>['body'];
export type UpdateDistrictInput = z.infer<typeof updateDistrictSchema>['body'];
export type ListDistrictsQuery = z.infer<typeof listDistrictsSchema>['query'];
