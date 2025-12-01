import { z } from 'zod';

// Create Receipt Schema (typically from a payment)
export const createReceiptSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  paymentId: z.string().optional(),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']),
  paymentDate: z.string().datetime(),
  paymentReference: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// Generate Receipt from Payment
export const generateFromPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
});

// Void Receipt Schema
export const voidReceiptSchema = z.object({
  reason: z.string().min(1, 'Void reason is required'),
});

// Query Schema
export const receiptQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
  search: z.string().optional(),
  invoiceId: z.string().optional(),
  customerId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']).optional(),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  isVoided: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'receiptNo', 'amount', 'paymentDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type GenerateFromPaymentInput = z.infer<typeof generateFromPaymentSchema>;
export type VoidReceiptInput = z.infer<typeof voidReceiptSchema>;
export type ReceiptQueryInput = z.infer<typeof receiptQuerySchema>;
