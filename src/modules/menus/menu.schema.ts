import { z } from 'zod';

// Menu Item schemas
export const createMenuItemSchema = z.object({
  body: z.object({
    key: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    nameAr: z.string().max(100).optional(),
    icon: z.string().max(50).optional(),
    href: z.string().max(200).optional(), // Optional for parent menus
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
    parentId: z.string().optional(), // For hierarchical menus
  }),
});

export const updateMenuItemSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    nameAr: z.string().max(100).optional().nullable(),
    icon: z.string().max(50).optional().nullable(),
    href: z.string().max(200).optional().nullable(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
    parentId: z.string().optional().nullable(),
  }),
});

export const getMenuItemSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

// Role Menu Permission schemas
export const assignMenusToRoleSchema = z.object({
  params: z.object({
    roleId: z.string(),
  }),
  body: z.object({
    menuItemIds: z.array(z.string()),
  }),
});

export const getRoleMenusSchema = z.object({
  params: z.object({
    roleId: z.string(),
  }),
});

// Types
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>['body'];
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>['body'];
export type AssignMenusInput = z.infer<typeof assignMenusToRoleSchema>['body'];
