import { z } from 'zod';

// Comment Types
const commentTypeEnum = z.enum([
  'INTERNAL_NOTE',
  'CUSTOMER_CALL',
  'CUSTOMER_CALLED',
  'EMAIL_SENT',
  'EMAIL_RECEIVED',
  'SMS_SENT',
  'SMS_RECEIVED',
  'WHATSAPP',
  'CUSTOMER_MESSAGE',
  'SITE_VISIT_NOTE',
  'SCHEDULING_NOTE',
]);

// Create Comment
export const createCommentSchema = z.object({
  serviceRequestId: z.string().min(1, 'Service request ID is required'),
  content: z.string().min(1, 'Comment content is required'),
  commentType: commentTypeEnum.default('INTERNAL_NOTE'),
  isInternal: z.boolean().default(true),
  isCustomerAuthor: z.boolean().default(false),

  // Contact tracking
  contactMethod: z.enum(['PHONE', 'EMAIL', 'IN_PERSON', 'WHATSAPP']).optional(),
  contactNumber: z.string().optional(),
  contactDuration: z.number().int().min(0).optional(), // seconds
  contactedAt: z.string().datetime().optional(),

  // Scheduling preference
  preferredDate: z.string().optional(), // "2024-12-03"
  preferredTime: z.string().optional(), // "10:30 AM" or "16:00"
});

// Update Comment
export const updateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  isInternal: z.boolean().optional(),
  preferredDate: z.string().optional().nullable(),
  preferredTime: z.string().optional().nullable(),
});

// Query Comments
export const commentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  serviceRequestId: z.string().optional(),
  commentType: commentTypeEnum.optional(),
  isInternal: z.coerce.boolean().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Add Customer Call Comment (convenience schema)
export const addCallCommentSchema = z.object({
  serviceRequestId: z.string().min(1, 'Service request ID is required'),
  content: z.string().min(1, 'Comment content is required'),
  direction: z.enum(['OUTBOUND', 'INBOUND']).default('OUTBOUND'),
  contactNumber: z.string().optional(),
  contactDuration: z.number().int().min(0).optional(),
  contactedAt: z.string().datetime().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
});

// Types
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CommentQueryInput = z.infer<typeof commentQuerySchema>;
export type AddCallCommentInput = z.infer<typeof addCallCommentSchema>;
