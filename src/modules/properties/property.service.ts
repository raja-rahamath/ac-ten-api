import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreatePropertyInput, UpdatePropertyInput, ListPropertiesQuery } from './property.schema.js';

function generatePropertyNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PROP-${timestamp}${random}`;
}

export class PropertyService {
  async create(input: CreatePropertyInput) {
    const { customerId, ownershipType, ...propertyData } = input;

    // Create property
    const property = await prisma.property.create({
      data: {
        propertyNo: generatePropertyNo(),
        name: propertyData.name,
        nameAr: propertyData.nameAr,
        typeId: propertyData.typeId,
        zoneId: propertyData.zoneId,
        address: propertyData.address,
        addressAr: propertyData.addressAr,
        building: propertyData.building,
        floor: propertyData.floor,
        unit: propertyData.unit,
        area: propertyData.area,
        landmark: propertyData.landmark,
        latitude: propertyData.latitude,
        longitude: propertyData.longitude,
      },
      include: {
        type: true,
      },
    });

    // Link to customer if provided
    if (customerId) {
      await prisma.customerProperty.create({
        data: {
          customerId,
          propertyId: property.id,
          ownershipType: (ownershipType as 'OWNER' | 'TENANT') || 'OWNER',
          isPrimary: true,
        },
      });
    }

    return property;
  }

  async findById(id: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        type: true,
        customers: {
          include: {
            customer: true,
          },
        },
        serviceRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!property) {
      throw new NotFoundError('Property not found');
    }

    return property;
  }

  async findAll(query: ListPropertiesQuery) {
    const { search, customerId, typeId, zoneId, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { propertyNo: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { building: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (typeId) {
      where.typeId = typeId;
    }

    if (zoneId) {
      where.zoneId = zoneId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Filter by customer if provided
    if (customerId) {
      where.customers = {
        some: {
          customerId,
        },
      };
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          type: true,
          customers: customerId ? {
            where: { customerId },
            include: { customer: true },
          } : false,
        },
      }),
      prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdatePropertyInput) {
    const existing = await prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Property not found');
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        name: input.name,
        nameAr: input.nameAr,
        typeId: input.typeId,
        zoneId: input.zoneId,
        address: input.address,
        addressAr: input.addressAr,
        building: input.building,
        floor: input.floor,
        unit: input.unit,
        area: input.area,
        landmark: input.landmark,
        latitude: input.latitude,
        longitude: input.longitude,
        isActive: input.isActive,
      },
      include: {
        type: true,
      },
    });

    return property;
  }

  async delete(id: string) {
    const existing = await prisma.property.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Property not found');
    }

    // Soft delete by setting isActive to false
    await prisma.property.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Property deleted successfully' };
  }

  async linkToCustomer(propertyId: string, customerId: string, ownershipType: string = 'OWNER') {
    // Check if link already exists
    const existing = await prisma.customerProperty.findUnique({
      where: {
        customerId_propertyId: {
          customerId,
          propertyId,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Property already linked to customer');
    }

    await prisma.customerProperty.create({
      data: {
        customerId,
        propertyId,
        ownershipType: ownershipType as any,
        isPrimary: false,
      },
    });

    return { message: 'Property linked successfully' };
  }
}
