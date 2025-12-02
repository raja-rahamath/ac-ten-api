import { z } from 'zod';

// Billing Cycles
const billingCycleEnum = z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']);

// Membership Status
const membershipStatusEnum = z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'PENDING_PAYMENT']);

// Create Membership Plan
export const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  nameAr: z.string().optional(),
  code: z.string().min(1, 'Plan code is required').regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  billingCycle: billingCycleEnum,
  features: z.array(z.string()).optional(),
  serviceDiscount: z.number().min(0).max(100).default(0),
  partsDiscount: z.number().min(0).max(100).default(0),
  priorityService: z.boolean().default(false),
  freeVisitsPerYear: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// Update Membership Plan
export const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  price: z.number().min(0).optional(),
  billingCycle: billingCycleEnum.optional(),
  features: z.array(z.string()).optional(),
  serviceDiscount: z.number().min(0).max(100).optional(),
  partsDiscount: z.number().min(0).max(100).optional(),
  priorityService: z.boolean().optional(),
  freeVisitsPerYear: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// Subscribe Customer to Plan
export const subscribeSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  planId: z.string().min(1, 'Plan ID is required'),
  startDate: z.string().datetime().optional(), // Defaults to now
  paymentMethod: z.string().optional(),
  autoRenew: z.boolean().default(true),
});

// Renew Membership
export const renewSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  paymentMethod: z.string().optional(),
});

// Change Plan
export const changePlanSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  newPlanId: z.string().min(1, 'New plan ID is required'),
  effectiveDate: z.string().datetime().optional(), // Defaults to end of current period
});

// Cancel Membership
export const cancelSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  reason: z.string().min(1, 'Cancellation reason is required'),
  immediate: z.boolean().default(false), // If false, cancels at end of period
});

// Suspend Membership
export const suspendSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  reason: z.string().min(1, 'Suspension reason is required'),
});

// Reactivate Membership
export const reactivateSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
});

// Use Free Visit
export const useFreeVisitSchema = z.object({
  membershipId: z.string().min(1, 'Membership ID is required'),
  serviceRequestId: z.string().optional(),
});

// Plan Query params
export const planQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z.coerce.boolean().optional(),
  billingCycle: billingCycleEnum.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'sortOrder', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Membership Query params
export const membershipQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  customerId: z.string().optional(),
  planId: z.string().optional(),
  status: membershipStatusEnum.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'startDate', 'endDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type RenewInput = z.infer<typeof renewSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;
export type CancelInput = z.infer<typeof cancelSchema>;
export type SuspendInput = z.infer<typeof suspendSchema>;
export type ReactivateInput = z.infer<typeof reactivateSchema>;
export type UseFreeVisitInput = z.infer<typeof useFreeVisitSchema>;
export type PlanQueryInput = z.infer<typeof planQuerySchema>;
export type MembershipQueryInput = z.infer<typeof membershipQuerySchema>;
