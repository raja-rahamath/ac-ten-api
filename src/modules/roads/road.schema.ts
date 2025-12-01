import { z } from 'zod';

export const createRoadSchema = z.object({
  body: z.object({
    blockId: z.string(),
    roadNo: z.string().min(1),
    name: z.string().optional(),
    nameAr: z.string().optional(),
  }),
});

export const updateRoadSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    blockId: z.string().optional(),
    roadNo: z.string().min(1).optional(),
    name: z.string().optional(),
    nameAr: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getRoadSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listRoadsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    blockId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateRoadInput = z.infer<typeof createRoadSchema>['body'];
export type UpdateRoadInput = z.infer<typeof updateRoadSchema>['body'];
export type ListRoadsQuery = z.infer<typeof listRoadsSchema>['query'];
