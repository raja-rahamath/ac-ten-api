import { z } from 'zod';

// Review Source enum
const reviewSourceEnum = z.enum(['PORTAL', 'EMAIL_LINK', 'SMS_LINK', 'MANUAL', 'GOOGLE']);

// Create Review
export const createReviewSchema = z.object({
  serviceRequestId: z.string().optional(),
  workOrderId: z.string().optional(),
  customerId: z.string().min(1, 'Customer ID is required'),
  overallRating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  qualityRating: z.number().int().min(1).max(5).optional(),
  timelinessRating: z.number().int().min(1).max(5).optional(),
  professionalismRating: z.number().int().min(1).max(5).optional(),
  valueRating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
  wouldRecommend: z.boolean().optional(),
  isPublic: z.boolean().default(true),
  source: reviewSourceEnum.default('PORTAL'),
}).refine(
  (data) => data.serviceRequestId || data.workOrderId,
  { message: 'Either serviceRequestId or workOrderId is required' }
);

// Update Review
export const updateReviewSchema = z.object({
  overallRating: z.number().int().min(1).max(5).optional(),
  qualityRating: z.number().int().min(1).max(5).optional().nullable(),
  timelinessRating: z.number().int().min(1).max(5).optional().nullable(),
  professionalismRating: z.number().int().min(1).max(5).optional().nullable(),
  valueRating: z.number().int().min(1).max(5).optional().nullable(),
  comment: z.string().optional().nullable(),
  wouldRecommend: z.boolean().optional().nullable(),
  isPublic: z.boolean().optional(),
});

// Respond to Review
export const respondToReviewSchema = z.object({
  responseText: z.string().min(1, 'Response text is required'),
});

// Query Reviews
export const reviewQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  customerId: z.string().optional(),
  serviceRequestId: z.string().optional(),
  workOrderId: z.string().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  maxRating: z.coerce.number().int().min(1).max(5).optional(),
  isPublic: z.coerce.boolean().optional(),
  isVerified: z.coerce.boolean().optional(),
  hasResponse: z.coerce.boolean().optional(),
  wouldRecommend: z.coerce.boolean().optional(),
  source: reviewSourceEnum.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'overallRating']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Request Review (send notification to customer)
export const requestReviewSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  serviceRequestId: z.string().optional(),
  workOrderId: z.string().optional(),
  channel: z.enum(['EMAIL', 'SMS', 'BOTH']).default('EMAIL'),
}).refine(
  (data) => data.serviceRequestId || data.workOrderId,
  { message: 'Either serviceRequestId or workOrderId is required' }
);

// Types
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type RespondToReviewInput = z.infer<typeof respondToReviewSchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
export type RequestReviewInput = z.infer<typeof requestReviewSchema>;
