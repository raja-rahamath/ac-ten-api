import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateAreaInput, UpdateAreaInput, ListAreasQuery } from './area.schema.js';

export class AreaService {
  async create(input: CreateAreaInput) {
    // Check if area with same name exists in the governorate
    const existing = await prisma.area.findFirst({
      where: {
        governorateId: input.governorateId,
        name: input.name,
      },
    });

    if (existing) {
      throw new ConflictError('Area with this name already exists in this governorate');
    }

    // Verify governorate exists
    const governorate = await prisma.governorate.findUnique({
      where: { id: input.governorateId },
    });

    if (!governorate) {
      throw new NotFoundError('Governorate not found');
    }

    const area = await prisma.area.create({
      data: input,
      include: {
        governorate: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
        _count: {
          select: {
            zones: true,
          },
        },
      },
    });

    return area;
  }

  async findById(id: string) {
    const area = await prisma.area.findUnique({
      where: { id },
      include: {
        governorate: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
        zones: {
          select: {
            zone: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                code: true,
              },
            },
          },
        },
        _count: {
          select: {
            zones: true,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundError('Area not found');
    }

    return {
      ...area,
      zones: area.zones.map(z => z.zone),
    };
  }

  async findAll(query: ListAreasQuery) {
    const { search, governorateId, isActive } = query;
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

    if (governorateId) {
      where.governorateId = governorateId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [areas, total] = await Promise.all([
      prisma.area.findMany({
        where,
        skip,
        take: limit,
        include: {
          governorate: {
            select: {
              id: true,
              name: true,
              nameAr: true,
            },
          },
          zones: {
            select: {
              zoneId: true,
              zone: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          _count: {
            select: {
              zones: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.area.count({ where }),
    ]);

    // Get user IDs for audit fields
    const userIds = new Set<string>();
    areas.forEach(area => {
      if (area.createdById) userIds.add(area.createdById);
      if (area.updatedById) userIds.add(area.updatedById);
    });

    // Fetch user names
    const users = userIds.size > 0 ? await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, firstName: true, lastName: true },
    }) : [];

    const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

    // Enrich areas with user names and flatten zones
    const enrichedAreas = areas.map(area => ({
      ...area,
      zones: area.zones.map(z => z.zone),
      zoneIds: area.zones.map(z => z.zoneId),
      createdByName: area.createdById ? userMap.get(area.createdById) || null : null,
      updatedByName: area.updatedById ? userMap.get(area.updatedById) || null : null,
    }));

    return {
      data: enrichedAreas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateAreaInput) {
    const existing = await prisma.area.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Area not found');
    }

    // Check name uniqueness in governorate if being updated
    if (input.name || input.governorateId) {
      const targetGovernorateId = input.governorateId || existing.governorateId;
      const targetName = input.name || existing.name;

      const nameExists = await prisma.area.findFirst({
        where: {
          governorateId: targetGovernorateId,
          name: targetName,
          NOT: { id },
        },
      });

      if (nameExists) {
        throw new ConflictError('Area with this name already exists in this governorate');
      }
    }

    // Verify governorate exists if being updated
    if (input.governorateId && input.governorateId !== existing.governorateId) {
      const governorate = await prisma.governorate.findUnique({
        where: { id: input.governorateId },
      });

      if (!governorate) {
        throw new NotFoundError('Governorate not found');
      }
    }

    const area = await prisma.area.update({
      where: { id },
      data: input,
      include: {
        governorate: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
        _count: {
          select: {
            zones: true,
          },
        },
      },
    });

    return area;
  }

  async delete(id: string) {
    const existing = await prisma.area.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Area not found');
    }

    // Soft delete
    await prisma.area.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Area deleted successfully' };
  }
}
