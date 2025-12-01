import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateCustomerInput, UpdateCustomerInput, ListCustomersQuery } from './customer.schema.js';

function generateCustomerNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CUS-${timestamp}${random}`;
}

export class CustomerService {
  async create(input: CreateCustomerInput) {
    // Check if email exists (only if email is provided)
    if (input.email) {
      const existing = await prisma.customer.findUnique({
        where: { email: input.email },
      });

      if (existing) {
        throw new ConflictError('Customer with this email already exists');
      }
    }

    const customer = await prisma.customer.create({
      data: {
        customerNo: generateCustomerNo(),
        ...input,
      },
    });

    return customer;
  }

  async findById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        properties: {
          include: {
            property: true,
          },
        },
        serviceRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  async findAll(query: ListCustomersQuery) {
    const { search, customerType, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { orgName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { customerNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customerType) {
      where.customerType = customerType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateCustomerInput) {
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    // Check email uniqueness if being updated
    if (input.email && input.email !== existing.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email: input.email },
      });
      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: input,
    });

    return customer;
  }

  async delete(id: string) {
    const existing = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Customer not found');
    }

    // Soft delete by setting isActive to false
    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Customer deleted successfully' };
  }
}
