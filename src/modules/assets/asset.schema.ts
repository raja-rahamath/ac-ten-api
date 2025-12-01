import { z } from 'zod';

// Enums matching Prisma schema
export const AssetStatus = z.enum(['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REPLACED', 'DISPOSED']);
export const AssetCondition = z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL']);

export const createAssetSchema = z.object({
  body: z.object({
    // Location - at least one must be provided
    unitId: z.string().optional(),
    roomId: z.string().optional(),
    buildingId: z.string().optional(),
    facilityId: z.string().optional(),
    // Type (required)
    typeId: z.string(),
    // Details
    name: z.string().optional(),
    nameAr: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    capacity: z.string().optional(),
    specifications: z.record(z.any()).optional(),
    // Financial & Dates
    purchasePrice: z.number().optional(),
    purchaseDate: z.string().datetime().optional(),
    installDate: z.string().datetime().optional(),
    warrantyEndDate: z.string().datetime().optional(),
    amcEndDate: z.string().datetime().optional(),
    expectedLifeYears: z.number().optional(),
    // Status
    status: AssetStatus.default('ACTIVE'),
    condition: AssetCondition.default('GOOD'),
    // Notes
    notes: z.string().optional(),
  }),
});

export const updateAssetSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    // Location
    unitId: z.string().optional().nullable(),
    roomId: z.string().optional().nullable(),
    buildingId: z.string().optional().nullable(),
    facilityId: z.string().optional().nullable(),
    // Type
    typeId: z.string().optional(),
    // Details
    name: z.string().optional(),
    nameAr: z.string().optional(),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    capacity: z.string().optional(),
    specifications: z.record(z.any()).optional(),
    // Financial & Dates
    purchasePrice: z.number().optional(),
    purchaseDate: z.string().datetime().optional().nullable(),
    installDate: z.string().datetime().optional().nullable(),
    warrantyEndDate: z.string().datetime().optional().nullable(),
    amcEndDate: z.string().datetime().optional().nullable(),
    expectedLifeYears: z.number().optional(),
    // Status
    status: AssetStatus.optional(),
    condition: AssetCondition.optional(),
    lastServiceDate: z.string().datetime().optional().nullable(),
    nextServiceDue: z.string().datetime().optional().nullable(),
    // Notes
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getAssetSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listAssetsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(50),
    unitId: z.string().optional(),
    roomId: z.string().optional(),
    buildingId: z.string().optional(),
    facilityId: z.string().optional(),
    typeId: z.string().optional(),
    status: AssetStatus.optional(),
    condition: AssetCondition.optional(),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

// Get assets by unit (convenience endpoint)
export const getAssetsByUnitSchema = z.object({
  params: z.object({
    unitId: z.string(),
  }),
  query: z.object({
    roomId: z.string().optional(),
  }),
});

// Get assets by room
export const getAssetsByRoomSchema = z.object({
  params: z.object({
    roomId: z.string(),
  }),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>['body'];
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>['body'];
export type ListAssetsQuery = z.infer<typeof listAssetsSchema>['query'];
