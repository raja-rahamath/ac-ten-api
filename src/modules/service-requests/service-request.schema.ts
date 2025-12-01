import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  body: z.object({
    customerId: z.string(),
    propertyId: z.string(),
    assetId: z.string().optional(),
    zoneId: z.string(),
    complaintTypeId: z.string(),
    requestType: z.enum(['ON_CALL', 'CONTRACT', 'WARRANTY', 'EMERGENCY']).default('ON_CALL'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    title: z.string().min(1),
    description: z.string().optional(),
    preferredDate: z.string().datetime().optional(),
    preferredTimeSlot: z.string().optional(),
  }),
});

export const updateServiceRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedEmployeeId: z.string().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    resolution: z.string().optional(),
    internalNotes: z.string().optional(),
    preferredDate: z.string().datetime().optional(),
    preferredTimeSlot: z.string().optional(),
  }),
});

export const assignServiceRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    employeeId: z.string(),
  }),
});

export const getServiceRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listServiceRequestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    status: z.enum(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    customerId: z.string().optional(),
    assignedEmployeeId: z.string().optional(),
    zoneId: z.string().optional(),
    zoneIds: z.string().optional(), // Comma-separated zone IDs for technicians
  }),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>['body'];
export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>['body'];
export type AssignServiceRequestInput = z.infer<typeof assignServiceRequestSchema>['body'];
export type ListServiceRequestsQuery = z.infer<typeof listServiceRequestsSchema>['query'];
