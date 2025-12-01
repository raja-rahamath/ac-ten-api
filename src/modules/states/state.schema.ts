import { z } from 'zod';

export const createStateSchema = z.object({
  body: z.object({
    countryId: z.string(),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().optional(),
  }),
});

export const updateStateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    countryId: z.string().optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getStateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listStatesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    countryId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateStateInput = z.infer<typeof createStateSchema>['body'];
export type UpdateStateInput = z.infer<typeof updateStateSchema>['body'];
export type ListStatesQuery = z.infer<typeof listStatesSchema>['query'];
