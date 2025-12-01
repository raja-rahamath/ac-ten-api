import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateUnitInput, UpdateUnitInput, ListUnitsQuery } from './unit.schema.js';

export class UnitService {
  private async generateUnitNo(buildingId: string, flatNumber?: string, unitSuffix?: string): Promise<string> {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { buildingNumber: true },
    });

    if (!building) {
      throw new NotFoundError('Building not found');
    }

    const flatPart = flatNumber || Date.now().toString(36).toUpperCase();
    const suffixPart = unitSuffix || '';
    return `${building.buildingNumber}-${flatPart}${suffixPart}`;
  }

  async create(input: CreateUnitInput) {
    // Check for duplicate unit in the same building
    if (input.flatNumber) {
      const existing = await prisma.unit.findFirst({
        where: {
          buildingId: input.buildingId,
          flatNumber: input.flatNumber,
          unitSuffix: input.unitSuffix || null,
        },
      });

      if (existing) {
        throw new ConflictError('Unit with this flat number already exists in this building');
      }
    }

    const unitNo = await this.generateUnitNo(input.buildingId, input.flatNumber, input.unitSuffix);

    const unit = await prisma.unit.create({
      data: {
        ...input,
        unitNo,
      },
      include: {
        building: {
          include: {
            block: {
              include: {
                zone: true,
              },
            },
            road: true,
          },
        },
        type: true,
      },
    });

    // Update building's total units count
    await prisma.building.update({
      where: { id: input.buildingId },
      data: {
        totalUnits: {
          increment: 1,
        },
      },
    });

    return unit;
  }

  async findById(id: string) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        building: {
          include: {
            type: true,
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
            road: true,
          },
        },
        type: true,
        customers: {
          include: {
            customer: {
              select: {
                id: true,
                customerNo: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        rooms: {
          where: { isActive: true },
        },
        assets: {
          where: { isActive: true },
          include: {
            type: true,
          },
        },
        _count: {
          select: {
            serviceRequests: true,
            rooms: true,
            assets: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    return unit;
  }

  async findAll(query: ListUnitsQuery) {
    const { search, buildingId, typeId, status, floor, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { unitNo: { contains: search, mode: 'insensitive' } },
        { flatNumber: { contains: search, mode: 'insensitive' } },
        { building: { name: { contains: search, mode: 'insensitive' } } },
        { building: { buildingNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (buildingId) {
      where.buildingId = buildingId;
    }

    if (typeId) {
      where.typeId = typeId;
    }

    if (status) {
      where.status = status;
    }

    if (floor !== undefined) {
      where.floor = floor;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        skip,
        take: limit,
        include: {
          building: {
            select: {
              id: true,
              name: true,
              buildingNumber: true,
              block: {
                select: {
                  blockNo: true,
                  zone: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              road: {
                select: {
                  roadNo: true,
                },
              },
            },
          },
          type: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
          _count: {
            select: {
              customers: true,
              serviceRequests: true,
            },
          },
        },
        orderBy: [{ building: { name: 'asc' } }, { floor: 'asc' }, { flatNumber: 'asc' }],
      }),
      prisma.unit.count({ where }),
    ]);

    return {
      data: units,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateUnitInput) {
    const existing = await prisma.unit.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Unit not found');
    }

    // Check for duplicate if changing flat number
    if (input.flatNumber && (input.flatNumber !== existing.flatNumber || input.unitSuffix !== existing.unitSuffix)) {
      const buildingId = input.buildingId || existing.buildingId;
      const duplicate = await prisma.unit.findFirst({
        where: {
          buildingId,
          flatNumber: input.flatNumber,
          unitSuffix: input.unitSuffix || null,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictError('Unit with this flat number already exists in this building');
      }
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: input,
      include: {
        building: true,
        type: true,
      },
    });

    return unit;
  }

  async delete(id: string) {
    const existing = await prisma.unit.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Unit not found');
    }

    await prisma.unit.update({
      where: { id },
      data: { isActive: false },
    });

    // Decrement building's total units count
    await prisma.building.update({
      where: { id: existing.buildingId },
      data: {
        totalUnits: {
          decrement: 1,
        },
      },
    });

    return { message: 'Unit deleted successfully' };
  }
}
