import { z } from 'zod';

export const createCountrySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().min(2).max(3),
  }),
});

export const updateCountrySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().min(2).max(3).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCountrySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listCountriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateCountryInput = z.infer<typeof createCountrySchema>['body'];
export type UpdateCountryInput = z.infer<typeof updateCountrySchema>['body'];
export type ListCountriesQuery = z.infer<typeof listCountriesSchema>['query'];
