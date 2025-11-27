import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateEmployeeInput, UpdateEmployeeInput, ListEmployeesQuery } from './employee.schema.js';

function generateEmployeeNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `EMP${timestamp}${random}`;
}

export class EmployeeService {
  async create(input: CreateEmployeeInput) {
    // Check if email exists
    const existing = await prisma.employee.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('Employee with this email already exists');
    }

    const employee = await prisma.employee.create({
      data: {
        employeeNo: generateEmployeeNo(),
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
      },
      include: {
        jobTitle: true,
        company: true,
        department: true,
      },
    });

    return employee;
  }

  async findById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        jobTitle: true,
        company: true,
        division: true,
        department: true,
        section: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        zoneAssignments: {
          include: {
            zone: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    return employee;
  }

  async findAll(query: ListEmployeesQuery) {
    const { search, companyId, departmentId, isActive } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          jobTitle: true,
          company: true,
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateEmployeeInput) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Employee not found');
    }

    // Check email uniqueness if being updated
    if (input.email && input.email !== existing.email) {
      const emailExists = await prisma.employee.findUnique({
        where: { email: input.email },
      });
      if (emailExists) {
        throw new ConflictError('Email already in use');
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
      },
      include: {
        jobTitle: true,
        company: true,
        department: true,
      },
    });

    return employee;
  }

  async delete(id: string) {
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Employee not found');
    }

    // Soft delete
    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Employee deleted successfully' };
  }
}
