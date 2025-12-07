import { z } from 'zod';

export const createCurrencySchema = z.object({
  body: z.object({
    code: z.string().min(3).max(3).toUpperCase(),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    symbol: z.string().min(1),
    symbolPosition: z.enum(['before', 'after']).default('before'),
    decimalPlaces: z.number().int().min(0).max(4).default(2),
    isDefault: z.boolean().default(false),
  }),
});

export const updateCurrencySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    code: z.string().min(3).max(3).toUpperCase().optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    symbol: z.string().min(1).optional(),
    symbolPosition: z.enum(['before', 'after']).optional(),
    decimalPlaces: z.number().int().min(0).max(4).optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCurrencySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listCurrenciesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>['body'];
export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>['body'];
export type ListCurrenciesQuery = z.infer<typeof listCurrenciesSchema>['query'];
