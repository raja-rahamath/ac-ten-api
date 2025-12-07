import { z } from 'zod';

// Available dashboard widgets
export const DASHBOARD_WIDGETS = [
  { key: 'total_requests', label: 'Total Requests', group: 'Service Requests' },
  { key: 'new_requests', label: 'New Requests', group: 'Service Requests' },
  { key: 'in_progress_requests', label: 'In Progress Requests', group: 'Service Requests' },
  { key: 'completed_requests', label: 'Completed Requests', group: 'Service Requests' },
  { key: 'recent_requests', label: 'Recent Requests Table', group: 'Service Requests' },
  { key: 'customers', label: 'Total Customers', group: 'CRM' },
  { key: 'employees', label: 'Total Employees', group: 'HR' },
  { key: 'pending_invoices', label: 'Pending Invoices', group: 'Financial' },
  { key: 'revenue', label: 'Revenue', group: 'Financial' },
];

export const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    displayName: z.string().min(1),
    description: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    dashboardWidgets: z.array(z.string()).optional(),
  }),
});

export const updateRoleSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    permissions: z.array(z.string()).optional(),
    dashboardWidgets: z.array(z.string()).optional(),
  }),
});

export const getRoleSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listRolesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
  }),
});

export const updateRolePermissionsSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    permissions: z.array(z.string()),
  }),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>['body'];
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>['body'];
export type ListRolesQuery = z.infer<typeof listRolesSchema>['query'];
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>['body'];
