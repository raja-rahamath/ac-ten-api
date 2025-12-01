import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateDepartmentInput, UpdateDepartmentInput, ListDepartmentsQuery } from './department.schema.js';

export class DepartmentService {
  async create(input: CreateDepartmentInput) {
    // Check if department with same name exists in the division
    const existing = await prisma.department.findFirst({
      where: {
        divisionId: input.divisionId,
        name: input.name,
      },
    });

    if (existing) {
      throw new ConflictError('Department with this name already exists in this division');
    }

    // Check if code exists (if provided and code is unique)
    if (input.code) {
      const codeExists = await prisma.department.findFirst({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new ConflictError('Department with this code already exists');
      }
    }

    const department = await prisma.department.create({
      data: input,
      include: {
        division: {
          include: {
            company: true,
          },
        },
      },
    });

    return department;
  }

  async findById(id: string) {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        division: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                nameAr: true,
              },
            },
          },
        },
        sections: {
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
            sections: true,
            employees: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    return department;
  }

  async findAll(query: ListDepartmentsQuery) {
    const { search, divisionId, isActive } = query;
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

    if (divisionId) {
      where.divisionId = divisionId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        include: {
          division: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              company: {
                select: {
                  id: true,
                  name: true,
                  nameAr: true,
                },
              },
            },
          },
          _count: {
            select: {
              sections: true,
              employees: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      data: departments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateDepartmentInput) {
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Department not found');
    }

    // Check name uniqueness in division if being updated
    if (input.name && input.divisionId) {
      const nameExists = await prisma.department.findFirst({
        where: {
          divisionId: input.divisionId,
          name: input.name,
          NOT: { id },
        },
      });
      if (nameExists) {
        throw new ConflictError('Department with this name already exists in this division');
      }
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.department.findFirst({
        where: {
          code: input.code,
          NOT: { id },
        },
      });
      if (codeExists) {
        throw new ConflictError('Department with this code already exists');
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: input,
      include: {
        division: {
          include: {
            company: true,
          },
        },
      },
    });

    return department;
  }

  async delete(id: string) {
    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Department not found');
    }

    // Soft delete
    await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Department deleted successfully' };
  }
}
