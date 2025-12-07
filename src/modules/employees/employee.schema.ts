import { z } from 'zod';

export const createEmployeeSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    firstNameAr: z.string().optional(),
    lastNameAr: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    nationalId: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    hireDate: z.string().datetime().optional(),
    jobTitleId: z.string().optional(),
    companyId: z.string().optional(),
    divisionId: z.string().optional(),
    departmentId: z.string().optional(),
    sectionId: z.string().optional(),
    managerId: z.string().optional(),
    hasSystemAccess: z.boolean().default(false),
    roleId: z.string().optional(),
    zoneIds: z.array(z.string()).optional(),
    isZoneHead: z.boolean().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    firstNameAr: z.string().optional(),
    lastNameAr: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    nationalId: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    hireDate: z.string().datetime().optional(),
    jobTitleId: z.string().optional(),
    companyId: z.string().optional(),
    divisionId: z.string().optional(),
    departmentId: z.string().optional(),
    sectionId: z.string().optional(),
    managerId: z.string().optional(),
    hasSystemAccess: z.boolean().optional(),
    roleId: z.string().optional(),
    isActive: z.boolean().optional(),
    zoneIds: z.array(z.string()).optional(),
  }),
});

export const getEmployeeSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listEmployeesSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    companyId: z.string().optional(),
    departmentId: z.string().optional(),
    jobTitleId: z.string().optional(),
    zoneId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>['body'];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>['body'];
export type ListEmployeesQuery = z.infer<typeof listEmployeesSchema>['query'];
