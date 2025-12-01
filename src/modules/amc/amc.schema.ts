import { z } from 'zod';

// Enums matching Prisma
export const AmcStatus = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'CANCELLED',
  'RENEWED',
]);

export const AmcPaymentTerms = z.enum([
  'UPFRONT',
  'MONTHLY',
  'QUARTERLY',
  'SEMI_ANNUAL',
  'ANNUAL',
]);

export const AmcServiceFrequency = z.enum([
  'WEEKLY',
  'BI_WEEKLY',
  'MONTHLY',
  'BI_MONTHLY',
  'QUARTERLY',
  'SEMI_ANNUAL',
  'ANNUAL',
]);

export const AmcScheduleStatus = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'MISSED',
  'RESCHEDULED',
  'CANCELLED',
]);

export const AmcPaymentStatus = z.enum([
  'PENDING',
  'DUE',
  'PAID',
  'OVERDUE',
  'PARTIALLY_PAID',
  'WAIVED',
]);

// Contract Service schema
export const contractServiceSchema = z.object({
  complaintTypeId: z.string().min(1, 'Service type is required'),
  frequency: AmcServiceFrequency.default('MONTHLY'),
  visitsPerYear: z.number().int().min(1).max(365).default(12),
  serviceCost: z.number().optional(),
  notes: z.string().optional(),
});

// Contract Property schema
export const contractPropertySchema = z.object({
  unitId: z.string().optional(),
  propertyId: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => data.unitId || data.propertyId,
  { message: 'Either unitId or propertyId must be provided' }
);

// Create AMC Contract
export const createAmcContractSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
  contractValue: z.number().positive('Contract value must be positive'),
  paymentTerms: AmcPaymentTerms.default('MONTHLY'),
  autoRenew: z.boolean().default(false),
  renewalReminderDays: z.number().int().min(1).max(90).optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  properties: z.array(contractPropertySchema).min(1, 'At least one property is required'),
  services: z.array(contractServiceSchema).min(1, 'At least one service is required'),
});

// Update AMC Contract
export const updateAmcContractSchema = z.object({
  startDate: z.string().transform((val) => new Date(val)).optional(),
  endDate: z.string().transform((val) => new Date(val)).optional(),
  contractValue: z.number().positive().optional(),
  paymentTerms: AmcPaymentTerms.optional(),
  autoRenew: z.boolean().optional(),
  renewalReminderDays: z.number().int().min(1).max(90).nullable().optional(),
  terms: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// Update Contract Status
export const updateAmcStatusSchema = z.object({
  status: AmcStatus,
  reason: z.string().optional(),
});

// Add Property to Contract
export const addContractPropertySchema = contractPropertySchema;

// Add Service to Contract
export const addContractServiceSchema = contractServiceSchema;

// Update Schedule Status
export const updateScheduleStatusSchema = z.object({
  status: AmcScheduleStatus,
  notes: z.string().optional(),
});

// Record Payment
export const recordPaymentSchema = z.object({
  paidAmount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']),
  paymentReference: z.string().optional(),
  notes: z.string().optional(),
});

// List Query params
export const listAmcContractsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  customerId: z.string().optional(),
  status: AmcStatus.optional(),
  expiringWithinDays: z.coerce.number().int().min(1).optional(),
});

export const listSchedulesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  contractId: z.string().optional(),
  status: AmcScheduleStatus.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  contractId: z.string().optional(),
  status: AmcPaymentStatus.optional(),
});

// Type exports
export type CreateAmcContractInput = z.infer<typeof createAmcContractSchema>;
export type UpdateAmcContractInput = z.infer<typeof updateAmcContractSchema>;
export type UpdateAmcStatusInput = z.infer<typeof updateAmcStatusSchema>;
export type ContractPropertyInput = z.infer<typeof contractPropertySchema>;
export type ContractServiceInput = z.infer<typeof contractServiceSchema>;
export type UpdateScheduleStatusInput = z.infer<typeof updateScheduleStatusSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ListAmcContractsQuery = z.infer<typeof listAmcContractsQuerySchema>;
export type ListSchedulesQuery = z.infer<typeof listSchedulesQuerySchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
