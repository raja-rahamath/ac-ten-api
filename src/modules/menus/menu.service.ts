import { PrismaClient } from '@prisma/client';
import { CreateMenuItemInput, UpdateMenuItemInput } from './menu.schema.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';

const prisma = new PrismaClient();

export class MenuService {
  // ==================== Menu Item CRUD ====================

  async createMenuItem(data: CreateMenuItemInput) {
    // Check if key already exists
    const existing = await prisma.menuItem.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      throw new ConflictError(`Menu item with key '${data.key}' already exists`);
    }

    return prisma.menuItem.create({
      data: {
        key: data.key,
        name: data.name,
        nameAr: data.nameAr,
        icon: data.icon,
        href: data.href,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
        parentId: data.parentId,
      },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async getMenuItemById(id: string) {
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        roleMenus: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Menu item not found');
    }

    return item;
  }

  async getAllMenuItems(includeInactive = false) {
    return prisma.menuItem.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        parent: { select: { id: true, key: true, name: true } },
        children: {
          orderBy: { sortOrder: 'asc' },
          where: includeInactive ? {} : { isActive: true },
        },
      },
    });
  }

  async getHierarchicalMenus(includeInactive = false) {
    // Get all top-level menus (no parent)
    const topLevel = await prisma.menuItem.findMany({
      where: {
        parentId: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return topLevel;
  }

  async updateMenuItem(id: string, data: UpdateMenuItemInput) {
    await this.getMenuItemById(id);

    return prisma.menuItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.nameAr !== undefined && { nameAr: data.nameAr }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.href !== undefined && { href: data.href }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteMenuItem(id: string) {
    await this.getMenuItemById(id);

    await prisma.menuItem.delete({
      where: { id },
    });

    return { message: 'Menu item deleted successfully' };
  }

  // ==================== Role Menu Permissions ====================

  async assignMenusToRole(roleId: string, menuItemIds: string[]) {
    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Delete existing assignments for this role
    await prisma.roleMenuPermission.deleteMany({
      where: { roleId },
    });

    // Create new assignments
    if (menuItemIds.length > 0) {
      await prisma.roleMenuPermission.createMany({
        data: menuItemIds.map((menuItemId) => ({
          roleId,
          menuItemId,
        })),
      });
    }

    return this.getMenusForRole(roleId);
  }

  async getMenusForRole(roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        menuItems: {
          include: {
            menuItem: true,
          },
          orderBy: {
            menuItem: {
              sortOrder: 'asc',
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return {
      role: {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
      },
      menuItems: role.menuItems.map((rm) => rm.menuItem),
    };
  }

  async getMenusForUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            menuItems: {
              include: {
                menuItem: {
                  include: {
                    parent: { select: { id: true, key: true, name: true, nameAr: true, icon: true } },
                    children: {
                      where: { isActive: true },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
              orderBy: {
                menuItem: {
                  sortOrder: 'asc',
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // If user has no role or role has no menu items, return empty array
    if (!user.role || !user.role.menuItems) {
      return [];
    }

    // Return only active menu items
    const flatMenus = user.role.menuItems
      .map((rm) => rm.menuItem)
      .filter((menu) => menu.isActive);

    // Build hierarchical structure
    const menuMap = new Map();
    const rootMenus: any[] = [];

    // First pass: create map of all menus
    for (const menu of flatMenus) {
      menuMap.set(menu.id, { ...menu, children: [] });
    }

    // Second pass: build tree
    for (const menu of flatMenus) {
      const menuWithChildren = menuMap.get(menu.id);
      if (menu.parentId && menuMap.has(menu.parentId)) {
        const parent = menuMap.get(menu.parentId);
        parent.children.push(menuWithChildren);
      } else if (!menu.parentId) {
        rootMenus.push(menuWithChildren);
      } else {
        // Parent not in user's permissions, show as root
        rootMenus.push(menuWithChildren);
      }
    }

    // Sort children within each parent
    for (const menu of rootMenus) {
      if (menu.children?.length > 0) {
        menu.children.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
      }
    }

    return rootMenus;
  }

  async getAllRolesWithMenus() {
    const roles = await prisma.role.findMany({
      include: {
        menuItems: {
          include: {
            menuItem: true,
          },
          orderBy: {
            menuItem: {
              sortOrder: 'asc',
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      isSystem: role.isSystem,
      menuItems: role.menuItems.map((rm) => rm.menuItem),
    }));
  }

  // ==================== User Zone Data (for technicians) ====================

  async getUserZones(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            zoneAssignments: {
              where: { isActive: true },
              include: {
                zone: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.employee) {
      return [];
    }

    return user.employee.zoneAssignments.map((za) => ({
      zoneId: za.zoneId,
      zoneName: za.zone.name,
      zoneNameAr: za.zone.nameAr,
      role: za.role,
      isPrimary: za.isPrimary,
    }));
  }
}
