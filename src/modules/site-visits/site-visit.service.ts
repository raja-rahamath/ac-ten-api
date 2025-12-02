import { PrismaClient, Prisma, SiteVisitStatus } from '@prisma/client';
import {
  CreateSiteVisitInput,
  UpdateSiteVisitInput,
  CompleteSiteVisitInput,
  RescheduleSiteVisitInput,
  SiteVisitQueryInput,
} from './site-visit.schema.js';

const prisma = new PrismaClient();

export class SiteVisitService {
  // Generate unique visit number
  private async generateVisitNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SV-${year}-`;

    const lastVisit = await prisma.siteVisit.findFirst({
      where: { visitNo: { startsWith: prefix } },
      orderBy: { visitNo: 'desc' },
    });

    let nextNumber = 1;
    if (lastVisit) {
      const match = lastVisit.visitNo.match(new RegExp(`${prefix}(\\d+)`));
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Create a new site visit
  async create(data: CreateSiteVisitInput, userId: string) {
    // Validate service request exists
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: data.serviceRequestId },
    });

    if (!serviceRequest) {
      throw new Error('Service request not found');
    }

    // Validate assigned employee if provided
    if (data.assignedToId) {
      const employee = await prisma.employee.findUnique({
        where: { id: data.assignedToId },
      });
      if (!employee) {
        throw new Error('Assigned employee not found');
      }
    }

    const visitNo = await this.generateVisitNo();

    const siteVisit = await prisma.siteVisit.create({
      data: {
        visitNo,
        serviceRequestId: data.serviceRequestId,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        assignedToId: data.assignedToId,
        status: 'SCHEDULED',
        createdById: userId,
      },
      include: {
        serviceRequest: {
          include: {
            customer: true,
            zone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: data.serviceRequestId },
      data: { status: 'SITE_VISIT_SCHEDULED' },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: data.serviceRequestId,
        action: 'SITE_VISIT_SCHEDULED',
        description: `Site visit scheduled for ${new Date(data.scheduledDate).toLocaleDateString()}${data.scheduledTime ? ` at ${data.scheduledTime}` : ''}`,
        performedBy: userId,
      },
    });

    return siteVisit;
  }

  // Get all site visits
  async getAll(query: SiteVisitQueryInput) {
    const {
      page,
      limit,
      search,
      status,
      serviceRequestId,
      assignedToId,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.SiteVisitWhereInput = {
      ...(status && { status }),
      ...(serviceRequestId && { serviceRequestId }),
      ...(assignedToId && { assignedToId }),
      ...(search && {
        OR: [
          { visitNo: { contains: search, mode: 'insensitive' } },
          { serviceRequest: { requestNo: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(fromDate && { scheduledDate: { gte: new Date(fromDate) } }),
      ...(toDate && { scheduledDate: { lte: new Date(toDate) } }),
    };

    const [siteVisits, total] = await Promise.all([
      prisma.siteVisit.findMany({
        where,
        include: {
          serviceRequest: {
            include: {
              customer: true,
              zone: true,
              complaintType: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.siteVisit.count({ where }),
    ]);

    return {
      data: siteVisits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get site visit by ID
  async getById(id: string) {
    const siteVisit = await prisma.siteVisit.findUnique({
      where: { id },
      include: {
        serviceRequest: {
          include: {
            customer: true,
            zone: true,
            complaintType: true,
            property: true,
            unit: {
              include: { building: true },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        estimates: {
          select: {
            id: true,
            estimateNo: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
      },
    });

    return siteVisit;
  }

  // Update site visit
  async update(id: string, data: UpdateSiteVisitInput, userId: string) {
    const siteVisit = await prisma.siteVisit.findUnique({ where: { id } });

    if (!siteVisit) {
      throw new Error('Site visit not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(siteVisit.status)) {
      throw new Error('Cannot update completed or cancelled site visit');
    }

    const updateData: any = { ...data };

    // Handle date conversions
    if (data.scheduledDate) {
      updateData.scheduledDate = new Date(data.scheduledDate);
    }
    if (data.actualDate) {
      updateData.actualDate = new Date(data.actualDate);
    }

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        ...updateData,
        updatedById: userId,
      },
      include: {
        serviceRequest: {
          include: { customer: true },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updated;
  }

  // Start site visit
  async start(id: string, userId: string, notes?: string) {
    const siteVisit = await prisma.siteVisit.findUnique({ where: { id } });

    if (!siteVisit) {
      throw new Error('Site visit not found');
    }

    if (!['SCHEDULED', 'CONFIRMED'].includes(siteVisit.status)) {
      throw new Error('Site visit cannot be started');
    }

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        updatedById: userId,
      },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: siteVisit.serviceRequestId,
        action: 'SITE_VISIT_STARTED',
        description: notes ? `Site visit started: ${notes}` : 'Site visit started',
        performedBy: userId,
      },
    });

    return updated;
  }

  // Complete site visit
  async complete(id: string, data: CompleteSiteVisitInput, userId: string) {
    const siteVisit = await prisma.siteVisit.findUnique({ where: { id } });

    if (!siteVisit) {
      throw new Error('Site visit not found');
    }

    if (siteVisit.status !== 'IN_PROGRESS') {
      throw new Error('Only in-progress site visits can be completed');
    }

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        actualDate: new Date(),
        findings: data.findings,
        recommendations: data.recommendations,
        photos: data.photos || [],
        customerPresent: data.customerPresent,
        customerSignature: data.customerSignature,
        updatedById: userId,
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: siteVisit.serviceRequestId },
      data: { status: 'SITE_VISIT_COMPLETED' },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: siteVisit.serviceRequestId,
        action: 'SITE_VISIT_COMPLETED',
        description: `Site visit completed. Findings: ${data.findings.substring(0, 100)}...`,
        performedBy: userId,
      },
    });

    return updated;
  }

  // Reschedule site visit
  async reschedule(id: string, data: RescheduleSiteVisitInput, userId: string) {
    const siteVisit = await prisma.siteVisit.findUnique({ where: { id } });

    if (!siteVisit) {
      throw new Error('Site visit not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(siteVisit.status)) {
      throw new Error('Cannot reschedule completed or cancelled site visit');
    }

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        updatedById: userId,
      },
    });

    // Create a new site visit with new schedule
    const newVisitNo = await this.generateVisitNo();
    const newVisit = await prisma.siteVisit.create({
      data: {
        visitNo: newVisitNo,
        serviceRequestId: siteVisit.serviceRequestId,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        assignedToId: siteVisit.assignedToId,
        status: 'SCHEDULED',
        createdById: userId,
      },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: siteVisit.serviceRequestId,
        action: 'SITE_VISIT_RESCHEDULED',
        description: `Site visit rescheduled to ${new Date(data.scheduledDate).toLocaleDateString()}. Reason: ${data.reason}`,
        performedBy: userId,
      },
    });

    return newVisit;
  }

  // Mark as no access (customer not available)
  async markNoAccess(id: string, userId: string, reason?: string) {
    const siteVisit = await prisma.siteVisit.findUnique({ where: { id } });

    if (!siteVisit) {
      throw new Error('Site visit not found');
    }

    if (!['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(siteVisit.status)) {
      throw new Error('Site visit status cannot be changed to no access');
    }

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'NO_ACCESS',
        completedAt: new Date(),
        findings: reason || 'Customer not available / No access',
        updatedById: userId,
      },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: siteVisit.serviceRequestId,
        action: 'SITE_VISIT_NO_ACCESS',
        description: reason ? `No access: ${reason}` : 'Site visit - No access / Customer not available',
        performedBy: userId,
      },
    });

    return updated;
  }

  // Cancel site visit
  async cancel(id: string, userId: string, reason?: string) {
    const siteVisit = await prisma.siteVisit.findUnique({ where: { id } });

    if (!siteVisit) {
      throw new Error('Site visit not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(siteVisit.status)) {
      throw new Error('Site visit cannot be cancelled');
    }

    const updated = await prisma.siteVisit.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedById: userId,
      },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: siteVisit.serviceRequestId,
        action: 'SITE_VISIT_CANCELLED',
        description: reason ? `Site visit cancelled: ${reason}` : 'Site visit cancelled',
        performedBy: userId,
      },
    });

    return updated;
  }

  // Delete site visit (only scheduled ones)
  async delete(id: string) {
    const siteVisit = await prisma.siteVisit.findUnique({ where: { id } });

    if (!siteVisit) {
      throw new Error('Site visit not found');
    }

    if (siteVisit.status !== 'SCHEDULED') {
      throw new Error('Only scheduled site visits can be deleted');
    }

    await prisma.siteVisit.delete({ where: { id } });
  }

  // Get site visits for a service request
  async getByServiceRequest(serviceRequestId: string) {
    return prisma.siteVisit.findMany({
      where: { serviceRequestId },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledDate: 'desc' },
    });
  }

  // Get statistics
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalVisits,
      scheduledVisits,
      completedVisits,
      todayVisits,
      overdueVisits,
    ] = await Promise.all([
      prisma.siteVisit.count(),
      prisma.siteVisit.count({ where: { status: 'SCHEDULED' } }),
      prisma.siteVisit.count({ where: { status: 'COMPLETED' } }),
      prisma.siteVisit.count({
        where: {
          scheduledDate: { gte: today, lt: tomorrow },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        },
      }),
      prisma.siteVisit.count({
        where: {
          scheduledDate: { lt: today },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
    ]);

    return {
      totalVisits,
      scheduledVisits,
      completedVisits,
      todayVisits,
      overdueVisits,
    };
  }
}
