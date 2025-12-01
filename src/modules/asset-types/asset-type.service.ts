import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateAssetTypeInput, UpdateAssetTypeInput, ListAssetTypesQuery } from './asset-type.schema.js';

export class AssetTypeService {
  async create(input: CreateAssetTypeInput) {
    // Check if asset type with same name exists
    const existing = await prisma.assetType.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Asset type with this name already exists');
    }

    const assetType = await prisma.assetType.create({
      data: input,
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    return assetType;
  }

  async findById(id: string) {
    const assetType = await prisma.assetType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!assetType) {
      throw new NotFoundError('Asset type not found');
    }

    return assetType;
  }

  async findAll(query: ListAssetTypesQuery) {
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

    const [assetTypes, total] = await Promise.all([
      prisma.assetType.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              assets: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.assetType.count({ where }),
    ]);

    return {
      data: assetTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateAssetTypeInput) {
    const existing = await prisma.assetType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Asset type not found');
    }

    // Check name uniqueness if being updated
    if (input.name && input.name !== existing.name) {
      const nameExists = await prisma.assetType.findUnique({
        where: { name: input.name },
      });
      if (nameExists) {
        throw new ConflictError('Asset type with this name already exists');
      }
    }

    const assetType = await prisma.assetType.update({
      where: { id },
      data: input,
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    return assetType;
  }

  async delete(id: string) {
    const existing = await prisma.assetType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Asset type not found');
    }

    // Soft delete
    await prisma.assetType.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Asset type deleted successfully' };
  }
}
