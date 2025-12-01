import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateComplaintTypeInput, UpdateComplaintTypeInput, ListComplaintTypesQuery } from './complaint-type.schema.js';

export class ComplaintTypeService {
  async create(input: CreateComplaintTypeInput) {
    // Check if complaint type with same name exists
    const existing = await prisma.complaintType.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Complaint type with this name already exists');
    }

    const complaintType = await prisma.complaintType.create({
      data: input,
      include: {
        _count: {
          select: {
            serviceRequests: true,
            slaConfigs: true,
          },
        },
      },
    });

    return complaintType;
  }

  async findById(id: string) {
    const complaintType = await prisma.complaintType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            serviceRequests: true,
            slaConfigs: true,
          },
        },
      },
    });

    if (!complaintType) {
      throw new NotFoundError('Complaint type not found');
    }

    return complaintType;
  }

  async findAll(query: ListComplaintTypesQuery) {
    const { search, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [complaintTypes, total] = await Promise.all([
      prisma.complaintType.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              serviceRequests: true,
              slaConfigs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complaintType.count({ where }),
    ]);

    return {
      data: complaintTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateComplaintTypeInput) {
    const existing = await prisma.complaintType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Complaint type not found');
    }

    // Check name uniqueness if being updated
    if (input.name && input.name !== existing.name) {
      const nameExists = await prisma.complaintType.findUnique({
        where: { name: input.name },
      });
      if (nameExists) {
        throw new ConflictError('Complaint type with this name already exists');
      }
    }

    const complaintType = await prisma.complaintType.update({
      where: { id },
      data: input,
      include: {
        _count: {
          select: {
            serviceRequests: true,
            slaConfigs: true,
          },
        },
      },
    });

    return complaintType;
  }

  async delete(id: string) {
    const existing = await prisma.complaintType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Complaint type not found');
    }

    // Soft delete
    await prisma.complaintType.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Complaint type deleted successfully' };
  }
}
