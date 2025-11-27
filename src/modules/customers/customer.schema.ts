import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    customerType: z.enum(['INDIVIDUAL', 'ORGANIZATION']).default('INDIVIDUAL'),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    firstNameAr: z.string().optional(),
    lastNameAr: z.string().optional(),
    orgName: z.string().optional(),
    orgNameAr: z.string().optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    altPhone: z.string().optional(),
    nationalId: z.string().optional(),
  }).refine(data => {
    if (data.customerType === 'INDIVIDUAL') {
      return data.firstName && data.lastName;
    }
    return data.orgName;
  }, {
    message: 'Individual customers require firstName and lastName. Organizations require orgName.',
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    customerType: z.enum(['INDIVIDUAL', 'ORGANIZATION']).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    firstNameAr: z.string().optional(),
    lastNameAr: z.string().optional(),
    orgName: z.string().optional(),
    orgNameAr: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    altPhone: z.string().optional(),
    nationalId: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCustomerSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listCustomersSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    customerType: z.enum(['INDIVIDUAL', 'ORGANIZATION']).optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>['body'];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>['body'];
export type ListCustomersQuery = z.infer<typeof listCustomersSchema>['query'];
