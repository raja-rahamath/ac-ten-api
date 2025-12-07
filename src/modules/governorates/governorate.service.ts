import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateGovernorateInput, UpdateGovernorateInput, ListGovernoratesQuery } from './governorate.schema.js';

export class GovernorateService {
  async create(input: CreateGovernorateInput) {
    // Check if governorate with same name exists in the district
    const existing = await prisma.governorate.findFirst({
      where: {
        districtId: input.districtId,
        name: input.name,
      },
    });

    if (existing) {
      throw new ConflictError('Governorate with this name already exists in this district');
    }

    // Verify district exists
    const district = await prisma.district.findUnique({
      where: { id: input.districtId },
    });

    if (!district) {
      throw new NotFoundError('District not found');
    }

    const governorate = await prisma.governorate.create({
      data: input,
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
        _count: {
          select: {
            areas: true,
          },
        },
      },
    });

    return governorate;
  }

  async findById(id: string) {
    const governorate = await prisma.governorate.findUnique({
      where: { id },
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
        areas: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            areas: true,
          },
        },
      },
    });

    if (!governorate) {
      throw new NotFoundError('Governorate not found');
    }

    return governorate;
  }

  async findAll(query: ListGovernoratesQuery) {
    const { search, districtId, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (districtId) {
      where.districtId = districtId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [governorates, total] = await Promise.all([
      prisma.governorate.findMany({
        where,
        skip,
        take: limit,
        include: {
          district: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
          _count: {
            select: {
              areas: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.governorate.count({ where }),
    ]);

    return {
      data: governorates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateGovernorateInput) {
    const existing = await prisma.governorate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Governorate not found');
    }

    // Check name uniqueness in district if being updated
    if (input.name || input.districtId) {
      const targetDistrictId = input.districtId || existing.districtId;
      const targetName = input.name || existing.name;

      const nameExists = await prisma.governorate.findFirst({
        where: {
          districtId: targetDistrictId,
          name: targetName,
          NOT: { id },
        },
      });

      if (nameExists) {
        throw new ConflictError('Governorate with this name already exists in this district');
      }
    }

    // Verify district exists if being updated
    if (input.districtId && input.districtId !== existing.districtId) {
      const district = await prisma.district.findUnique({
        where: { id: input.districtId },
      });

      if (!district) {
        throw new NotFoundError('District not found');
      }
    }

    const governorate = await prisma.governorate.update({
      where: { id },
      data: input,
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
        _count: {
          select: {
            areas: true,
          },
        },
      },
    });

    return governorate;
  }

  async delete(id: string) {
    const existing = await prisma.governorate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Governorate not found');
    }

    // Soft delete
    await prisma.governorate.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Governorate deleted successfully' };
  }
}
