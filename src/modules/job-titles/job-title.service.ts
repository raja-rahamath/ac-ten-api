import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateJobTitleInput, UpdateJobTitleInput, ListJobTitlesQuery } from './job-title.schema.js';

export class JobTitleService {
  async create(input: CreateJobTitleInput) {
    // Check if job title name exists
    const existing = await prisma.jobTitle.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Job title with this name already exists');
    }

    const jobTitle = await prisma.jobTitle.create({
      data: input,
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return jobTitle;
  }

  async findById(id: string) {
    const jobTitle = await prisma.jobTitle.findUnique({
      where: { id },
      include: {
        employees: {
          take: 10,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!jobTitle) {
      throw new NotFoundError('Job title not found');
    }

    return jobTitle;
  }

  async findAll(query: ListJobTitlesQuery) {
    const { search, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [jobTitles, total] = await Promise.all([
      prisma.jobTitle.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              employees: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.jobTitle.count({ where }),
    ]);

    return {
      data: jobTitles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateJobTitleInput) {
    const existing = await prisma.jobTitle.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Job title not found');
    }

    // Check name uniqueness if being updated
    if (input.name && input.name !== existing.name) {
      const nameExists = await prisma.jobTitle.findUnique({
        where: { name: input.name },
      });
      if (nameExists) {
        throw new ConflictError('Job title name already in use');
      }
    }

    const jobTitle = await prisma.jobTitle.update({
      where: { id },
      data: input,
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    return jobTitle;
  }

  async delete(id: string) {
    const existing = await prisma.jobTitle.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Job title not found');
    }

    // Soft delete
    await prisma.jobTitle.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Job title deleted successfully' };
  }
}
