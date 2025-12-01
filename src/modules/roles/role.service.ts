import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateRoleInput, UpdateRoleInput, ListRolesQuery, UpdateRolePermissionsInput } from './role.schema.js';

export class RoleService {
  async create(input: CreateRoleInput) {
    const { permissions, ...roleData } = input;

    // Check if role name exists
    const existing = await prisma.role.findUnique({
      where: { name: roleData.name },
    });

    if (existing) {
      throw new ConflictError('Role with this name already exists');
    }

    const role = await prisma.role.create({
      data: roleData,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    // Add permissions if provided
    if (permissions && permissions.length > 0) {
      await this.updatePermissions(role.id, { permissions });
      return this.findById(role.id);
    }

    return role;
  }

  async findById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return {
      ...role,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
    };
  }

  async findAll(query: ListRolesQuery) {
    const { search } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where,
        skip,
        take: limit,
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.role.count({ where }),
    ]);

    return {
      data: roles.map(role => ({
        ...role,
        permissions: role.permissions.map(rp => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateRoleInput) {
    const { permissions, ...roleData } = input;

    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    // Prevent modifying system roles
    if (existing.isSystem) {
      throw new ConflictError('Cannot modify system role');
    }

    // Check name uniqueness if being updated
    if (roleData.name && roleData.name !== existing.name) {
      const nameExists = await prisma.role.findUnique({
        where: { name: roleData.name },
      });
      if (nameExists) {
        throw new ConflictError('Role with this name already exists');
      }
    }

    await prisma.role.update({
      where: { id },
      data: roleData,
    });

    // Update permissions if provided
    if (permissions !== undefined) {
      await this.updatePermissions(id, { permissions });
    }

    return this.findById(id);
  }

  async updatePermissions(id: string, input: UpdateRolePermissionsInput) {
    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    // Delete existing permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Add new permissions
    if (input.permissions.length > 0) {
      const permissionRecords = await prisma.permission.findMany({
        where: { id: { in: input.permissions } },
      });

      await prisma.rolePermission.createMany({
        data: permissionRecords.map(p => ({
          roleId: id,
          permissionId: p.id,
        })),
      });
    }

    return this.findById(id);
  }

  async delete(id: string) {
    const existing = await prisma.role.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!existing) {
      throw new NotFoundError('Role not found');
    }

    // Prevent deleting system roles
    if (existing.isSystem) {
      throw new ConflictError('Cannot delete system role');
    }

    // Check if role has users
    if (existing._count.users > 0) {
      throw new ConflictError('Cannot delete role with assigned users');
    }

    // Delete role permissions first
    await prisma.rolePermission.deleteMany({
      where: { roleId: id },
    });

    // Delete role
    await prisma.role.delete({
      where: { id },
    });

    return { message: 'Role deleted successfully' };
  }

  // Get all available permissions
  async getPermissions() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    // Group permissions by resource
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return {
      data: permissions,
      grouped,
    };
  }
}
