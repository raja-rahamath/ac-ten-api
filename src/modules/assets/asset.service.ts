import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { CreateAssetInput, UpdateAssetInput, ListAssetsQuery } from './asset.schema.js';

export class AssetService {
  private async generateAssetNo(): Promise<string> {
    const count = await prisma.asset.count();
    const padded = String(count + 1).padStart(6, '0');
    return `AST-${padded}`;
  }

  async create(input: CreateAssetInput) {
    // Validate at least one location is provided
    if (!input.unitId && !input.roomId && !input.buildingId && !input.facilityId) {
      throw new BadRequestError('At least one location (unit, room, building, or facility) must be provided');
    }

    // If roomId is provided, get the unitId from the room
    let unitId = input.unitId;
    if (input.roomId && !unitId) {
      const room = await prisma.room.findUnique({
        where: { id: input.roomId },
        select: { unitId: true },
      });
      if (!room) {
        throw new NotFoundError('Room not found');
      }
      unitId = room.unitId;
    }

    // Verify type exists
    const assetType = await prisma.assetType.findUnique({
      where: { id: input.typeId },
    });
    if (!assetType) {
      throw new NotFoundError('Asset type not found');
    }

    const assetNo = await this.generateAssetNo();

    const asset = await prisma.asset.create({
      data: {
        assetNo,
        unitId,
        roomId: input.roomId,
        buildingId: input.buildingId,
        facilityId: input.facilityId,
        typeId: input.typeId,
        name: input.name,
        nameAr: input.nameAr,
        brand: input.brand,
        model: input.model,
        serialNumber: input.serialNumber,
        capacity: input.capacity,
        specifications: input.specifications,
        purchasePrice: input.purchasePrice,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        installDate: input.installDate ? new Date(input.installDate) : undefined,
        warrantyEndDate: input.warrantyEndDate ? new Date(input.warrantyEndDate) : undefined,
        amcEndDate: input.amcEndDate ? new Date(input.amcEndDate) : undefined,
        expectedLifeYears: input.expectedLifeYears,
        status: input.status,
        condition: input.condition,
        notes: input.notes,
      },
      include: {
        type: true,
        unit: {
          select: {
            id: true,
            unitNo: true,
            flatNumber: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
        building: {
          select: {
            id: true,
            name: true,
            buildingNumber: true,
          },
        },
      },
    });

    return asset;
  }

  async findById(id: string) {
    const asset = await prisma.asset.findUnique({
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
        room: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        building: {
          select: {
            id: true,
            name: true,
            buildingNumber: true,
          },
        },
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        serviceHistory: {
          take: 5,
          orderBy: { performedAt: 'desc' },
        },
        _count: {
          select: {
            serviceHistory: true,
            serviceRequests: true,
          },
        },
      },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    return asset;
  }

  async findAll(query: ListAssetsQuery) {
    const { unitId, roomId, buildingId, facilityId, typeId, status, condition, search, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (unitId) where.unitId = unitId;
    if (roomId) where.roomId = roomId;
    if (buildingId) where.buildingId = buildingId;
    if (facilityId) where.facilityId = facilityId;
    if (typeId) where.typeId = typeId;
    if (status) where.status = status;
    if (condition) where.condition = condition;
    if (isActive !== undefined) where.isActive = isActive;

    if (search) {
      where.OR = [
        { assetNo: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
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
          room: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      }),
      prisma.asset.count({ where }),
    ]);

    return {
      data: assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUnitId(unitId: string, roomId?: string) {
    const where: any = {
      unitId,
      isActive: true,
    };

    if (roomId) {
      where.roomId = roomId;
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        type: true,
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ room: { name: 'asc' } }, { name: 'asc' }],
    });

    return assets;
  }

  async findByRoomId(roomId: string) {
    const assets = await prisma.asset.findMany({
      where: {
        roomId,
        isActive: true,
      },
      include: {
        type: true,
      },
      orderBy: [{ name: 'asc' }],
    });

    return assets;
  }

  async update(id: string, input: UpdateAssetInput) {
    const existing = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Asset not found');
    }

    // If typeId is being updated, verify it exists
    if (input.typeId) {
      const assetType = await prisma.assetType.findUnique({
        where: { id: input.typeId },
      });
      if (!assetType) {
        throw new NotFoundError('Asset type not found');
      }
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...input,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : input.purchaseDate === null ? null : undefined,
        installDate: input.installDate ? new Date(input.installDate) : input.installDate === null ? null : undefined,
        warrantyEndDate: input.warrantyEndDate ? new Date(input.warrantyEndDate) : input.warrantyEndDate === null ? null : undefined,
        amcEndDate: input.amcEndDate ? new Date(input.amcEndDate) : input.amcEndDate === null ? null : undefined,
        lastServiceDate: input.lastServiceDate ? new Date(input.lastServiceDate) : input.lastServiceDate === null ? null : undefined,
        nextServiceDue: input.nextServiceDue ? new Date(input.nextServiceDue) : input.nextServiceDue === null ? null : undefined,
      },
      include: {
        type: true,
        unit: {
          select: {
            id: true,
            unitNo: true,
            flatNumber: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return asset;
  }

  async delete(id: string) {
    const existing = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Asset not found');
    }

    // Soft delete
    await prisma.asset.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Asset deleted successfully' };
  }

  async updateCondition(id: string, condition: string) {
    const existing = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Asset not found');
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: { condition: condition as any },
      include: {
        type: true,
      },
    });

    return asset;
  }

  async updateStatus(id: string, status: string) {
    const existing = await prisma.asset.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Asset not found');
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: { status: status as any },
      include: {
        type: true,
      },
    });

    return asset;
  }
}
