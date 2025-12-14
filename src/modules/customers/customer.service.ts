import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateCustomerInput, UpdateCustomerInput, ListCustomersQuery } from './customer.schema.js';

function generateCustomerNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CUS-${timestamp}${random}`;
}

// Convert name to title case with proper handling for special cases
function toTitleCase(name: string | undefined | null): string | undefined {
  if (!name) return undefined;

  return name
    .toLowerCase()
    .split(/(\s+|-|')/) // Split on spaces, hyphens, and apostrophes (keep delimiters)
    .map((part, index, arr) => {
      // Skip empty strings and delimiters
      if (!part || /^[\s\-']$/.test(part)) return part;

      // Handle "Mc" prefix (e.g., McDonald)
      if (part.length > 2 && part.startsWith('mc')) {
        return 'Mc' + part.charAt(2).toUpperCase() + part.slice(3);
      }

      // Handle "Mac" prefix (e.g., MacArthur) - but not "Mack"
      if (part.length > 3 && part.startsWith('mac') && !['mack', 'mace', 'mach'].includes(part)) {
        return 'Mac' + part.charAt(3).toUpperCase() + part.slice(4);
      }

      // Handle "O'" prefix (e.g., O'Brien)
      if (index > 0 && arr[index - 1] === "'" && arr[index - 2]?.toLowerCase() === 'o') {
        return part.charAt(0).toUpperCase() + part.slice(1);
      }

      // Standard title case
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

// Normalize customer name fields to title case
function normalizeCustomerNames<T extends { firstName?: string; lastName?: string; orgName?: string }>(input: T): T {
  const result = { ...input };

  if (result.firstName) {
    (result as any).firstName = toTitleCase(result.firstName);
  }
  if (result.lastName) {
    (result as any).lastName = toTitleCase(result.lastName);
  }
  if (result.orgName) {
    // For organization names, just capitalize first letter of each word
    (result as any).orgName = result.orgName
      .split(/\s+/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  return result;
}

export class CustomerService {
  async create(input: CreateCustomerInput) {
    // Normalize customer names to title case
    const normalizedInput = normalizeCustomerNames(input);

    // Check if email exists (only if email is provided)
    if (normalizedInput.email) {
      const existing = await prisma.customer.findUnique({
        where: { email: normalizedInput.email },
      });

      if (existing) {
        throw new ConflictError('Customer with this email already exists');
      }
    }

    const customer = await prisma.customer.create({
      data: {
        customerNo: generateCustomerNo(),
        ...normalizedInput,
      },
    });

    return customer;
  }

  async findById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            unit: {
              include: {
                building: {
                  include: {
                    area: true,
                  },
                },
                type: true,
              },
            },
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

  async linkUnit(customerId: string, unitId: string, ownershipType: 'OWNER' | 'TENANT' = 'TENANT', isPrimary: boolean = false) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Verify unit exists
    const unit = await prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) {
      throw new NotFoundError('Unit not found');
    }

    // Create or update the link
    const customerUnit = await prisma.customerUnit.upsert({
      where: {
        customerId_unitId: { customerId, unitId },
      },
      update: {
        ownershipType,
        isPrimary,
      },
      create: {
        customerId,
        unitId,
        ownershipType,
        isPrimary,
      },
      include: {
        unit: {
          include: {
            building: {
              include: {
                area: true,
              },
            },
            type: true,
          },
        },
      },
    });

    return customerUnit;
  }

  async unlinkUnit(customerId: string, unitId: string) {
    await prisma.customerUnit.delete({
      where: {
        customerId_unitId: { customerId, unitId },
      },
    });

    return { message: 'Unit unlinked successfully' };
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
        { phone: { contains: search, mode: 'insensitive' } },
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

    // Normalize customer names to title case
    const normalizedInput = normalizeCustomerNames(input);

    // Check email uniqueness if being updated
    if (normalizedInput.email && normalizedInput.email !== existing.email) {
      const emailExists = await prisma.customer.findUnique({
        where: { email: normalizedInput.email },
      });
      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: normalizedInput,
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
