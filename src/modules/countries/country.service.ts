import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateCountryInput, UpdateCountryInput, ListCountriesQuery } from './country.schema.js';

export class CountryService {
  async create(input: CreateCountryInput) {
    // Check if country name exists
    const nameExists = await prisma.country.findUnique({
      where: { name: input.name },
    });

    if (nameExists) {
      throw new ConflictError('Country with this name already exists');
    }

    // Check if country code exists
    const codeExists = await prisma.country.findUnique({
      where: { code: input.code },
    });

    if (codeExists) {
      throw new ConflictError('Country with this code already exists');
    }

    const country = await prisma.country.create({
      data: input,
      include: {
        _count: {
          select: {
            states: true,
          },
        },
      },
    });

    return country;
  }

  async findById(id: string) {
    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        states: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            states: true,
          },
        },
      },
    });

    if (!country) {
      throw new NotFoundError('Country not found');
    }

    return country;
  }

  async findAll(query: ListCountriesQuery) {
    const { search, isActive } = query;
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

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [countries, total] = await Promise.all([
      prisma.country.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              states: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.country.count({ where }),
    ]);

    return {
      data: countries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateCountryInput) {
    const existing = await prisma.country.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Country not found');
    }

    // Check name uniqueness if being updated
    if (input.name && input.name !== existing.name) {
      const nameExists = await prisma.country.findUnique({
        where: { name: input.name },
      });
      if (nameExists) {
        throw new ConflictError('Country name already in use');
      }
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.country.findUnique({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new ConflictError('Country code already in use');
      }
    }

    const country = await prisma.country.update({
      where: { id },
      data: input,
      include: {
        _count: {
          select: {
            states: true,
          },
        },
      },
    });

    return country;
  }

  async delete(id: string) {
    const existing = await prisma.country.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Country not found');
    }

    // Soft delete
    await prisma.country.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Country deleted successfully' };
  }
}
