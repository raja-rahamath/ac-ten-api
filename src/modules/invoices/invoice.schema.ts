import { z } from 'zod';

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  total: z.number().min(0),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    customerId: z.string(),
    serviceRequestId: z.string().optional(),
    dueDate: z.string().datetime(),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1),
  }),
});

export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']).optional(),
    dueDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).optional(),
  }),
});

export const getInvoiceSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listInvoicesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']).optional(),
    customerId: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  }),
});

export const recordPaymentSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    amount: z.number().positive(),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']),
    reference: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>['body'];
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>['body'];
export type ListInvoicesQuery = z.infer<typeof listInvoicesSchema>['query'];
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>['body'];
