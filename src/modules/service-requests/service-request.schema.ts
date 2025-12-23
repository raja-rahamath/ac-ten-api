import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  body: z.object({
    customerId: z.string().optional(), // Optional for customer role - will be derived from authenticated user
    propertyId: z.string(),
    assetId: z.string().optional(),
    zoneId: z.string().optional(), // Will be derived from property if not provided
    complaintTypeId: z.string().optional(), // Either complaintTypeId or category must be provided
    category: z.string().optional(), // Category name (e.g., 'plumbing', 'electrical') - will be looked up
    requestType: z.enum(['ON_CALL', 'CONTRACT', 'WARRANTY', 'EMERGENCY']).default('ON_CALL'),
    // Accept both lowercase and uppercase priority values and transform to uppercase
    priority: z.string().default('MEDIUM').transform((val) => val.toUpperCase()).pipe(
      z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'])
    ),
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
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).optional(),
    assignedEmployeeId: z.string().optional(),
    complaintTypeId: z.string().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    resolution: z.string().optional(),
    internalNotes: z.string().optional(),
    preferredDate: z.string().datetime().optional(),
    preferredTimeSlot: z.string().optional(),
    // Scheduling fields - set by technician after calling customer
    scheduledDate: z.string().datetime().optional(),
    scheduledTime: z.string().optional(), // e.g., "09:00" or "09:00-12:00"
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
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).optional(),
    customerId: z.string().optional(),
    assignedEmployeeId: z.string().optional(),
    assignedToMe: z.coerce.boolean().optional(), // Filter by current user's assigned requests (for technician app)
    zoneId: z.string().optional(),
    zoneIds: z.string().optional(), // Comma-separated zone IDs for technicians
    complaintTypeId: z.string().optional(),
    dateFrom: z.string().optional(), // ISO date string for start of date range
    dateTo: z.string().optional(), // ISO date string for end of date range
  }),
});

export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>['body'];
export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>['body'];
export type AssignServiceRequestInput = z.infer<typeof assignServiceRequestSchema>['body'];
export type ListServiceRequestsQuery = z.infer<typeof listServiceRequestsSchema>['query'];
