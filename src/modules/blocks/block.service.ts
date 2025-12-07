import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateBlockInput, UpdateBlockInput, ListBlocksQuery } from './block.schema.js';

export class BlockService {
  async create(input: CreateBlockInput) {
    const existing = await prisma.block.findFirst({
      where: {
        areaId: input.areaId,
        blockNo: input.blockNo,
      },
    });

    if (existing) {
      throw new ConflictError('Block with this number already exists in this area');
    }

    const block = await prisma.block.create({
      data: input,
      include: {
        area: {
          include: {
            governorate: {
              include: {
                district: {
                  include: {
                    state: {
                      include: {
                        country: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return block;
  }

  async findById(id: string) {
    const block = await prisma.block.findUnique({
      where: { id },
      include: {
        area: {
          include: {
            governorate: {
              include: {
                district: {
                  include: {
                    state: {
                      include: {
                        country: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        roads: {
          where: { isActive: true },
          orderBy: { roadNo: 'asc' },
        },
        _count: {
          select: {
            roads: true,
            buildings: true,
          },
        },
      },
    });

    if (!block) {
      throw new NotFoundError('Block not found');
    }

    return block;
  }

  async findAll(query: ListBlocksQuery) {
    const { search, areaId, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { blockNo: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (areaId) {
      where.areaId = areaId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [blocks, total] = await Promise.all([
      prisma.block.findMany({
        where,
        skip,
        take: limit,
        include: {
          area: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
          _count: {
            select: {
              roads: true,
              buildings: true,
            },
          },
        },
        orderBy: { blockNo: 'asc' },
      }),
      prisma.block.count({ where }),
    ]);

    return {
      data: blocks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateBlockInput) {
    const existing = await prisma.block.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Block not found');
    }

    if (input.blockNo && input.areaId) {
      const duplicate = await prisma.block.findFirst({
        where: {
          areaId: input.areaId,
          blockNo: input.blockNo,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictError('Block with this number already exists in this area');
      }
    }

    const block = await prisma.block.update({
      where: { id },
      data: input,
      include: {
        area: true,
      },
    });

    return block;
  }

  async delete(id: string) {
    const existing = await prisma.block.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Block not found');
    }

    await prisma.block.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Block deleted successfully' };
  }
}
