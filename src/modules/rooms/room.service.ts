import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateRoomInput, UpdateRoomInput, ListRoomsQuery, BulkCreateRoomsInput } from './room.schema.js';

export class RoomService {
  async create(input: CreateRoomInput) {
    // Verify unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: input.unitId },
    });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    // Check for duplicate room name in the same unit
    const existing = await prisma.room.findFirst({
      where: {
        unitId: input.unitId,
        name: input.name,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictError('Room with this name already exists in this unit');
    }

    const room = await prisma.room.create({
      data: input,
      include: {
        type: true,
        unit: {
          select: {
            id: true,
            unitNo: true,
            flatNumber: true,
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    return room;
  }

  async findById(id: string) {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        type: true,
        unit: {
          select: {
            id: true,
            unitNo: true,
            flatNumber: true,
            building: {
              select: {
                id: true,
                name: true,
                buildingNumber: true,
              },
            },
          },
        },
        assets: {
          where: { isActive: true },
          include: {
            type: true,
          },
        },
        _count: {
          select: {
            assets: true,
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    return room;
  }

  async findAll(query: ListRoomsQuery) {
    const { unitId, typeId, hasAttachedBathroom, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (unitId) {
      where.unitId = unitId;
    }

    if (typeId) {
      where.typeId = typeId;
    }

    if (hasAttachedBathroom !== undefined) {
      where.hasAttachedBathroom = hasAttachedBathroom;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [rooms, total] = await Promise.all([
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        include: {
          type: true,
          unit: {
            select: {
              id: true,
              unitNo: true,
              flatNumber: true,
            },
          },
          _count: {
            select: {
              assets: true,
            },
          },
        },
        orderBy: [{ name: 'asc' }],
      }),
      prisma.room.count({ where }),
    ]);

    return {
      data: rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUnitId(unitId: string) {
    const rooms = await prisma.room.findMany({
      where: {
        unitId,
        isActive: true,
      },
      include: {
        type: true,
        _count: {
          select: {
            assets: true,
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    return rooms;
  }

  async update(id: string, input: UpdateRoomInput) {
    const existing = await prisma.room.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Room not found');
    }

    // Check for duplicate name if changing name
    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.room.findFirst({
        where: {
          unitId: existing.unitId,
          name: input.name,
          isActive: true,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictError('Room with this name already exists in this unit');
      }
    }

    const room = await prisma.room.update({
      where: { id },
      data: input,
      include: {
        type: true,
        unit: {
          select: {
            id: true,
            unitNo: true,
            flatNumber: true,
          },
        },
      },
    });

    return room;
  }

  async delete(id: string) {
    const existing = await prisma.room.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Room not found');
    }

    await prisma.room.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Room deleted successfully' };
  }

  async bulkCreate(unitId: string, input: BulkCreateRoomsInput) {
    // Verify unit exists
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    const createdRooms = [];
    const skipped = [];

    for (const roomData of input.rooms) {
      // Check if room already exists
      const existing = await prisma.room.findFirst({
        where: {
          unitId,
          name: roomData.name,
          isActive: true,
        },
      });

      if (existing) {
        skipped.push(roomData.name);
        continue;
      }

      const room = await prisma.room.create({
        data: {
          ...roomData,
          unitId,
        },
        include: {
          type: true,
        },
      });

      createdRooms.push(room);
    }

    return {
      message: `Successfully created ${createdRooms.length} rooms`,
      created: createdRooms.length,
      skipped: skipped.length,
      skippedNames: skipped,
      rooms: createdRooms,
    };
  }
}
