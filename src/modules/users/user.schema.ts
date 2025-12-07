import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    roleId: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().optional(),
    roleId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    search: z.string().optional(),
    roleId: z.string().optional(),
    isActive: z.string().transform(v => v === 'true').optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type ListUsersQuery = z.infer<typeof listUsersSchema>['query'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
