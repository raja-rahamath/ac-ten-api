import { z } from 'zod';

// Quote Item Schema
export const quoteItemSchema = z.object({
  sortOrder: z.number().optional().default(0),
  itemType: z.enum(['SERVICE', 'LABOR', 'MATERIAL', 'EQUIPMENT', 'TRAVEL', 'DISCOUNT', 'OTHER']).default('SERVICE'),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().positive('Quantity must be positive').default(1),
  unit: z.string().default('unit'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
  discountValue: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

// Create Quote Schema
export const createQuoteSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  unitId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  serviceRequestId: z.string().optional().nullable(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
  discountValue: z.number().min(0).default(0),
  currency: z.string().default('BHD'),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
});

// Update Quote Schema
export const updateQuoteSchema = z.object({
  customerId: z.string().optional(),
  unitId: z.string().optional().nullable(),
  propertyId: z.string().optional().nullable(),
  serviceRequestId: z.string().optional().nullable(),
  title: z.string().optional(),
  description: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
  discountValue: z.number().min(0).optional(),
  currency: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(quoteItemSchema).optional(),
});

// Send Quote Schema
export const sendQuoteSchema = z.object({
  email: z.string().email().optional(),
  message: z.string().optional(),
});

// Customer Response Schema
export const customerResponseSchema = z.object({
  response: z.enum(['REVIEWING', 'NEGOTIATING', 'ACCEPTED', 'REJECTED']),
  notes: z.string().optional(),
});

// Create Revision Schema
export const createRevisionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
  discountValue: z.number().min(0).optional(),
  validUntil: z.string().datetime(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
  revisionReason: z.string().optional(),
});

// Convert to Invoice Schema
export const convertToInvoiceSchema = z.object({
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Query Schema
export const quoteQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum([
    'DRAFT', 'PENDING_REVIEW', 'SENT', 'VIEWED', 'REVISED',
    'ACCEPTED', 'REJECTED', 'EXPIRED', 'CONVERTED', 'CANCELLED'
  ]).optional(),
  customerId: z.string().optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  includeRevisions: z.coerce.boolean().default(false),
  sortBy: z.enum(['createdAt', 'quoteNo', 'total', 'validUntil', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;
export type QuoteItemInput = z.infer<typeof quoteItemSchema>;
export type SendQuoteInput = z.infer<typeof sendQuoteSchema>;
export type CustomerResponseInput = z.infer<typeof customerResponseSchema>;
export type CreateRevisionInput = z.infer<typeof createRevisionSchema>;
export type ConvertToInvoiceInput = z.infer<typeof convertToInvoiceSchema>;
export type QuoteQueryInput = z.infer<typeof quoteQuerySchema>;
