import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateComplaintTypeInput, UpdateComplaintTypeInput, ListComplaintTypesQuery } from './complaint-type.schema.js';

// Helper function to enrich complaint type with user names
async function enrichWithUserNames(complaintType: any) {
  const userIds = [complaintType.createdById, complaintType.updatedById].filter(Boolean);

  if (userIds.length === 0) {
    return {
      ...complaintType,
      createdByName: null,
      updatedByName: null,
    };
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true },
  });

  const userMap = new Map(users.map(u => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || null]));

  return {
    ...complaintType,
    createdByName: complaintType.createdById ? userMap.get(complaintType.createdById) || null : null,
    updatedByName: complaintType.updatedById ? userMap.get(complaintType.updatedById) || null : null,
  };
}

// Helper function to enrich multiple complaint types with user names (batch lookup)
async function enrichManyWithUserNames(complaintTypes: any[]) {
  const userIds = new Set<string>();
  complaintTypes.forEach(ct => {
    if (ct.createdById) userIds.add(ct.createdById);
    if (ct.updatedById) userIds.add(ct.updatedById);
  });

  if (userIds.size === 0) {
    return complaintTypes.map(ct => ({
      ...ct,
      createdByName: null,
      updatedByName: null,
    }));
  }

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(userIds) } },
    select: { id: true, firstName: true, lastName: true },
  });

  const userMap = new Map(users.map(u => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || null]));

  return complaintTypes.map(ct => ({
    ...ct,
    createdByName: ct.createdById ? userMap.get(ct.createdById) || null : null,
    updatedByName: ct.updatedById ? userMap.get(ct.updatedById) || null : null,
  }));
}

export class ComplaintTypeService {
  async create(input: CreateComplaintTypeInput) {
    // Check if complaint type with same name or code exists
    const existingName = await prisma.complaintType.findUnique({
      where: { name: input.name },
    });

    if (existingName) {
      throw new ConflictError('Service type with this name already exists');
    }

    if (input.code) {
      const existingCode = await prisma.complaintType.findUnique({
        where: { code: input.code },
      });
      if (existingCode) {
        throw new ConflictError('Service type with this code already exists');
      }
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

    return enrichWithUserNames(complaintType);
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

    const enrichedData = await enrichManyWithUserNames(complaintTypes);

    return {
      data: enrichedData,
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
        throw new ConflictError('Service type with this name already exists');
      }
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.complaintType.findUnique({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new ConflictError('Service type with this code already exists');
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
