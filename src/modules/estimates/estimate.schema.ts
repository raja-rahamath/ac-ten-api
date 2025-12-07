import { z } from 'zod';

// Estimate Item Input
export const estimateItemSchema = z.object({
  sortOrder: z.number().optional(),
  itemType: z.enum(['MATERIAL', 'EQUIPMENT', 'CONSUMABLE', 'TRANSPORT', 'OTHER']).default('MATERIAL'),
  inventoryItemId: z.string().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().default('unit'),
  unitCost: z.number().min(0, 'Unit cost must be non-negative'),
  markupType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  markupValue: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Estimate Labor Item Input
export const estimateLaborItemSchema = z.object({
  sortOrder: z.number().optional(),
  laborType: z.enum(['TECHNICIAN', 'HELPER', 'SUPERVISOR', 'SPECIALIST', 'CONTRACTOR']).default('TECHNICIAN'),
  laborRateTypeId: z.string().optional(), // Reference to master labor rate type
  description: z.string().min(1, 'Labor description is required'),
  quantity: z.number().int().positive('Number of workers must be positive'),
  rateType: z.enum(['HOURLY', 'DAILY']).default('HOURLY'), // Calculate by hours or days
  hours: z.number().min(0).default(0), // Hours of work (if HOURLY)
  days: z.number().min(0).default(0), // Days of work (if DAILY)
  hourlyRate: z.number().min(0, 'Hourly rate must be non-negative').default(0),
  dailyRate: z.number().min(0, 'Daily rate must be non-negative').default(0),
  markupType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  markupValue: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// Create Estimate Input
export const createEstimateSchema = z.object({
  serviceRequestId: z.string().min(1, 'Service request ID is required'),
  siteVisitId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  scope: z.string().optional(),

  // Transport cost
  transportCost: z.number().min(0).default(0),

  // Profit margin
  profitMarginType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  profitMarginValue: z.number().min(0).default(0),

  // VAT
  vatRate: z.number().min(0).max(100).default(10),

  // Discount
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().min(0).default(0),
  discountReason: z.string().optional(),

  // Timeline
  estimatedDuration: z.number().positive().optional(),
  estimatedStartDate: z.string().datetime().optional(),
  estimatedEndDate: z.string().datetime().optional(),

  // Notes
  internalNotes: z.string().optional(),
  assumptions: z.string().optional(),
  exclusions: z.string().optional(),

  // Items
  items: z.array(estimateItemSchema).optional().default([]),
  laborItems: z.array(estimateLaborItemSchema).optional().default([]),
});

// Update Estimate Input
export const updateEstimateSchema = createEstimateSchema.partial().omit({ serviceRequestId: true });

// Submit for Approval
export const submitEstimateSchema = z.object({
  notes: z.string().optional(),
});

// Manager Approval/Rejection
export const approveEstimateSchema = z.object({
  notes: z.string().optional(),
});

export const rejectEstimateSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
});

export const requestRevisionSchema = z.object({
  reason: z.string().min(1, 'Revision reason is required'),
  notes: z.string().optional(),
});

// Convert to Quote
export const convertToQuoteSchema = z.object({
  validUntil: z.string().datetime(),
  title: z.string().optional(),
  description: z.string().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  // Option to adjust pricing for customer quote
  adjustPricing: z.boolean().default(false),
  customerDiscount: z.number().min(0).default(0),
  customerDiscountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
});

// Query params
export const estimateQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum([
    'DRAFT',
    'SUBMITTED',
    'PENDING_MANAGER_APPROVAL',
    'REVISION_REQUESTED',
    'APPROVED',
    'REJECTED',
    'CONVERTED',
    'CANCELLED',
  ]).optional(),
  serviceRequestId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  includeRevisions: z.coerce.boolean().default(false),
  sortBy: z.enum(['createdAt', 'updatedAt', 'estimateNo', 'total']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type EstimateItemInput = z.infer<typeof estimateItemSchema>;
export type EstimateLaborItemInput = z.infer<typeof estimateLaborItemSchema>;
export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type UpdateEstimateInput = z.infer<typeof updateEstimateSchema>;
export type SubmitEstimateInput = z.infer<typeof submitEstimateSchema>;
export type ApproveEstimateInput = z.infer<typeof approveEstimateSchema>;
export type RejectEstimateInput = z.infer<typeof rejectEstimateSchema>;
export type RequestRevisionInput = z.infer<typeof requestRevisionSchema>;
export type ConvertToQuoteInput = z.infer<typeof convertToQuoteSchema>;
export type EstimateQueryInput = z.infer<typeof estimateQuerySchema>;
