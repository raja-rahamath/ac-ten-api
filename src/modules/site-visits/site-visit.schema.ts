import { z } from 'zod';

// Create Site Visit Input
export const createSiteVisitSchema = z.object({
  serviceRequestId: z.string().min(1, 'Service request ID is required'),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(), // e.g., "09:00-12:00"
  assignedToId: z.string().optional(),
});

// Update Site Visit Input
export const updateSiteVisitSchema = z.object({
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  assignedToId: z.string().optional(),
  actualDate: z.string().datetime().optional(),
  findings: z.string().optional(),
  recommendations: z.string().optional(),
  photos: z.array(z.string()).optional(),
  customerPresent: z.boolean().optional(),
  customerSignature: z.string().optional(),
});

// Start Site Visit
export const startSiteVisitSchema = z.object({
  notes: z.string().optional(),
});

// Complete Site Visit
export const completeSiteVisitSchema = z.object({
  findings: z.string().min(1, 'Findings are required'),
  recommendations: z.string().optional(),
  photos: z.array(z.string()).optional(),
  customerPresent: z.boolean().default(true),
  customerSignature: z.string().optional(),
});

// Reschedule Site Visit
export const rescheduleSiteVisitSchema = z.object({
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().optional(),
  reason: z.string().min(1, 'Reschedule reason is required'),
});

// Query params
export const siteVisitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  status: z.enum([
    'SCHEDULED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'NO_ACCESS',
    'RESCHEDULED',
  ]).optional(),
  serviceRequestId: z.string().optional(),
  assignedToId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'scheduledDate', 'visitNo']).default('scheduledDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Types
export type CreateSiteVisitInput = z.infer<typeof createSiteVisitSchema>;
export type UpdateSiteVisitInput = z.infer<typeof updateSiteVisitSchema>;
export type StartSiteVisitInput = z.infer<typeof startSiteVisitSchema>;
export type CompleteSiteVisitInput = z.infer<typeof completeSiteVisitSchema>;
export type RescheduleSiteVisitInput = z.infer<typeof rescheduleSiteVisitSchema>;
export type SiteVisitQueryInput = z.infer<typeof siteVisitQuerySchema>;
