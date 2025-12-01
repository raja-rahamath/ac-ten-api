import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateUnitTypeInput, UpdateUnitTypeInput, ListUnitTypesQuery } from './unit-type.schema.js';

export class UnitTypeService {
  async create(input: CreateUnitTypeInput) {
    const existing = await prisma.unitType.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Unit type with this name already exists');
    }

    const unitType = await prisma.unitType.create({
      data: input,
    });

    return unitType;
  }

  async findById(id: string) {
    const unitType = await prisma.unitType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            units: true,
          },
        },
      },
    });

    if (!unitType) {
      throw new NotFoundError('Unit type not found');
    }

    return unitType;
  }

  async findAll(query: ListUnitTypesQuery) {
    const { search, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
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

    const [unitTypes, total] = await Promise.all([
      prisma.unitType.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              units: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.unitType.count({ where }),
    ]);

    return {
      data: unitTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateUnitTypeInput) {
    const existing = await prisma.unitType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Unit type not found');
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.unitType.findUnique({
        where: { name: input.name },
      });
      if (duplicate) {
        throw new ConflictError('Unit type with this name already exists');
      }
    }

    const unitType = await prisma.unitType.update({
      where: { id },
      data: input,
    });

    return unitType;
  }

  async delete(id: string) {
    const existing = await prisma.unitType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Unit type not found');
    }

    await prisma.unitType.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Unit type deleted successfully' };
  }
}
