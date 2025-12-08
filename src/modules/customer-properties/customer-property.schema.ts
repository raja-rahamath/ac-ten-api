import { z } from 'zod';

export const createCustomerPropertySchema = z.object({
  body: z.object({
    customerId: z.string().min(1),
    propertyId: z.string().min(1),
    ownershipType: z.enum(['OWNER', 'TENANT', 'PROPERTY_MANAGER', 'AUTHORIZED_CONTACT']).default('TENANT'),
    isPrimary: z.boolean().default(false),
    startDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const updateCustomerPropertySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    ownershipType: z.enum(['OWNER', 'TENANT', 'PROPERTY_MANAGER', 'AUTHORIZED_CONTACT']).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED']).optional(),
    isPrimary: z.boolean().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const getCustomerPropertySchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listCustomerPropertiesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    customerId: z.string().optional(),
    propertyId: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED']).optional(),
    ownershipType: z.enum(['OWNER', 'TENANT', 'PROPERTY_MANAGER', 'AUTHORIZED_CONTACT']).optional(),
    search: z.string().optional(),
  }),
});

// Get properties for a specific customer
export const getCustomerPropertiesByCustomerSchema = z.object({
  params: z.object({
    customerId: z.string(),
  }),
  query: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED']).optional(),
  }),
});

// Get customers for a specific property
export const getPropertyCustomersSchema = z.object({
  params: z.object({
    propertyId: z.string(),
  }),
  query: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED']).optional(),
  }),
});

// Transfer property (deactivate old, create new)
export const transferPropertySchema = z.object({
  params: z.object({
    id: z.string(), // current customer-property ID
  }),
  body: z.object({
    newCustomerId: z.string().min(1),
    ownershipType: z.enum(['OWNER', 'TENANT', 'PROPERTY_MANAGER', 'AUTHORIZED_CONTACT']).default('TENANT'),
    transferDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export type CreateCustomerPropertyInput = z.infer<typeof createCustomerPropertySchema>['body'];
export type UpdateCustomerPropertyInput = z.infer<typeof updateCustomerPropertySchema>['body'];
export type ListCustomerPropertiesQuery = z.infer<typeof listCustomerPropertiesSchema>['query'];
export type GetCustomerPropertiesByCustomerQuery = z.infer<typeof getCustomerPropertiesByCustomerSchema>['query'];
export type TransferPropertyInput = z.infer<typeof transferPropertySchema>['body'];
