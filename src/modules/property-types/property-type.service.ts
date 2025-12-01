import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreatePropertyTypeInput, UpdatePropertyTypeInput, ListPropertyTypesQuery } from './property-type.schema.js';

export class PropertyTypeService {
  async create(input: CreatePropertyTypeInput) {
    // Check if property type name exists
    const existing = await prisma.propertyType.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Property type with this name already exists');
    }

    // Calculate level based on parent
    let level = 1;
    if (input.parentId) {
      const parent = await prisma.propertyType.findUnique({
        where: { id: input.parentId },
      });
      if (!parent) {
        throw new NotFoundError('Parent property type not found');
      }
      level = parent.level + 1;
    }

    const propertyType = await prisma.propertyType.create({
      data: {
        ...input,
        level,
      },
      include: {
        parent: {
          select: { id: true, name: true, nameAr: true },
        },
        children: {
          select: { id: true, name: true, nameAr: true, isActive: true },
        },
        _count: {
          select: {
            properties: true,
            children: true,
          },
        },
      },
    });

    return propertyType;
  }

  async findById(id: string) {
    const propertyType = await prisma.propertyType.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true, nameAr: true },
        },
        children: {
          include: {
            children: {
              select: { id: true, name: true, nameAr: true, isActive: true, level: true },
            },
            _count: {
              select: { properties: true, children: true },
            },
          },
          orderBy: { name: 'asc' },
        },
        properties: {
          take: 10,
          select: {
            id: true,
            propertyNo: true,
            name: true,
            nameAr: true,
            address: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            properties: true,
            children: true,
          },
        },
      },
    });

    if (!propertyType) {
      throw new NotFoundError('Property type not found');
    }

    return propertyType;
  }

  async findAll(query: ListPropertyTypesQuery) {
    const { search, isActive, parentId, rootOnly } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (parentId !== undefined) {
      where.parentId = parentId || null;
    }

    if (rootOnly) {
      where.parentId = null;
    }

    const [propertyTypes, total] = await Promise.all([
      prisma.propertyType.findMany({
        where,
        skip,
        take: limit,
        include: {
          parent: {
            select: { id: true, name: true, nameAr: true },
          },
          children: {
            include: {
              children: {
                select: { id: true, name: true, nameAr: true, isActive: true, level: true },
                orderBy: { name: 'asc' },
              },
              _count: {
                select: { properties: true, children: true },
              },
            },
            orderBy: { name: 'asc' },
          },
          _count: {
            select: {
              properties: true,
              children: true,
            },
          },
        },
        orderBy: [{ level: 'asc' }, { name: 'asc' }],
      }),
      prisma.propertyType.count({ where }),
    ]);

    return {
      data: propertyTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get hierarchical tree structure
  async getTree() {
    const rootTypes = await prisma.propertyType.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
                _count: { select: { properties: true, children: true } },
              },
              orderBy: { name: 'asc' },
            },
            _count: { select: { properties: true, children: true } },
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { properties: true, children: true } },
      },
      orderBy: { name: 'asc' },
    });

    return rootTypes;
  }

  async update(id: string, input: UpdatePropertyTypeInput) {
    const existing = await prisma.propertyType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Property type not found');
    }

    // Check name uniqueness if being updated
    if (input.name && input.name !== existing.name) {
      const nameExists = await prisma.propertyType.findUnique({
        where: { name: input.name },
      });
      if (nameExists) {
        throw new ConflictError('Property type name already in use');
      }
    }

    // Calculate new level if parent is being changed
    let level = existing.level;
    if (input.parentId !== undefined) {
      if (input.parentId === null) {
        level = 1;
      } else if (input.parentId !== existing.parentId) {
        // Prevent setting itself as parent
        if (input.parentId === id) {
          throw new ConflictError('Property type cannot be its own parent');
        }
        const parent = await prisma.propertyType.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new NotFoundError('Parent property type not found');
        }
        level = parent.level + 1;
      }
    }

    const propertyType = await prisma.propertyType.update({
      where: { id },
      data: {
        ...input,
        level,
      },
      include: {
        parent: {
          select: { id: true, name: true, nameAr: true },
        },
        children: {
          select: { id: true, name: true, nameAr: true, isActive: true },
        },
        _count: {
          select: {
            properties: true,
            children: true,
          },
        },
      },
    });

    return propertyType;
  }

  async delete(id: string) {
    const existing = await prisma.propertyType.findUnique({
      where: { id },
      include: {
        _count: { select: { children: true } },
      },
    });

    if (!existing) {
      throw new NotFoundError('Property type not found');
    }

    // Check if has children
    if (existing._count.children > 0) {
      throw new ConflictError('Cannot delete property type with sub-types. Delete children first.');
    }

    // Soft delete
    await prisma.propertyType.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Property type deleted successfully' };
  }
}
