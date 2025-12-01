import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateStateInput, UpdateStateInput, ListStatesQuery } from './state.schema.js';

export class StateService {
  async create(input: CreateStateInput) {
    // Check if state with same name exists in the country
    const existing = await prisma.state.findFirst({
      where: {
        countryId: input.countryId,
        name: input.name,
      },
    });

    if (existing) {
      throw new ConflictError('State with this name already exists in this country');
    }

    // Check if code exists (if provided)
    if (input.code) {
      const codeExists = await prisma.state.findFirst({
        where: {
          countryId: input.countryId,
          code: input.code
        },
      });
      if (codeExists) {
        throw new ConflictError('State with this code already exists in this country');
      }
    }

    const state = await prisma.state.create({
      data: input,
      include: {
        country: true,
        _count: {
          select: {
            districts: true,
          },
        },
      },
    });

    return state;
  }

  async findById(id: string) {
    const state = await prisma.state.findUnique({
      where: { id },
      include: {
        country: true,
        districts: {
          select: {
            id: true,
            name: true,
            nameAr: true,
            code: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            districts: true,
          },
        },
      },
    });

    if (!state) {
      throw new NotFoundError('State not found');
    }

    return state;
  }

  async findAll(query: ListStatesQuery) {
    const { search, countryId, isActive } = query;
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

    if (countryId) {
      where.countryId = countryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [states, total] = await Promise.all([
      prisma.state.findMany({
        where,
        skip,
        take: limit,
        include: {
          country: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
          _count: {
            select: {
              districts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.state.count({ where }),
    ]);

    return {
      data: states,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateStateInput) {
    const existing = await prisma.state.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('State not found');
    }

    // Check name uniqueness in country if being updated
    if (input.name && input.countryId) {
      const nameExists = await prisma.state.findFirst({
        where: {
          countryId: input.countryId,
          name: input.name,
          NOT: { id },
        },
      });
      if (nameExists) {
        throw new ConflictError('State with this name already exists in this country');
      }
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const countryId = input.countryId || existing.countryId;
      const codeExists = await prisma.state.findFirst({
        where: {
          countryId,
          code: input.code,
          NOT: { id },
        },
      });
      if (codeExists) {
        throw new ConflictError('State with this code already exists in this country');
      }
    }

    const state = await prisma.state.update({
      where: { id },
      data: input,
      include: {
        country: true,
        _count: {
          select: {
            districts: true,
          },
        },
      },
    });

    return state;
  }

  async delete(id: string) {
    const existing = await prisma.state.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('State not found');
    }

    // Soft delete
    await prisma.state.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'State deleted successfully' };
  }
}
