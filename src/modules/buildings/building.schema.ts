import { z } from 'zod';

export const createBuildingSchema = z.object({
  body: z.object({
    // Primary identifier - Building number is required (e.g., "123" - the house/building number)
    buildingNumber: z.string().min(1), // Building/house number (required)
    roadNumber: z.string().min(1), // Road number (required, e.g., "4567")
    blockNumber: z.string().min(1), // Block number (required, e.g., "123")
    // Optional fields
    name: z.string().optional(), // Building name (optional - not all buildings have names)
    nameAr: z.string().optional(),
    typeId: z.string().optional(), // Building type ID (optional)
    zoneId: z.string().optional(), // Zone ID for geographic context
    totalFloors: z.number().int().min(1).default(1),
    totalUnits: z.number().int().min(0).default(0),
    yearBuilt: z.number().int().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    googlePlaceId: z.string().optional(),
    googleMapId: z.string().optional(),
    landmark: z.string().optional(),
    landmarkAr: z.string().optional(),
    address: z.string().optional(),
    addressAr: z.string().optional(),
  }),
});

export const updateBuildingSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    buildingNumber: z.string().optional(),
    roadNumber: z.string().optional(),
    blockNumber: z.string().optional(),
    name: z.string().optional(),
    nameAr: z.string().optional(),
    typeId: z.string().optional(),
    zoneId: z.string().optional(),
    totalFloors: z.number().int().min(1).optional(),
    totalUnits: z.number().int().min(0).optional(),
    yearBuilt: z.number().int().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    googlePlaceId: z.string().optional(),
    googleMapId: z.string().optional(),
    landmark: z.string().optional(),
    landmarkAr: z.string().optional(),
    address: z.string().optional(),
    addressAr: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getBuildingSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listBuildingsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    typeId: z.string().optional(),
    blockNumber: z.string().optional(),
    roadNumber: z.string().optional(),
    zoneId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

// Bulk create units for a building
export const bulkCreateUnitsSchema = z.object({
  params: z.object({
    id: z.string(), // Building ID
  }),
  body: z.object({
    typeId: z.string().optional(), // Unit type ID (optional)
    fromFlat: z.number().int().min(1),
    toFlat: z.number().int().min(1),
    floor: z.number().int().optional(),
    prefix: z.string().optional(), // Prefix for flat numbers (e.g., "1" for Floor 1 → 11, 12, 13)
    bedrooms: z.number().int().optional(),
    bathrooms: z.number().int().optional(),
    areaSqm: z.number().optional(),
    monthlyRent: z.number().optional(),
    suffixes: z.array(z.string()).optional(), // Optional suffixes like ['A', 'B'] to create 1A, 1B, 2A, 2B, etc.
  }),
});

// Flattened properties list schema (buildings + units combined)
export const listPropertiesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    unit: z.string().optional(), // Unit/Flat number filter
    building: z.string().optional(), // Building number filter
    road: z.string().optional(), // Road number filter
    block: z.string().optional(), // Block number filter
  }),
});

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>['body'];
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>['body'];
export type ListBuildingsQuery = z.infer<typeof listBuildingsSchema>['query'];
export type BulkCreateUnitsInput = z.infer<typeof bulkCreateUnitsSchema>['body'];
export type ListPropertiesQuery = z.infer<typeof listPropertiesSchema>['query'];
