import { prisma } from '../../config/database.js';
import { NotFoundError, ConflictError } from '../../utils/errors.js';
import { CreateZoneInput, UpdateZoneInput, ListZonesQuery } from './zone.schema.js';

export class ZoneService {
  async create(input: CreateZoneInput) {
    // Check if zone with same name exists in the governorate
    const existing = await prisma.zone.findFirst({
      where: {
        governorateId: input.governorateId,
        name: input.name,
      },
    });

    if (existing) {
      throw new ConflictError('Zone with this name already exists in this governorate');
    }

    // Check if code exists (if provided and code is unique)
    if (input.code) {
      const codeExists = await prisma.zone.findUnique({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new ConflictError('Zone with this code already exists');
      }
    }

    const zone = await prisma.zone.create({
      data: input,
      include: {
        governorate: {
          include: {
            district: {
              include: {
                state: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        },
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return zone;
  }

  async findById(id: string) {
    const zone = await prisma.zone.findUnique({
      where: { id },
      include: {
        governorate: {
          include: {
            district: {
              include: {
                state: {
                  include: {
                    country: true,
                  },
                },
              },
            },
          },
        },
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        employees: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            blocks: true,
            serviceRequests: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    return zone;
  }

  async findAll(query: ListZonesQuery) {
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

    const [zones, total] = await Promise.all([
      prisma.zone.findMany({
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
          head: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              blocks: true,
              employees: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.zone.count({ where }),
    ]);

    return {
      data: zones,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateZoneInput) {
    const existing = await prisma.zone.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Zone not found');
    }

    // Check name uniqueness in governorate if being updated
    if (input.name && input.governorateId) {
      const nameExists = await prisma.zone.findFirst({
        where: {
          governorateId: input.governorateId,
          name: input.name,
          NOT: { id },
        },
      });
      if (nameExists) {
        throw new ConflictError('Zone with this name already exists in this governorate');
      }
    }

    // Check code uniqueness if being updated
    if (input.code && input.code !== existing.code) {
      const codeExists = await prisma.zone.findUnique({
        where: { code: input.code },
      });
      if (codeExists) {
        throw new ConflictError('Zone with this code already exists');
      }
    }

    const zone = await prisma.zone.update({
      where: { id },
      data: input,
      include: {
        governorate: true,
        head: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return zone;
  }

  async delete(id: string) {
    const existing = await prisma.zone.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Zone not found');
    }

    // Soft delete
    await prisma.zone.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Zone deleted successfully' };
  }

  // Zone Team Management Methods

  async getZoneTeam(zoneId: string) {
    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        head: {
          select: {
            id: true,
            employeeNo: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: { select: { name: true } },
          },
        },
        secondaryHead: {
          select: {
            id: true,
            employeeNo: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: { select: { name: true } },
          },
        },
        employees: {
          where: { isActive: true },
          include: {
            employee: {
              select: {
                id: true,
                employeeNo: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                jobTitle: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    // Group employees by role
    const team = {
      primaryHead: zone.head,
      secondaryHead: zone.secondaryHead,
      technicians: zone.employees
        .filter((e) => e.role === 'TECHNICIAN')
        .map((e) => ({ ...e.employee, isPrimary: e.isPrimary })),
      helpers: zone.employees
        .filter((e) => e.role === 'HELPER')
        .map((e) => ({ ...e.employee, isPrimary: e.isPrimary })),
    };

    return team;
  }

  async assignEmployeeToZone(
    zoneId: string,
    employeeId: string,
    role: 'PRIMARY_HEAD' | 'SECONDARY_HEAD' | 'TECHNICIAN' | 'HELPER',
    isPrimary: boolean = false
  ) {
    // Check zone exists
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    // Check employee exists
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Handle PRIMARY_HEAD and SECONDARY_HEAD separately (update Zone model)
    if (role === 'PRIMARY_HEAD') {
      await prisma.zone.update({
        where: { id: zoneId },
        data: { headId: employeeId },
      });
      return { message: 'Primary zone head assigned successfully' };
    }

    if (role === 'SECONDARY_HEAD') {
      await prisma.zone.update({
        where: { id: zoneId },
        data: { secondaryHeadId: employeeId },
      });
      return { message: 'Secondary zone head assigned successfully' };
    }

    // For TECHNICIAN and HELPER, use EmployeeZone junction table
    const existingAssignment = await prisma.employeeZone.findUnique({
      where: {
        employeeId_zoneId: { employeeId, zoneId },
      },
    });

    if (existingAssignment) {
      // Update existing assignment
      await prisma.employeeZone.update({
        where: {
          employeeId_zoneId: { employeeId, zoneId },
        },
        data: { role, isPrimary, isActive: true },
      });
    } else {
      // Create new assignment
      await prisma.employeeZone.create({
        data: {
          employeeId,
          zoneId,
          role,
          isPrimary,
          isActive: true,
        },
      });
    }

    return { message: `Employee assigned as ${role.toLowerCase().replace('_', ' ')} successfully` };
  }

  async removeEmployeeFromZone(zoneId: string, employeeId: string) {
    // Check if employee is zone head
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    if (zone.headId === employeeId) {
      await prisma.zone.update({
        where: { id: zoneId },
        data: { headId: null },
      });
      return { message: 'Primary zone head removed successfully' };
    }

    if (zone.secondaryHeadId === employeeId) {
      await prisma.zone.update({
        where: { id: zoneId },
        data: { secondaryHeadId: null },
      });
      return { message: 'Secondary zone head removed successfully' };
    }

    // Remove from EmployeeZone
    await prisma.employeeZone.updateMany({
      where: { employeeId, zoneId },
      data: { isActive: false },
    });

    return { message: 'Employee removed from zone successfully' };
  }

  async updateZoneHeads(zoneId: string, primaryHeadId?: string, secondaryHeadId?: string) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    const updateData: any = {};

    if (primaryHeadId !== undefined) {
      if (primaryHeadId) {
        const employee = await prisma.employee.findUnique({ where: { id: primaryHeadId } });
        if (!employee) {
          throw new NotFoundError('Primary head employee not found');
        }
      }
      updateData.headId = primaryHeadId || null;
    }

    if (secondaryHeadId !== undefined) {
      if (secondaryHeadId) {
        const employee = await prisma.employee.findUnique({ where: { id: secondaryHeadId } });
        if (!employee) {
          throw new NotFoundError('Secondary head employee not found');
        }
      }
      updateData.secondaryHeadId = secondaryHeadId || null;
    }

    const updatedZone = await prisma.zone.update({
      where: { id: zoneId },
      data: updateData,
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true },
        },
        secondaryHead: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return updatedZone;
  }

  // ==================== ZONE COVERAGE AUTOMATION ====================

  /**
   * Get the currently active zone head
   * Returns secondary head if primary is on leave
   */
  async getActiveZoneHead(zoneId: string, date?: Date) {
    const targetDate = date || new Date();

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        head: {
          select: {
            id: true,
            employeeNo: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        secondaryHead: {
          select: {
            id: true,
            employeeNo: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    // Check if primary head is on approved leave
    let primaryOnLeave = false;
    if (zone.headId) {
      const leaveRequest = await prisma.leaveRequest.findFirst({
        where: {
          employeeId: zone.headId,
          status: 'APPROVED',
          startDate: { lte: targetDate },
          endDate: { gte: targetDate },
        },
      });
      primaryOnLeave = !!leaveRequest;
    }

    const activeHead = primaryOnLeave && zone.secondaryHead ? zone.secondaryHead : zone.head;
    const isUsingSecondary = primaryOnLeave && !!zone.secondaryHead;

    return {
      zone: {
        id: zone.id,
        name: zone.name,
      },
      primaryHead: zone.head,
      secondaryHead: zone.secondaryHead,
      activeHead,
      isPrimaryOnLeave: primaryOnLeave,
      isUsingSecondary,
    };
  }

  /**
   * Get zone coverage status for a date range
   */
  async getZoneCoverageStatus(zoneId: string, startDate?: Date, endDate?: Date) {
    const start = startDate || new Date();
    const end = endDate || start;

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true },
        },
        secondaryHead: {
          select: { id: true, firstName: true, lastName: true },
        },
        employees: {
          where: { isActive: true },
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    // Get all employees in zone (heads + team members)
    const zoneEmployeeIds = [
      zone.headId,
      zone.secondaryHeadId,
      ...zone.employees.map(e => e.employeeId),
    ].filter(Boolean) as string[];

    // Get approved leave requests for zone employees in date range
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: zoneEmployeeIds },
        status: 'APPROVED',
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
        leaveType: {
          select: { name: true },
        },
        coveringEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    // Determine coverage status
    const primaryHeadLeave = leaveRequests.find(lr => lr.employeeId === zone.headId);
    const secondaryHeadLeave = leaveRequests.find(lr => lr.employeeId === zone.secondaryHeadId);

    let coverageStatus: 'FULL' | 'SECONDARY' | 'PARTIAL' | 'CRITICAL' = 'FULL';
    let coverageNote = 'Zone fully covered';

    if (primaryHeadLeave) {
      if (zone.secondaryHead && !secondaryHeadLeave) {
        coverageStatus = 'SECONDARY';
        coverageNote = `Primary head on leave. Secondary head (${zone.secondaryHead.firstName} ${zone.secondaryHead.lastName}) covering.`;
      } else if (zone.secondaryHead && secondaryHeadLeave) {
        coverageStatus = 'CRITICAL';
        coverageNote = 'Both primary and secondary heads on leave!';
      } else if (!zone.secondaryHead) {
        coverageStatus = 'CRITICAL';
        coverageNote = 'Primary head on leave and no secondary head assigned!';
      }
    }

    const employeesOnLeave = leaveRequests.filter(
      lr => lr.employeeId !== zone.headId && lr.employeeId !== zone.secondaryHeadId
    );
    if (employeesOnLeave.length > 0 && coverageStatus === 'FULL') {
      coverageStatus = 'PARTIAL';
      coverageNote = `${employeesOnLeave.length} team member(s) on leave`;
    }

    return {
      zone: {
        id: zone.id,
        name: zone.name,
      },
      period: { startDate: start, endDate: end },
      coverageStatus,
      coverageNote,
      primaryHead: zone.head,
      secondaryHead: zone.secondaryHead,
      isPrimaryOnLeave: !!primaryHeadLeave,
      isSecondaryOnLeave: !!secondaryHeadLeave,
      leaveRequests,
      teamCount: zone.employees.length,
      onLeaveCount: leaveRequests.length,
    };
  }

  /**
   * Get all zones coverage summary
   */
  async getAllZonesCoverageStatus(date?: Date) {
    const targetDate = date || new Date();

    const zones = await prisma.zone.findMany({
      where: { isActive: true },
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true },
        },
        secondaryHead: {
          select: { id: true, firstName: true, lastName: true },
        },
        _count: {
          select: { employees: true, serviceRequests: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const coverageSummary = await Promise.all(
      zones.map(async (zone) => {
        let primaryOnLeave = false;
        let secondaryOnLeave = false;

        if (zone.headId) {
          const primaryLeave = await prisma.leaveRequest.findFirst({
            where: {
              employeeId: zone.headId,
              status: 'APPROVED',
              startDate: { lte: targetDate },
              endDate: { gte: targetDate },
            },
          });
          primaryOnLeave = !!primaryLeave;
        }

        if (zone.secondaryHeadId) {
          const secondaryLeave = await prisma.leaveRequest.findFirst({
            where: {
              employeeId: zone.secondaryHeadId,
              status: 'APPROVED',
              startDate: { lte: targetDate },
              endDate: { gte: targetDate },
            },
          });
          secondaryOnLeave = !!secondaryLeave;
        }

        let status: 'FULL' | 'SECONDARY' | 'CRITICAL' = 'FULL';
        if (primaryOnLeave) {
          status = zone.secondaryHead && !secondaryOnLeave ? 'SECONDARY' : 'CRITICAL';
        }

        return {
          zone: {
            id: zone.id,
            name: zone.name,
          },
          primaryHead: zone.head,
          secondaryHead: zone.secondaryHead,
          isPrimaryOnLeave: primaryOnLeave,
          isSecondaryOnLeave: secondaryOnLeave,
          status,
          teamCount: zone._count.employees,
          activeRequests: zone._count.serviceRequests,
        };
      })
    );

    const criticalCount = coverageSummary.filter(z => z.status === 'CRITICAL').length;
    const secondaryCount = coverageSummary.filter(z => z.status === 'SECONDARY').length;

    return {
      date: targetDate,
      totalZones: zones.length,
      fullCoverage: zones.length - criticalCount - secondaryCount,
      secondaryCoverage: secondaryCount,
      criticalCoverage: criticalCount,
      zones: coverageSummary,
    };
  }
}
