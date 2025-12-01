import { z } from 'zod';

export const createJobTitleSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
  }),
});

export const updateJobTitleSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getJobTitleSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listJobTitlesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateJobTitleInput = z.infer<typeof createJobTitleSchema>['body'];
export type UpdateJobTitleInput = z.infer<typeof updateJobTitleSchema>['body'];
export type ListJobTitlesQuery = z.infer<typeof listJobTitlesSchema>['query'];
