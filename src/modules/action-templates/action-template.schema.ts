import { z } from 'zod';

export const createActionTemplateSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    sortOrder: z.number().default(0),
  }),
});

export const updateActionTemplateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    code: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    descriptionAr: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getActionTemplateSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listActionTemplatesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateActionTemplateInput = z.infer<typeof createActionTemplateSchema>['body'];
export type UpdateActionTemplateInput = z.infer<typeof updateActionTemplateSchema>['body'];
export type ListActionTemplatesQuery = z.infer<typeof listActionTemplatesSchema>['query'];
