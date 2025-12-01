import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateInventoryCategoryInput, UpdateInventoryCategoryInput, ListInventoryCategoriesQuery } from './inventory-category.schema.js';

export class InventoryCategoryService {
  async create(input: CreateInventoryCategoryInput) {
    // Check if category with same name exists
    const existing = await prisma.inventoryCategory.findFirst({
      where: {
        name: input.name,
      },
    });

    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    const category = await prisma.inventoryCategory.create({
      data: input,
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return category;
  }

  async findById(id: string) {
    const category = await prisma.inventoryCategory.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            itemNo: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Inventory category not found');
    }

    return category;
  }

  async findAll(query: ListInventoryCategoriesQuery) {
    const { search, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [categories, total] = await Promise.all([
      prisma.inventoryCategory.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateInventoryCategoryInput) {
    const existing = await prisma.inventoryCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Inventory category not found');
    }

    // Check name uniqueness if being updated
    if (input.name && input.name !== existing.name) {
      const nameExists = await prisma.inventoryCategory.findFirst({
        where: {
          name: input.name,
          NOT: { id },
        },
      });
      if (nameExists) {
        throw new ConflictError('Category with this name already exists');
      }
    }

    const category = await prisma.inventoryCategory.update({
      where: { id },
      data: input,
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return category;
  }

  async delete(id: string) {
    const existing = await prisma.inventoryCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Inventory category not found');
    }

    // Soft delete
    await prisma.inventoryCategory.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Inventory category deleted successfully' };
  }
}
