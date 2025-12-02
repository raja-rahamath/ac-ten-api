import { z } from 'zod';

export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    logo: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
    plusCode: z.string().optional(),
    isPrimary: z.boolean().optional(),
  }),
});

export const updateCompanySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    logo: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    fax: z.string().optional(),
    website: z.string().url().optional(),
    address: z.string().optional(),
    plusCode: z.string().optional(),
    isActive: z.boolean().optional(),
    isPrimary: z.boolean().optional(),
  }),
});

export const getCompanySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listCompaniesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>['body'];
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>['body'];
export type ListCompaniesQuery = z.infer<typeof listCompaniesSchema>['query'];
