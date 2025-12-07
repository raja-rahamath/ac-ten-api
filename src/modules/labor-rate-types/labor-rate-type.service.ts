import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateLaborRateTypeInput, UpdateLaborRateTypeInput, ListLaborRateTypesQuery } from './labor-rate-type.schema.js';

export class LaborRateTypeService {
  async create(input: CreateLaborRateTypeInput) {
    // Check if labor rate type with same code exists for this tenant
    const existing = await prisma.laborRateType.findUnique({
      where: {
        tenantId_code: {
          tenantId: input.tenantId,
          code: input.code,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Labor rate type with this code already exists for this tenant');
    }

    const laborRateType = await prisma.laborRateType.create({
      data: {
        tenantId: input.tenantId,
        code: input.code.toUpperCase(),
        name: input.name,
        nameAr: input.nameAr,
        description: input.description,
        hourlyRate: input.hourlyRate,
        dailyRate: input.dailyRate,
        isActive: input.isActive ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });

    return laborRateType;
  }

  async findById(id: string) {
    const laborRateType = await prisma.laborRateType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            estimateLaborItems: true,
          },
        },
      },
    });

    if (!laborRateType) {
      throw new NotFoundError('Labor rate type not found');
    }

    return laborRateType;
  }

  async findAll(query: ListLaborRateTypesQuery) {
    const { search, isActive, tenantId } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [laborRateTypes, total] = await Promise.all([
      prisma.laborRateType.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              estimateLaborItems: true,
            },
          },
        },
        orderBy: [
          { sortOrder: 'asc' },
          { name: 'asc' },
        ],
      }),
      prisma.laborRateType.count({ where }),
    ]);

    return {
      data: laborRateTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateLaborRateTypeInput) {
    const existing = await prisma.laborRateType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Labor rate type not found');
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.laborRateType.findUnique({
        where: {
          tenantId_code: {
            tenantId: existing.tenantId,
            code: input.code.toUpperCase(),
          },
        },
      });
      if (codeExists) {
        throw new ConflictError('Labor rate type with this code already exists for this tenant');
      }
    }

    const laborRateType = await prisma.laborRateType.update({
      where: { id },
      data: {
        ...(input.code && { code: input.code.toUpperCase() }),
        ...(input.name && { name: input.name }),
        ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.hourlyRate !== undefined && { hourlyRate: input.hourlyRate }),
        ...(input.dailyRate !== undefined && { dailyRate: input.dailyRate }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
      include: {
        _count: {
          select: {
            estimateLaborItems: true,
          },
        },
      },
    });

    return laborRateType;
  }

  async delete(id: string) {
    const existing = await prisma.laborRateType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            estimateLaborItems: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Labor rate type not found');
    }

    // If used in estimates, soft delete instead
    if (existing._count.estimateLaborItems > 0) {
      await prisma.laborRateType.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Labor rate type deactivated successfully (in use by estimates)' };
    }

    // Otherwise, hard delete
    await prisma.laborRateType.delete({
      where: { id },
    });

    return { message: 'Labor rate type deleted successfully' };
  }
}
