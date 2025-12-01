import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateRoomTypeInput, UpdateRoomTypeInput, ListRoomTypesQuery } from './room-type.schema.js';

export class RoomTypeService {
  async create(input: CreateRoomTypeInput) {
    const existing = await prisma.roomType.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Room type with this name already exists');
    }

    const roomType = await prisma.roomType.create({
      data: input,
    });

    return roomType;
  }

  async findById(id: string) {
    const roomType = await prisma.roomType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            rooms: true,
          },
        },
      },
    });

    if (!roomType) {
      throw new NotFoundError('Room type not found');
    }

    return roomType;
  }

  async findAll(query: ListRoomTypesQuery) {
    const { search, category, isActive } = query;
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

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [roomTypes, total] = await Promise.all([
      prisma.roomType.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              rooms: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.roomType.count({ where }),
    ]);

    return {
      data: roomTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateRoomTypeInput) {
    const existing = await prisma.roomType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Room type not found');
    }

    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.roomType.findUnique({
        where: { name: input.name },
      });
      if (duplicate) {
        throw new ConflictError('Room type with this name already exists');
      }
    }

    const roomType = await prisma.roomType.update({
      where: { id },
      data: input,
    });

    return roomType;
  }

  async delete(id: string) {
    const existing = await prisma.roomType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Room type not found');
    }

    await prisma.roomType.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Room type deleted successfully' };
  }
}
