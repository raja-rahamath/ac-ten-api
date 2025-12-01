import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateBuildingTypeInput, UpdateBuildingTypeInput, ListBuildingTypesQuery } from './building-type.schema.js';

export class BuildingTypeService {
  async create(input: CreateBuildingTypeInput) {
    const existing = await prisma.buildingType.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Building type with this name already exists');
    }

    const buildingType = await prisma.buildingType.create({
      data: input,
    });

    return buildingType;
  }

  async findById(id: string) {
    const buildingType = await prisma.buildingType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            buildings: true,
          },
        },
      },
    });

    if (!buildingType) {
      throw new NotFoundError('Building type not found');
    }

    return buildingType;
  }

  async findAll(query: ListBuildingTypesQuery) {
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

    const [buildingTypes, total] = await Promise.all([
      prisma.buildingType.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              buildings: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.buildingType.count({ where }),
    ]);

    return {
      data: buildingTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateBuildingTypeInput) {
    const existing = await prisma.buildingType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Building type not found');
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.buildingType.findUnique({
        where: { name: input.name },
      });
      if (duplicate) {
        throw new ConflictError('Building type with this name already exists');
      }
    }

    const buildingType = await prisma.buildingType.update({
      where: { id },
      data: input,
    });

    return buildingType;
  }

  async delete(id: string) {
    const existing = await prisma.buildingType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Building type not found');
    }

    await prisma.buildingType.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Building type deleted successfully' };
  }
}
