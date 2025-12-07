import { z } from 'zod';

export const createAreaSchema = z.object({
  body: z.object({
    governorateId: z.string().min(1),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().optional(),
  }),
});

export const updateAreaSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    governorateId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getAreaSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listAreasSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    governorateId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>['body'];
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>['body'];
export type ListAreasQuery = z.infer<typeof listAreasSchema>['query'];
