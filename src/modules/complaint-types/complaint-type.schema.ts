import { z } from 'zod';

export const createComplaintTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    nameAr: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const updateComplaintTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getComplaintTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listComplaintTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateComplaintTypeInput = z.infer<typeof createComplaintTypeSchema>['body'];
export type UpdateComplaintTypeInput = z.infer<typeof updateComplaintTypeSchema>['body'];
export type ListComplaintTypesQuery = z.infer<typeof listComplaintTypesSchema>['query'];
