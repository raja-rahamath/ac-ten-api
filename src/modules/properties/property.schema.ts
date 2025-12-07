import { z } from 'zod';

export const createPropertySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Property name is required'),
    nameAr: z.string().optional(),
    typeId: z.string().min(1, 'Property type is required'),
    areaId: z.string().optional(),
    address: z.string().optional(),
    addressAr: z.string().optional(),
    building: z.string().optional(),
    floor: z.string().optional(),
    unit: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    customerId: z.string().optional(),
    ownershipType: z.enum(['OWNER', 'TENANT', 'MANAGER']).optional(),
  }),
});

export const updatePropertySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    typeId: z.string().optional(),
    areaId: z.string().optional(),
    address: z.string().optional(),
    addressAr: z.string().optional(),
    building: z.string().optional(),
    floor: z.string().optional(),
    unit: z.string().optional(),
    area: z.string().optional(),
    landmark: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getPropertySchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const listPropertiesSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    customerId: z.string().optional(),
    typeId: z.string().optional(),
    areaId: z.string().optional(),
    isActive: z.preprocess(
      (val) => val === 'true' ? true : val === 'false' ? false : undefined,
      z.boolean().optional()
    ),
    page: z.preprocess(
      (val) => val ? parseInt(val as string, 10) : undefined,
      z.number().positive().optional()
    ),
    limit: z.preprocess(
      (val) => val ? parseInt(val as string, 10) : undefined,
      z.number().positive().max(100).optional()
    ),
  }),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>['body'];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>['body'];
export type ListPropertiesQuery = z.infer<typeof listPropertiesSchema>['query'];
