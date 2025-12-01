import { z } from 'zod';

export const listCollectionsSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE']).optional(),
    customerId: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    receivedBy: z.string().optional(),
  }),
});

export const getCollectionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const updateCollectionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
});

export const voidCollectionSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    reason: z.string().min(1, 'Void reason is required'),
  }),
});

export const collectionDailyReportSchema = z.object({
  query: z.object({
    date: z.string().optional(), // defaults to today
    receivedBy: z.string().optional(),
  }),
});

export type ListCollectionsQuery = z.infer<typeof listCollectionsSchema>['query'];
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>['body'];
export type VoidCollectionInput = z.infer<typeof voidCollectionSchema>['body'];
export type CollectionDailyReportQuery = z.infer<typeof collectionDailyReportSchema>['query'];
