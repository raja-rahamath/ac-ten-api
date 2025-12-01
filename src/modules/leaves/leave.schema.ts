import { z } from 'zod';

// Leave Type Schemas
export const createLeaveTypeSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    defaultDays: z.number().int().min(0).default(0),
    isPaid: z.boolean().default(true),
    requiresApproval: z.boolean().default(true),
    maxConsecutiveDays: z.number().int().min(1).optional(),
  }),
});

export const updateLeaveTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    nameAr: z.string().optional(),
    description: z.string().optional(),
    defaultDays: z.number().int().min(0).optional(),
    isPaid: z.boolean().optional(),
    requiresApproval: z.boolean().optional(),
    maxConsecutiveDays: z.number().int().min(1).nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getLeaveTypeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listLeaveTypesSchema = z.object({
  query: z.object({
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

// Leave Request Schemas
export const createLeaveRequestSchema = z.object({
  body: z.object({
    employeeId: z.string(),
    leaveTypeId: z.string(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    reason: z.string().optional(),
    coveringEmployeeId: z.string().optional(),
  }),
});

export const updateLeaveRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    reason: z.string().optional(),
    coveringEmployeeId: z.string().nullable().optional(),
  }),
});

export const approveLeaveRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    approverId: z.string(),
  }),
});

export const rejectLeaveRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    approverId: z.string(),
    rejectionReason: z.string().min(1),
  }),
});

export const getLeaveRequestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listLeaveRequestsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    employeeId: z.string().optional(),
    leaveTypeId: z.string().optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

// Leave Balance Schemas
export const getLeaveBalanceSchema = z.object({
  params: z.object({
    employeeId: z.string(),
  }),
  query: z.object({
    year: z.coerce.number().optional(),
  }),
});

export const initializeLeaveBalanceSchema = z.object({
  body: z.object({
    employeeId: z.string(),
    year: z.number().int().min(2000).max(2100),
  }),
});

export const adjustLeaveBalanceSchema = z.object({
  params: z.object({
    employeeId: z.string(),
    leaveTypeId: z.string(),
  }),
  body: z.object({
    year: z.number().int(),
    adjustment: z.number(), // Positive to add, negative to deduct
    reason: z.string().optional(),
  }),
});

// Export types
export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>['body'];
export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>['body'];
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>['body'];
export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>['body'];
export type ApproveLeaveRequestInput = z.infer<typeof approveLeaveRequestSchema>['body'];
export type RejectLeaveRequestInput = z.infer<typeof rejectLeaveRequestSchema>['body'];
export type ListLeaveRequestsQuery = z.infer<typeof listLeaveRequestsSchema>['query'];
export type AdjustLeaveBalanceInput = z.infer<typeof adjustLeaveBalanceSchema>['body'];
