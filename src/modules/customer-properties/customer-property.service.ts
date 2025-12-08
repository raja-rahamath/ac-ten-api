import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../utils/errors.js';
import {
  CreateCustomerPropertyInput,
  UpdateCustomerPropertyInput,
  ListCustomerPropertiesQuery,
  GetCustomerPropertiesByCustomerQuery,
  TransferPropertyInput,
} from './customer-property.schema.js';

export class CustomerPropertyService {
  async create(input: CreateCustomerPropertyInput, userId?: string) {
    const { customerId, propertyId, ownershipType, isPrimary, startDate, notes } = input;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Verify property exists
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Check if an ACTIVE relationship already exists
    const existingActive = await prisma.customerProperty.findFirst({
      where: {
        customerId,
        propertyId,
        status: 'ACTIVE',
      },
    });

    if (existingActive) {
      throw new ConflictError('An active relationship already exists between this customer and property');
    }

    // If isPrimary, unset other primary for this property
    if (isPrimary) {
      await prisma.customerProperty.updateMany({
        where: {
          propertyId,
          status: 'ACTIVE',
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    const customerProperty = await prisma.customerProperty.create({
      data: {
        customerId,
        propertyId,
        ownershipType,
        status: 'ACTIVE',
        isPrimary,
        startDate: startDate ? new Date(startDate) : new Date(),
        notes,
        createdById: userId,
      },
      include: {
        customer: true,
        property: {
          include: {
            type: true,
            areaRef: true,
          },
        },
      },
    });

    return customerProperty;
  }

  async findById(id: string) {
    const customerProperty = await prisma.customerProperty.findUnique({
      where: { id },
      include: {
        customer: true,
        property: {
          include: {
            type: true,
            areaRef: true,
          },
        },
        serviceRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customerProperty) {
      throw new NotFoundError('Customer-Property relationship not found');
    }

    return customerProperty;
  }

  async findAll(query: ListCustomerPropertiesQuery) {
    const { customerId, propertyId, status, ownershipType, search } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (status) {
      where.status = status;
    }

    if (ownershipType) {
      where.ownershipType = ownershipType;
    }

    if (search) {
      where.OR = [
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { property: { name: { contains: search, mode: 'insensitive' } } },
        { property: { address: { contains: search, mode: 'insensitive' } } },
        { property: { propertyNo: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [customerProperties, total] = await Promise.all([
      prisma.customerProperty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          property: {
            include: {
              type: true,
              areaRef: true,
            },
          },
        },
      }),
      prisma.customerProperty.count({ where }),
    ]);

    return {
      data: customerProperties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByCustomer(customerId: string, query: GetCustomerPropertiesByCustomerQuery) {
    const { status } = query;

    const where: any = { customerId };
    if (status) {
      where.status = status;
    } else {
      // Default to showing only active
      where.status = 'ACTIVE';
    }

    const customerProperties = await prisma.customerProperty.findMany({
      where,
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      include: {
        property: {
          include: {
            type: true,
            areaRef: true,
          },
        },
      },
    });

    return customerProperties;
  }

  async findByProperty(propertyId: string, query: GetCustomerPropertiesByCustomerQuery) {
    const { status } = query;

    const where: any = { propertyId };
    if (status) {
      where.status = status;
    } else {
      // Default to showing only active
      where.status = 'ACTIVE';
    }

    const customers = await prisma.customerProperty.findMany({
      where,
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      include: {
        customer: true,
      },
    });

    return customers;
  }

  async update(id: string, input: UpdateCustomerPropertyInput, userId?: string) {
    const existing = await prisma.customerProperty.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Customer-Property relationship not found');
    }

    // If setting as primary, unset others
    if (input.isPrimary) {
      await prisma.customerProperty.updateMany({
        where: {
          propertyId: existing.propertyId,
          status: 'ACTIVE',
          isPrimary: true,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    const customerProperty = await prisma.customerProperty.update({
      where: { id },
      data: {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        updatedById: userId,
      },
      include: {
        customer: true,
        property: {
          include: {
            type: true,
            areaRef: true,
          },
        },
      },
    });

    return customerProperty;
  }

  async deactivate(id: string, userId?: string) {
    const existing = await prisma.customerProperty.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Customer-Property relationship not found');
    }

    const customerProperty = await prisma.customerProperty.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        endDate: new Date(),
        updatedById: userId,
      },
      include: {
        customer: true,
        property: true,
      },
    });

    return customerProperty;
  }

  async transfer(id: string, input: TransferPropertyInput, userId?: string) {
    const { newCustomerId, ownershipType, transferDate, notes } = input;

    // Find the current relationship
    const current = await prisma.customerProperty.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!current) {
      throw new NotFoundError('Customer-Property relationship not found');
    }

    if (current.status !== 'ACTIVE') {
      throw new BadRequestError('Can only transfer active relationships');
    }

    // Verify new customer exists
    const newCustomer = await prisma.customer.findUnique({ where: { id: newCustomerId } });
    if (!newCustomer) {
      throw new NotFoundError('New customer not found');
    }

    // Check if new customer already has active relationship with this property
    const existingActive = await prisma.customerProperty.findFirst({
      where: {
        customerId: newCustomerId,
        propertyId: current.propertyId,
        status: 'ACTIVE',
      },
    });

    if (existingActive) {
      throw new ConflictError('New customer already has an active relationship with this property');
    }

    const effectiveDate = transferDate ? new Date(transferDate) : new Date();

    // Use transaction to ensure atomicity
    const [oldRelation, newRelation] = await prisma.$transaction([
      // Mark old relationship as transferred
      prisma.customerProperty.update({
        where: { id },
        data: {
          status: 'TRANSFERRED',
          endDate: effectiveDate,
          notes: notes ? `${current.notes || ''}\nTransferred to new customer: ${newCustomer.firstName} ${newCustomer.lastName}` : current.notes,
          updatedById: userId,
        },
      }),
      // Create new relationship
      prisma.customerProperty.create({
        data: {
          customerId: newCustomerId,
          propertyId: current.propertyId,
          ownershipType,
          status: 'ACTIVE',
          isPrimary: current.isPrimary,
          startDate: effectiveDate,
          notes,
          createdById: userId,
        },
        include: {
          customer: true,
          property: {
            include: {
              type: true,
              areaRef: true,
            },
          },
        },
      }),
    ]);

    return {
      previousRelation: oldRelation,
      newRelation,
    };
  }

  async delete(id: string) {
    const existing = await prisma.customerProperty.findUnique({
      where: { id },
      include: {
        serviceRequests: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Customer-Property relationship not found');
    }

    // Don't allow hard delete if there are service requests linked
    if (existing.serviceRequests.length > 0) {
      throw new BadRequestError('Cannot delete relationship with linked service requests. Use deactivate instead.');
    }

    await prisma.customerProperty.delete({
      where: { id },
    });

    return { message: 'Customer-Property relationship deleted successfully' };
  }

  // Get service request history for a customer-property relationship
  async getServiceHistory(id: string) {
    const customerProperty = await prisma.customerProperty.findUnique({
      where: { id },
      include: {
        serviceRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            complaintType: true,
            assignedTo: true,
          },
        },
      },
    });

    if (!customerProperty) {
      throw new NotFoundError('Customer-Property relationship not found');
    }

    return customerProperty.serviceRequests;
  }
}
