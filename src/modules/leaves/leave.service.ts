import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors.js';
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
  CreateLeaveRequestInput,
  UpdateLeaveRequestInput,
  ListLeaveRequestsQuery,
  AdjustLeaveBalanceInput,
} from './leave.schema.js';

export class LeaveService {
  // ==================== LEAVE TYPE METHODS ====================

  async createLeaveType(input: CreateLeaveTypeInput) {
    const existing = await prisma.leaveType.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictError('Leave type with this name already exists');
    }

    return prisma.leaveType.create({
      data: input,
    });
  }

  async findLeaveTypeById(id: string) {
    const leaveType = await prisma.leaveType.findUnique({
      where: { id },
    });

    if (!leaveType) {
      throw new NotFoundError('Leave type not found');
    }

    return leaveType;
  }

  async findAllLeaveTypes(isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return prisma.leaveType.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async updateLeaveType(id: string, input: UpdateLeaveTypeInput) {
    const existing = await prisma.leaveType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Leave type not found');
    }

    if (input.name && input.name !== existing.name) {
      const nameExists = await prisma.leaveType.findUnique({
        where: { name: input.name },
      });
      if (nameExists) {
        throw new ConflictError('Leave type with this name already exists');
      }
    }

    return prisma.leaveType.update({
      where: { id },
      data: input,
    });
  }

  async deleteLeaveType(id: string) {
    const existing = await prisma.leaveType.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Leave type not found');
    }

    // Soft delete
    await prisma.leaveType.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Leave type deleted successfully' };
  }

  // ==================== LEAVE REQUEST METHODS ====================

  async createLeaveRequest(input: CreateLeaveRequestInput) {
    const { employeeId, leaveTypeId, startDate, endDate, reason, coveringEmployeeId } = input;

    // Validate employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Validate leave type exists
    const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType) {
      throw new NotFoundError('Leave type not found');
    }

    // Validate covering employee if provided
    if (coveringEmployeeId) {
      const coveringEmployee = await prisma.employee.findUnique({ where: { id: coveringEmployeeId } });
      if (!coveringEmployee) {
        throw new NotFoundError('Covering employee not found');
      }
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      throw new ValidationError('End date must be after start date');
    }

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Check max consecutive days
    if (leaveType.maxConsecutiveDays && totalDays > leaveType.maxConsecutiveDays) {
      throw new ValidationError(`Maximum consecutive days for ${leaveType.name} is ${leaveType.maxConsecutiveDays}`);
    }

    // Check for overlapping leave requests
    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictError('Employee already has a leave request during this period');
    }

    // Check leave balance
    const year = start.getFullYear();
    let balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveTypeId, year },
    });

    // If no balance exists, initialize it
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId,
          year,
          totalDays: leaveType.defaultDays,
          usedDays: 0,
          pendingDays: 0,
          carryOverDays: 0,
        },
      });
    }

    const availableDays = balance.totalDays + balance.carryOverDays - balance.usedDays - balance.pendingDays;
    if (totalDays > availableDays) {
      throw new ValidationError(`Insufficient leave balance. Available: ${availableDays} days, Requested: ${totalDays} days`);
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        coveringEmployeeId,
        status: leaveType.requiresApproval ? 'PENDING' : 'APPROVED',
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNo: true },
        },
        leaveType: true,
        coveringEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Update pending days in balance
    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        pendingDays: { increment: totalDays },
        usedDays: leaveType.requiresApproval ? undefined : { increment: totalDays },
      },
    });

    return leaveRequest;
  }

  async findLeaveRequestById(id: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeNo: true, email: true },
        },
        leaveType: true,
        approver: {
          select: { id: true, firstName: true, lastName: true },
        },
        coveringEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!leaveRequest) {
      throw new NotFoundError('Leave request not found');
    }

    return leaveRequest;
  }

  async findAllLeaveRequests(query: ListLeaveRequestsQuery) {
    const { employeeId, leaveTypeId, status, startDate, endDate } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (employeeId) where.employeeId = employeeId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.AND = [];
      if (startDate) {
        where.AND.push({ startDate: { gte: new Date(startDate) } });
      }
      if (endDate) {
        where.AND.push({ endDate: { lte: new Date(endDate) } });
      }
    }

    const [requests, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, employeeNo: true },
          },
          leaveType: {
            select: { id: true, name: true, nameAr: true },
          },
          approver: {
            select: { id: true, firstName: true, lastName: true },
          },
          coveringEmployee: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateLeaveRequest(id: string, input: UpdateLeaveRequestInput) {
    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });

    if (!existing) {
      throw new NotFoundError('Leave request not found');
    }

    if (existing.status !== 'PENDING') {
      throw new ValidationError('Only pending leave requests can be updated');
    }

    const updateData: any = {};

    if (input.startDate || input.endDate) {
      const start = input.startDate ? new Date(input.startDate) : existing.startDate;
      const end = input.endDate ? new Date(input.endDate) : existing.endDate;

      if (end < start) {
        throw new ValidationError('End date must be after start date');
      }

      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (existing.leaveType.maxConsecutiveDays && totalDays > existing.leaveType.maxConsecutiveDays) {
        throw new ValidationError(`Maximum consecutive days for ${existing.leaveType.name} is ${existing.leaveType.maxConsecutiveDays}`);
      }

      // Update balance (remove old pending days, add new)
      const year = start.getFullYear();
      await prisma.leaveBalance.updateMany({
        where: { employeeId: existing.employeeId, leaveTypeId: existing.leaveTypeId, year },
        data: { pendingDays: { decrement: existing.totalDays } },
      });

      await prisma.leaveBalance.updateMany({
        where: { employeeId: existing.employeeId, leaveTypeId: existing.leaveTypeId, year },
        data: { pendingDays: { increment: totalDays } },
      });

      updateData.startDate = start;
      updateData.endDate = end;
      updateData.totalDays = totalDays;
    }

    if (input.reason !== undefined) updateData.reason = input.reason;
    if (input.coveringEmployeeId !== undefined) updateData.coveringEmployeeId = input.coveringEmployeeId;

    return prisma.leaveRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        leaveType: true,
        coveringEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async approveLeaveRequest(id: string, approverId: string) {
    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Leave request not found');
    }

    if (existing.status !== 'PENDING') {
      throw new ValidationError('Only pending leave requests can be approved');
    }

    // Update leave balance
    const year = existing.startDate.getFullYear();
    await prisma.leaveBalance.updateMany({
      where: { employeeId: existing.employeeId, leaveTypeId: existing.leaveTypeId, year },
      data: {
        pendingDays: { decrement: existing.totalDays },
        usedDays: { increment: existing.totalDays },
      },
    });

    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverId,
        approvedAt: new Date(),
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        leaveType: true,
        approver: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async rejectLeaveRequest(id: string, approverId: string, rejectionReason: string) {
    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Leave request not found');
    }

    if (existing.status !== 'PENDING') {
      throw new ValidationError('Only pending leave requests can be rejected');
    }

    // Remove from pending balance
    const year = existing.startDate.getFullYear();
    await prisma.leaveBalance.updateMany({
      where: { employeeId: existing.employeeId, leaveTypeId: existing.leaveTypeId, year },
      data: { pendingDays: { decrement: existing.totalDays } },
    });

    return prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverId,
        rejectionReason,
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        leaveType: true,
        approver: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
  }

  async cancelLeaveRequest(id: string) {
    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Leave request not found');
    }

    if (existing.status === 'CANCELLED') {
      throw new ValidationError('Leave request is already cancelled');
    }

    // Update balance based on previous status
    const year = existing.startDate.getFullYear();
    if (existing.status === 'PENDING') {
      await prisma.leaveBalance.updateMany({
        where: { employeeId: existing.employeeId, leaveTypeId: existing.leaveTypeId, year },
        data: { pendingDays: { decrement: existing.totalDays } },
      });
    } else if (existing.status === 'APPROVED') {
      await prisma.leaveBalance.updateMany({
        where: { employeeId: existing.employeeId, leaveTypeId: existing.leaveTypeId, year },
        data: { usedDays: { decrement: existing.totalDays } },
      });
    }

    return prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        leaveType: true,
      },
    });
  }

  // ==================== LEAVE BALANCE METHODS ====================

  async getLeaveBalance(employeeId: string, year?: number) {
    const targetYear = year || new Date().getFullYear();

    // Check employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year: targetYear },
      include: {
        leaveType: {
          select: { id: true, name: true, nameAr: true, isPaid: true },
        },
      },
      orderBy: { leaveType: { name: 'asc' } },
    });

    // Calculate available days for each balance
    return balances.map(b => ({
      ...b,
      availableDays: b.totalDays + b.carryOverDays - b.usedDays - b.pendingDays,
    }));
  }

  async initializeLeaveBalance(employeeId: string, year: number) {
    // Check employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Get all active leave types
    const leaveTypes = await prisma.leaveType.findMany({
      where: { isActive: true },
    });

    // Check for existing balances
    const existingBalances = await prisma.leaveBalance.findMany({
      where: { employeeId, year },
    });

    const existingTypeIds = new Set(existingBalances.map(b => b.leaveTypeId));

    // Create balances for leave types that don't have one
    const newBalances = [];
    for (const lt of leaveTypes) {
      if (!existingTypeIds.has(lt.id)) {
        newBalances.push({
          employeeId,
          leaveTypeId: lt.id,
          year,
          totalDays: lt.defaultDays,
          usedDays: 0,
          pendingDays: 0,
          carryOverDays: 0,
        });
      }
    }

    if (newBalances.length > 0) {
      await prisma.leaveBalance.createMany({ data: newBalances });
    }

    // Return all balances
    return this.getLeaveBalance(employeeId, year);
  }

  async adjustLeaveBalance(employeeId: string, leaveTypeId: string, input: AdjustLeaveBalanceInput) {
    // Check employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Check leave type exists
    const leaveType = await prisma.leaveType.findUnique({ where: { id: leaveTypeId } });
    if (!leaveType) {
      throw new NotFoundError('Leave type not found');
    }

    // Find or create balance
    let balance = await prisma.leaveBalance.findFirst({
      where: { employeeId, leaveTypeId, year: input.year },
    });

    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId,
          leaveTypeId,
          year: input.year,
          totalDays: leaveType.defaultDays,
          usedDays: 0,
          pendingDays: 0,
          carryOverDays: 0,
        },
      });
    }

    // Apply adjustment
    const newTotal = balance.totalDays + input.adjustment;
    if (newTotal < 0) {
      throw new ValidationError('Adjustment would result in negative balance');
    }

    return prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { totalDays: newTotal },
      include: {
        leaveType: {
          select: { id: true, name: true, nameAr: true },
        },
      },
    });
  }

  // Get employees on leave for a specific date range (for zone coverage)
  async getEmployeesOnLeave(startDate: Date, endDate: Date, zoneId?: string) {
    const where: any = {
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    };

    if (zoneId) {
      where.employee = {
        OR: [
          { zoneHead: { some: { id: zoneId } } },
          { zoneSecondaryHead: { some: { id: zoneId } } },
          { zoneAssignments: { some: { zoneId, isActive: true } } },
        ],
      };
    }

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNo: true,
            zoneHead: { select: { id: true, name: true } },
            zoneSecondaryHead: { select: { id: true, name: true } },
            zoneAssignments: {
              where: { isActive: true },
              select: { zone: { select: { id: true, name: true } }, role: true },
            },
          },
        },
        leaveType: {
          select: { id: true, name: true },
        },
        coveringEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }
}
