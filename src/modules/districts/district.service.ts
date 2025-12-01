import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateDistrictInput, UpdateDistrictInput, ListDistrictsQuery } from './district.schema.js';

export class DistrictService {
  async create(input: CreateDistrictInput) {
    // Check if state exists
    const stateExists = await prisma.state.findUnique({
      where: { id: input.stateId },
    });

    if (!stateExists) {
      throw new NotFoundError('State not found');
    }

    // Check if district name exists within the same state
    const nameExists = await prisma.district.findFirst({
      where: {
        name: input.name,
        stateId: input.stateId,
      },
    });

    if (nameExists) {
      throw new ConflictError('District with this name already exists in this state');
    }

    // Check if district code exists (if provided)
    if (input.code) {
      const codeExists = await prisma.district.findFirst({
        where: { code: input.code },
      });

      if (codeExists) {
        throw new ConflictError('District with this code already exists');
      }
    }

    const district = await prisma.district.create({
      data: input,
      include: {
        state: true,
        _count: {
          select: {
            governorates: true,
          },
        },
      },
    });

    return district;
  }

  async findById(id: string) {
    const district = await prisma.district.findUnique({
      where: { id },
      include: {
        state: true,
        governorates: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            governorates: true,
          },
        },
      },
    });

    if (!district) {
      throw new NotFoundError('District not found');
    }

    return district;
  }

  async findAll(query: ListDistrictsQuery) {
    const { search, stateId, isActive } = query;
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

    if (stateId) {
      where.stateId = stateId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [districts, total] = await Promise.all([
      prisma.district.findMany({
        where,
        skip,
        take: limit,
        include: {
          state: true,
          _count: {
            select: {
              governorates: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.district.count({ where }),
    ]);

    return {
      data: districts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateDistrictInput) {
    const existing = await prisma.district.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('District not found');
    }

    // Check if state exists (if being updated)
    if (input.stateId) {
      const stateExists = await prisma.state.findUnique({
        where: { id: input.stateId },
      });

      if (!stateExists) {
        throw new NotFoundError('State not found');
      }
    }

    // Check name uniqueness within the same state if being updated
    if (input.name && input.name !== existing.name) {
      const stateId = input.stateId || existing.stateId;
      const nameExists = await prisma.district.findFirst({
        where: {
          name: input.name,
          stateId: stateId,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new ConflictError('District name already in use in this state');
      }
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.district.findFirst({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new ConflictError('District code already in use');
      }
    }

    const district = await prisma.district.update({
      where: { id },
      data: input,
      include: {
        state: true,
        _count: {
          select: {
            governorates: true,
          },
        },
      },
    });

    return district;
  }

  async delete(id: string) {
    const existing = await prisma.district.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('District not found');
    }

    // Soft delete
    await prisma.district.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'District deleted successfully' };
  }
}
