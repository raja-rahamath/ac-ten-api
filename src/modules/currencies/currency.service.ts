import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateCurrencyInput, UpdateCurrencyInput, ListCurrenciesQuery } from './currency.schema.js';

export class CurrencyService {
  async create(input: CreateCurrencyInput) {
    // Check if code already exists
    const existingByCode = await prisma.currency.findUnique({
      where: { code: input.code },
    });

    if (existingByCode) {
      throw new ConflictError('Currency with this code already exists');
    }

    // Check if name already exists
    const existingByName = await prisma.currency.findUnique({
      where: { name: input.name },
    });

    if (existingByName) {
      throw new ConflictError('Currency with this name already exists');
    }

    // If this is set as default, unset other defaults
    if (input.isDefault) {
      await prisma.currency.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const currency = await prisma.currency.create({
      data: input,
    });

    return currency;
  }

  async findById(id: string) {
    const currency = await prisma.currency.findUnique({
      where: { id },
    });

    if (!currency) {
      throw new NotFoundError('Currency not found');
    }

    return currency;
  }

  async findByCode(code: string) {
    const currency = await prisma.currency.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!currency) {
      throw new NotFoundError('Currency not found');
    }

    return currency;
  }

  async getDefault() {
    const currency = await prisma.currency.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!currency) {
      // Fallback to BHD if no default set
      const bhd = await prisma.currency.findUnique({
        where: { code: 'BHD' },
      });
      return bhd;
    }

    return currency;
  }

  async findAll(query: ListCurrenciesQuery) {
    const { search, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { symbol: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [currencies, total] = await Promise.all([
      prisma.currency.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isDefault: 'desc' },
          { code: 'asc' },
        ],
      }),
      prisma.currency.count({ where }),
    ]);

    return {
      data: currencies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateCurrencyInput) {
    const existing = await prisma.currency.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Currency not found');
    }

    // Check for duplicate code
    if (input.code && input.code !== existing.code) {
      const duplicate = await prisma.currency.findUnique({
        where: { code: input.code },
      });
      if (duplicate) {
        throw new ConflictError('Currency with this code already exists');
      }
    }

    // Check for duplicate name
    if (input.name && input.name !== existing.name) {
      const duplicate = await prisma.currency.findUnique({
        where: { name: input.name },
      });
      if (duplicate) {
        throw new ConflictError('Currency with this name already exists');
      }
    }

    // If setting as default, unset other defaults
    if (input.isDefault === true) {
      await prisma.currency.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const currency = await prisma.currency.update({
      where: { id },
      data: input,
    });

    return currency;
  }

  async delete(id: string) {
    const existing = await prisma.currency.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Currency not found');
    }

    // Soft delete - just mark as inactive
    await prisma.currency.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Currency deleted successfully' };
  }

  async setDefault(id: string) {
    const existing = await prisma.currency.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Currency not found');
    }

    // Unset all other defaults
    await prisma.currency.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });

    // Set this as default
    const currency = await prisma.currency.update({
      where: { id },
      data: { isDefault: true },
    });

    return currency;
  }
}
