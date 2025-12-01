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
    });
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
                menuItem: true,
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
    return user.role.menuItems
      .map((rm) => rm.menuItem)
      .filter((menu) => menu.isActive);
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
