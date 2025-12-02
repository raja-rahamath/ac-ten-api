import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateActionTemplateInput, UpdateActionTemplateInput, ListActionTemplatesQuery } from './action-template.schema.js';

export class ActionTemplateService {
  async create(input: CreateActionTemplateInput) {
    // Check if action template with same code exists
    const existing = await prisma.actionTemplate.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new ConflictError('Action template with this code already exists');
    }

    const actionTemplate = await prisma.actionTemplate.create({
      data: input,
    });

    return actionTemplate;
  }

  async findById(id: string) {
    const actionTemplate = await prisma.actionTemplate.findUnique({
      where: { id },
    });

    if (!actionTemplate) {
      throw new NotFoundError('Action template not found');
    }

    return actionTemplate;
  }

  async findAll(query: ListActionTemplatesQuery) {
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
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [actionTemplates, total] = await Promise.all([
      prisma.actionTemplate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
      }),
      prisma.actionTemplate.count({ where }),
    ]);

    return {
      data: actionTemplates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateActionTemplateInput) {
    const existing = await prisma.actionTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Action template not found');
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.actionTemplate.findUnique({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new ConflictError('Action template with this code already exists');
      }
    }

    const actionTemplate = await prisma.actionTemplate.update({
      where: { id },
      data: input,
    });

    return actionTemplate;
  }

  async delete(id: string) {
    const existing = await prisma.actionTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Action template not found');
    }

    // Soft delete
    await prisma.actionTemplate.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Action template deleted successfully' };
  }
}
