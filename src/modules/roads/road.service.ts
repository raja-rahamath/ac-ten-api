import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateRoadInput, UpdateRoadInput, ListRoadsQuery } from './road.schema.js';

export class RoadService {
  async create(input: CreateRoadInput) {
    const existing = await prisma.road.findFirst({
      where: {
        blockId: input.blockId,
        roadNo: input.roadNo,
      },
    });

    if (existing) {
      throw new ConflictError('Road with this number already exists in this block');
    }

    const road = await prisma.road.create({
      data: input,
      include: {
        block: {
          include: {
            zone: {
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
        },
      },
    });

    return road;
  }

  async findById(id: string) {
    const road = await prisma.road.findUnique({
      where: { id },
      include: {
        block: {
          include: {
            zone: {
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
        },
        _count: {
          select: {
            buildings: true,
          },
        },
      },
    });

    if (!road) {
      throw new NotFoundError('Road not found');
    }

    return road;
  }

  async findAll(query: ListRoadsQuery) {
    const { search, blockId, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { roadNo: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (blockId) {
      where.blockId = blockId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [roads, total] = await Promise.all([
      prisma.road.findMany({
        where,
        skip,
        take: limit,
        include: {
          block: {
            select: {
              id: true,
              blockNo: true,
              name: true,
              nameAr: true,
            },
          },
          _count: {
            select: {
              buildings: true,
            },
          },
        },
        orderBy: { roadNo: 'asc' },
      }),
      prisma.road.count({ where }),
    ]);

    return {
      data: roads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateRoadInput) {
    const existing = await prisma.road.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Road not found');
    }

    if (input.roadNo && input.blockId) {
      const duplicate = await prisma.road.findFirst({
        where: {
          blockId: input.blockId,
          roadNo: input.roadNo,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictError('Road with this number already exists in this block');
      }
    }

    const road = await prisma.road.update({
      where: { id },
      data: input,
      include: {
        block: true,
      },
    });

    return road;
  }

  async delete(id: string) {
    const existing = await prisma.road.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Road not found');
    }

    await prisma.road.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Road deleted successfully' };
  }
}
