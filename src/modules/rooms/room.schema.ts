import { z } from 'zod';

export const createRoomSchema = z.object({
  body: z.object({
    unitId: z.string(),
    typeId: z.string().optional(),
    name: z.string().min(1),
    nameAr: z.string().optional(),
    floor: z.string().optional(),
    hasAttachedBathroom: z.boolean().default(false),
    areaSqm: z.number().optional(),
  }),
});

export const updateRoomSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    typeId: z.string().optional(),
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    floor: z.string().optional(),
    hasAttachedBathroom: z.boolean().optional(),
    areaSqm: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getRoomSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listRoomsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    unitId: z.string().optional(),
    typeId: z.string().optional(),
    hasAttachedBathroom: z.string().transform(v => v === 'true').optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

// Bulk create rooms for a unit
export const bulkCreateRoomsSchema = z.object({
  params: z.object({
    unitId: z.string(),
  }),
  body: z.object({
    rooms: z.array(z.object({
      typeId: z.string().optional(),
      name: z.string().min(1),
      nameAr: z.string().optional(),
      floor: z.string().optional(),
      hasAttachedBathroom: z.boolean().default(false),
      areaSqm: z.number().optional(),
    })),
  }),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>['body'];
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>['body'];
export type ListRoomsQuery = z.infer<typeof listRoomsSchema>['query'];
export type BulkCreateRoomsInput = z.infer<typeof bulkCreateRoomsSchema>['body'];
