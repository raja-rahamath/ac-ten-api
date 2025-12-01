import { z } from 'zod';

export const createUnitSchema = z.object({
  body: z.object({
    buildingId: z.string(),
    typeId: z.string().optional(), // Optional - units can be created without a type initially
    flatNumber: z.string().optional(),
    unitSuffix: z.string().optional(),
    floor: z.number().int().optional(),
    bedrooms: z.number().int().optional(),
    bathrooms: z.number().int().optional(),
    areaSqm: z.number().optional(),
    isFurnished: z.boolean().default(false),
    monthlyRent: z.number().optional(),
    status: z.enum(['VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).default('VACANT'),
  }),
});

export const updateUnitSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    buildingId: z.string().optional(),
    typeId: z.string().optional(),
    flatNumber: z.string().optional(),
    unitSuffix: z.string().optional(),
    floor: z.number().int().optional(),
    bedrooms: z.number().int().optional(),
    bathrooms: z.number().int().optional(),
    areaSqm: z.number().optional(),
    isFurnished: z.boolean().optional(),
    monthlyRent: z.number().optional(),
    status: z.enum(['VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getUnitSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listUnitsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    buildingId: z.string().optional(),
    typeId: z.string().optional(),
    status: z.enum(['VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED']).optional(),
    floor: z.coerce.number().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>['body'];
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>['body'];
export type ListUnitsQuery = z.infer<typeof listUnitsSchema>['query'];
