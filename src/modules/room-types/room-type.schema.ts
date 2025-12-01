import { z } from 'zod';

export const createRoomTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    category: z.string().optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const updateRoomTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    category: z.string().optional(),
    icon: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getRoomTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listRoomTypesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    search: z.string().optional(),
    category: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>['body'];
export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>['body'];
export type ListRoomTypesQuery = z.infer<typeof listRoomTypesSchema>['query'];
