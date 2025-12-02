import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateCompanyInput, UpdateCompanyInput, ListCompaniesQuery } from './company.schema.js';

export class CompanyService {
  async create(input: CreateCompanyInput) {
    // Check if company name exists
    const existing = await prisma.company.findFirst({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Company with this name already exists');
    }

    // If setting as primary, unset any existing primary company
    if (input.isPrimary) {
      await prisma.company.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const company = await prisma.company.create({
      data: input,
      include: {
        divisions: true,
      },
    });

    return company;
  }

  async findById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        divisions: true,
        employees: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!company) {
      throw new NotFoundError('Company not found');
    }

    return company;
  }

  async findAll(query: ListCompaniesQuery) {
    const { search, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              divisions: true,
              employees: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateCompanyInput) {
    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Company not found');
    }

    // Check name uniqueness if being updated
    if (input.name && input.name !== existing.name) {
      const nameExists = await prisma.company.findFirst({
        where: { name: input.name },
      });
      if (nameExists) {
        throw new ConflictError('Company name already in use');
      }
    }

    // If setting as primary, unset any existing primary company
    if (input.isPrimary === true) {
      await prisma.company.updateMany({
        where: {
          isPrimary: true,
          NOT: { id },
        },
        data: { isPrimary: false },
      });
    }

    const company = await prisma.company.update({
      where: { id },
      data: input,
      include: {
        divisions: true,
      },
    });

    return company;
  }

  async delete(id: string) {
    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Company not found');
    }

    // Soft delete
    await prisma.company.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Company deleted successfully' };
  }

  /**
   * Get the primary company for display in header
   * Returns primary company if set, otherwise falls back to first active company by name
   */
  async getPrimary() {
    // First try to find the primary company
    let company = await prisma.company.findFirst({
      where: {
        isPrimary: true,
        isActive: true,
      },
    });

    // If no primary company, fallback to first active company by name ascending
    if (!company) {
      company = await prisma.company.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
    }

    return company;
  }

  /**
   * Set a company as primary (only one can be primary at a time)
   */
  async setPrimary(id: string) {
    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Company not found');
    }

    // Unset any existing primary company and set the new one
    await prisma.$transaction([
      prisma.company.updateMany({
        where: { isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.company.update({
        where: { id },
        data: { isPrimary: true },
      }),
    ]);

    return prisma.company.findUnique({
      where: { id },
      include: {
        divisions: true,
      },
    });
  }
}
