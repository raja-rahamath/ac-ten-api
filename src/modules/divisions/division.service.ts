import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateDivisionInput, UpdateDivisionInput, ListDivisionsQuery } from './division.schema.js';

export class DivisionService {
  async create(input: CreateDivisionInput) {
    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    // Check if division name exists within the same company
    const existing = await prisma.division.findFirst({
      where: {
        name: input.name,
        companyId: input.companyId,
      },
    });

    if (existing) {
      throw new ConflictError('Division with this name already exists in this company');
    }

    const division = await prisma.division.create({
      data: input,
      include: {
        company: true,
        _count: {
          select: {
            departments: true,
          },
        },
      },
    });

    return division;
  }

  async findById(id: string) {
    const division = await prisma.division.findUnique({
      where: { id },
      include: {
        company: true,
        departments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            departments: true,
          },
        },
      },
    });

    if (!division) {
      throw new NotFoundError('Division not found');
    }

    return division;
  }

  async findAll(query: ListDivisionsQuery) {
    const { search, isActive, companyId } = query;
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

    if (companyId) {
      where.companyId = companyId;
    }

    const [divisions, total] = await Promise.all([
      prisma.division.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: true,
          _count: {
            select: {
              departments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.division.count({ where }),
    ]);

    return {
      data: divisions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateDivisionInput) {
    const existing = await prisma.division.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Division not found');
    }

    // If companyId is being updated, check if the new company exists
    if (input.companyId && input.companyId !== existing.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: input.companyId },
      });

      if (!company) {
        throw new NotFoundError('Company not found');
      }
    }

    // Check name uniqueness within the company if being updated
    if (input.name && input.name !== existing.name) {
      const companyId = input.companyId || existing.companyId;
      const nameExists = await prisma.division.findFirst({
        where: {
          name: input.name,
          companyId: companyId,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new ConflictError('Division name already in use in this company');
      }
    }

    const division = await prisma.division.update({
      where: { id },
      data: input,
      include: {
        company: true,
        _count: {
          select: {
            departments: true,
          },
        },
      },
    });

    return division;
  }

  async delete(id: string) {
    const existing = await prisma.division.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Division not found');
    }

    // Soft delete
    await prisma.division.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Division deleted successfully' };
  }
}
