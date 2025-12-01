import { z } from 'zod';

export const dateRangeSchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
  }),
});

export const serviceRequestReportSchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
    groupBy: z.enum(['status', 'type', 'zone', 'technician', 'date']).default('status'),
  }),
});

export const revenueReportSchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
    groupBy: z.enum(['date', 'customer', 'service', 'paymentMethod']).default('date'),
  }),
});

export const employeeReportSchema = z.object({
  query: z.object({
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    period: z.enum(['today', 'week', 'month', 'quarter', 'year', 'custom']).default('month'),
    employeeId: z.string().optional(),
  }),
});

export type DateRangeQuery = z.infer<typeof dateRangeSchema>['query'];
export type ServiceRequestReportQuery = z.infer<typeof serviceRequestReportSchema>['query'];
export type RevenueReportQuery = z.infer<typeof revenueReportSchema>['query'];
export type EmployeeReportQuery = z.infer<typeof employeeReportSchema>['query'];
