import { z } from 'zod';

export const createZoneSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    headId: z.string().optional(),
    secondaryHeadId: z.string().optional(),
    areaIds: z.array(z.string()).optional(),
  }),
});

export const updateZoneSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    code: z.string().optional(),
    description: z.string().optional(),
    headId: z.string().optional(),
    secondaryHeadId: z.string().optional(),
    isActive: z.boolean().optional(),
    areaIds: z.array(z.string()).optional(),
  }),
});

export const getZoneSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listZonesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

// Zone Team Management Schemas
export const getZoneTeamSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const assignEmployeeToZoneSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    employeeId: z.string(),
    role: z.enum(['PRIMARY_HEAD', 'SECONDARY_HEAD', 'TECHNICIAN', 'HELPER']),
    isPrimary: z.boolean().optional().default(false),
  }),
});

export const removeEmployeeFromZoneSchema = z.object({
  params: z.object({
    id: z.string(),
    employeeId: z.string(),
  }),
});

export const updateZoneHeadsSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    primaryHeadId: z.string().nullable().optional(),
    secondaryHeadId: z.string().nullable().optional(),
  }),
});

export type CreateZoneInput = z.infer<typeof createZoneSchema>['body'];
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>['body'];
export type ListZonesQuery = z.infer<typeof listZonesSchema>['query'];
export type AssignEmployeeInput = z.infer<typeof assignEmployeeToZoneSchema>['body'];
export type UpdateZoneHeadsInput = z.infer<typeof updateZoneHeadsSchema>['body'];
