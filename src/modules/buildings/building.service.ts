import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors.js';
import { CreateBuildingInput, UpdateBuildingInput, ListBuildingsQuery, BulkCreateUnitsInput, ListPropertiesQuery } from './building.schema.js';

export class BuildingService {
  async create(input: CreateBuildingInput) {
    // Check if building number already exists
    const existing = await prisma.building.findFirst({
      where: { buildingNumber: input.buildingNumber },
    });
    if (existing) {
      throw new ConflictError('Building number already exists');
    }

    const building = await prisma.building.create({
      data: {
        buildingNumber: input.buildingNumber,
        roadNumber: input.roadNumber,
        blockNumber: input.blockNumber,
        name: input.name || null,
        nameAr: input.nameAr,
        typeId: input.typeId || null,
        areaId: input.areaId || null,
        totalFloors: input.totalFloors || 1,
        totalUnits: input.totalUnits || 0,
        yearBuilt: input.yearBuilt,
        latitude: input.latitude,
        longitude: input.longitude,
        googlePlaceId: input.googlePlaceId,
        googleMapId: input.googleMapId,
        landmark: input.landmark,
        landmarkAr: input.landmarkAr,
        address: input.address,
        addressAr: input.addressAr,
      },
      include: {
        type: true,
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

    return building;
  }

  async findById(id: string) {
    const building = await prisma.building.findUnique({
      where: { id },
      include: {
        type: true,
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
        units: {
          where: { isActive: true },
          include: {
            type: true,
            _count: {
              select: {
                customers: true,
                serviceRequests: true,
              },
            },
          },
          orderBy: [{ floor: 'asc' }, { flatNumber: 'asc' }],
        },
        _count: {
          select: {
            units: true,
            assets: true,
          },
        },
      },
    });

    if (!building) {
      throw new NotFoundError('Building not found');
    }

    return building;
  }

  async findAll(query: ListBuildingsQuery) {
    const { search, typeId, blockNumber, roadNumber, areaId, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { buildingNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { blockNumber: { contains: search, mode: 'insensitive' } },
        { roadNumber: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (typeId) {
      where.typeId = typeId;
    }

    if (blockNumber) {
      where.blockNumber = blockNumber;
    }

    if (roadNumber) {
      where.roadNumber = roadNumber;
    }

    if (areaId) {
      where.areaId = areaId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [buildings, total] = await Promise.all([
      prisma.building.findMany({
        where,
        skip,
        take: limit,
        include: {
          type: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
          area: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
          _count: {
            select: {
              units: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.building.count({ where }),
    ]);

    return {
      data: buildings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateBuildingInput) {
    const existing = await prisma.building.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Building not found');
    }

    const building = await prisma.building.update({
      where: { id },
      data: input,
      include: {
        type: true,
        area: true,
      },
    });

    return building;
  }

  async delete(id: string) {
    const existing = await prisma.building.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Building not found');
    }

    await prisma.building.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Building deleted successfully' };
  }

  async bulkCreateUnits(buildingId: string, input: BulkCreateUnitsInput) {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundError('Building not found');
    }

    if (input.fromFlat > input.toFlat) {
      throw new BadRequestError('From flat number must be less than or equal to to flat number');
    }

    const suffixes = input.suffixes || [null];
    const prefix = input.prefix || '';
    const unitsToCreate: any[] = [];

    for (let flatNum = input.fromFlat; flatNum <= input.toFlat; flatNum++) {
      for (const suffix of suffixes) {
        // Apply prefix to flat number (e.g., prefix "1" + flatNum 1 = "11")
        const flatNumber = `${prefix}${flatNum}`;
        const unitSuffix = suffix || null;
        // Use buildingNumber field (not buildingNo)
        const unitNo = `${building.buildingNumber}-${flatNumber}${suffix || ''}`;

        // Check if unit already exists
        const existingUnit = await prisma.unit.findFirst({
          where: {
            buildingId,
            flatNumber,
            unitSuffix,
          },
        });

        if (!existingUnit) {
          unitsToCreate.push({
            unitNo,
            buildingId,
            typeId: input.typeId || null,
            flatNumber,
            unitSuffix,
            floor: input.floor,
            bedrooms: input.bedrooms,
            bathrooms: input.bathrooms,
            areaSqm: input.areaSqm,
            monthlyRent: input.monthlyRent,
          });
        }
      }
    }

    if (unitsToCreate.length === 0) {
      return { message: 'All units already exist', created: 0 };
    }

    const result = await prisma.unit.createMany({
      data: unitsToCreate,
      skipDuplicates: true,
    });

    // Update building's total units count
    await prisma.building.update({
      where: { id: buildingId },
      data: {
        totalUnits: {
          increment: result.count,
        },
      },
    });

    return {
      message: `Successfully created ${result.count} units`,
      created: result.count,
      skipped: unitsToCreate.length - result.count,
    };
  }

  async findAllProperties(query: ListPropertiesQuery) {
    const { unit, building, road, block } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build the where clause for filtering
    const buildingWhere: any = { isActive: true };

    if (building) {
      buildingWhere.buildingNumber = { contains: building, mode: 'insensitive' };
    }

    if (road) {
      buildingWhere.roadNumber = { contains: road, mode: 'insensitive' };
    }

    if (block) {
      buildingWhere.blockNumber = { contains: block, mode: 'insensitive' };
    }

    // Get all matching buildings
    const buildings = await prisma.building.findMany({
      where: buildingWhere,
      include: {
        area: {
          select: { id: true, name: true, nameAr: true },
        },
        units: {
          where: { isActive: true },
          include: {
            type: {
              select: { id: true, name: true, nameAr: true },
            },
          },
          orderBy: { flatNumber: 'asc' },
        },
      },
      orderBy: { buildingNumber: 'asc' },
    });

    // Build flat property list: each building as "Compound Entrance" + its units
    const properties: Array<{
      id: string;
      type: 'building' | 'unit';
      unitNo: string | null;
      flatNumber: string | null;
      buildingId: string;
      buildingNumber: string;
      roadNumber: string;
      blockNumber: string;
      buildingName: string | null;
      areaName: string | undefined;
      unitType: string;
      unitTypeAr: string | undefined;
      address: string;
    }> = [];

    for (const bldg of buildings) {
      // Add building as "Compound Entrance" entry
      properties.push({
        id: bldg.id,
        type: 'building',
        unitNo: `${bldg.buildingNumber}-ENT`,
        flatNumber: null,
        buildingId: bldg.id,
        buildingNumber: bldg.buildingNumber,
        roadNumber: bldg.roadNumber,
        blockNumber: bldg.blockNumber,
        buildingName: bldg.name,
        areaName: bldg.area?.name,
        unitType: 'Compound Entrance',
        unitTypeAr: undefined,
        address: `Building ${bldg.buildingNumber}, Road ${bldg.roadNumber}, Block ${bldg.blockNumber}`,
      });

      // Add each unit
      for (const u of bldg.units) {
        // If unit filter is specified, only include matching units
        if (unit && u.flatNumber && !u.flatNumber.toLowerCase().includes(unit.toLowerCase())) {
          continue;
        }

        properties.push({
          id: u.id,
          type: 'unit',
          unitNo: u.unitNo,
          flatNumber: u.flatNumber,
          buildingId: bldg.id,
          buildingNumber: bldg.buildingNumber,
          roadNumber: bldg.roadNumber,
          blockNumber: bldg.blockNumber,
          buildingName: bldg.name,
          areaName: bldg.area?.name,
          unitType: u.type?.name || 'Flat',
          unitTypeAr: u.type?.nameAr ?? undefined,
          address: `Building ${bldg.buildingNumber}, Road ${bldg.roadNumber}, Block ${bldg.blockNumber}`,
        });
      }
    }

    // If unit filter is specified and no units matched, filter out buildings too
    // (unless there are no units at all for that building)
    const filteredProperties = unit
      ? properties.filter(p => {
          if (p.type === 'building') {
            // Keep building entry only if it has matching units or no units at all
            const bldg = buildings.find(b => b.id === p.buildingId);
            const hasUnits = bldg && bldg.units.length > 0;
            const hasMatchingUnits = properties.some(
              prop => prop.buildingId === p.buildingId && prop.type === 'unit'
            );
            return !hasUnits || hasMatchingUnits;
          }
          return true;
        })
      : properties;

    // Apply pagination
    const total = filteredProperties.length;
    const paginatedProperties = filteredProperties.slice(skip, skip + limit);

    return {
      data: paginatedProperties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
