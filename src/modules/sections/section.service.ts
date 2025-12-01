import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateSectionInput, UpdateSectionInput, ListSectionsQuery } from './section.schema.js';

export class SectionService {
  async create(input: CreateSectionInput) {
    // Check if section with same name exists in the department
    const existing = await prisma.section.findFirst({
      where: {
        departmentId: input.departmentId,
        name: input.name,
      },
    });

    if (existing) {
      throw new ConflictError('Section with this name already exists in this department');
    }

    // Check if code exists (if provided and code is unique)
    if (input.code) {
      const codeExists = await prisma.section.findFirst({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new ConflictError('Section with this code already exists');
      }
    }

    const section = await prisma.section.create({
      data: input,
      include: {
        department: {
          include: {
            division: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return section;
  }

  async findById(id: string) {
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            division: true,
          },
        },
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundError('Section not found');
    }

    return section;
  }

  async findAll(query: ListSectionsQuery) {
    const { search, departmentId, isActive } = query;
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

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [sections, total] = await Promise.all([
      prisma.section.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              division: {
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
              employees: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.section.count({ where }),
    ]);

    return {
      data: sections,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateSectionInput) {
    const existing = await prisma.section.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Section not found');
    }

    // Check name uniqueness in department if being updated
    if (input.name && input.departmentId) {
      const nameExists = await prisma.section.findFirst({
        where: {
          departmentId: input.departmentId,
          name: input.name,
          NOT: { id },
        },
      });
      if (nameExists) {
        throw new ConflictError('Section with this name already exists in this department');
      }
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.section.findFirst({
        where: {
          code: input.code,
          NOT: { id },
        },
      });
      if (codeExists) {
        throw new ConflictError('Section with this code already exists');
      }
    }

    const section = await prisma.section.update({
      where: { id },
      data: input,
      include: {
        department: {
          include: {
            division: true,
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return section;
  }

  async delete(id: string) {
    const existing = await prisma.section.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Section not found');
    }

    // Soft delete
    await prisma.section.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Section deleted successfully' };
  }
}
