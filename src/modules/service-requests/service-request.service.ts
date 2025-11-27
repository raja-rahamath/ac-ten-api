import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  CreateServiceRequestInput,
  UpdateServiceRequestInput,
  AssignServiceRequestInput,
  ListServiceRequestsQuery,
} from './service-request.schema.js';

function generateRequestNo(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SR${year}${month}-${random}`;
}

export class ServiceRequestService {
  async create(input: CreateServiceRequestInput) {
    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Validate property exists
    const property = await prisma.property.findUnique({
      where: { id: input.propertyId },
    });
    if (!property) {
      throw new NotFoundError('Property not found');
    }

    // Validate zone exists
    const zone = await prisma.zone.findUnique({
      where: { id: input.zoneId },
    });
    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    // Validate complaint type exists
    const complaintType = await prisma.complaintType.findUnique({
      where: { id: input.complaintTypeId },
    });
    if (!complaintType) {
      throw new NotFoundError('Complaint type not found');
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        requestNo: generateRequestNo(),
        customerId: input.customerId,
        propertyId: input.propertyId,
        assetId: input.assetId,
        zoneId: input.zoneId,
        complaintTypeId: input.complaintTypeId,
        requestType: input.requestType as any,
        priority: input.priority as any,
        title: input.title,
        description: input.description,
        status: 'NEW',
      },
      include: {
        customer: true,
        property: true,
        zone: true,
        complaintType: true,
      },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: serviceRequest.id,
        action: 'REQUEST_CREATED',
        description: 'Service request created',
      },
    });

    return serviceRequest;
  }

  async findById(id: string) {
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        property: true,
        asset: true,
        zone: true,
        complaintType: true,
        assignedTo: true,
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
        quotations: true,
        schedules: true,
      },
    });

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    return serviceRequest;
  }

  async findAll(query: ListServiceRequestsQuery) {
    const { search, status, priority, customerId, assignedEmployeeId, zoneId } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { requestNo: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (customerId) where.customerId = customerId;
    if (assignedEmployeeId) where.assignedToId = assignedEmployeeId;
    if (zoneId) where.zoneId = zoneId;

    const [serviceRequests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              orgName: true,
              email: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
            },
          },
          complaintType: true,
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return {
      data: serviceRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateServiceRequestInput, userId?: string) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Service request not found');
    }

    const updateData: any = {};
    if (input.status) updateData.status = input.status;
    if (input.priority) updateData.priority = input.priority;
    if (input.title) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes;

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        property: true,
        complaintType: true,
        assignedTo: true,
      },
    });

    // Create timeline entry for status change
    if (input.status && input.status !== existing.status) {
      await prisma.requestTimeline.create({
        data: {
          serviceRequestId: id,
          action: 'STATUS_CHANGED',
          description: `Status changed from ${existing.status} to ${input.status}`,
          performedBy: userId,
        },
      });
    }

    return serviceRequest;
  }

  async assign(id: string, input: AssignServiceRequestInput, userId?: string) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Service request not found');
    }

    // Validate employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: input.employeeId },
    });

    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        assignedToId: input.employeeId,
        status: 'ASSIGNED',
      },
      include: {
        customer: true,
        assignedTo: true,
      },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: id,
        action: 'ASSIGNED',
        description: `Assigned to ${employee.firstName} ${employee.lastName}`,
        performedBy: userId,
      },
    });

    return serviceRequest;
  }

  async delete(id: string) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Service request not found');
    }

    if (!['NEW', 'CANCELLED'].includes(existing.status)) {
      throw new BadRequestError('Can only delete new or cancelled requests');
    }

    await prisma.serviceRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Service request cancelled successfully' };
  }

  async getStats() {
    const [total, byStatus, byPriority] = await Promise.all([
      prisma.serviceRequest.count(),
      prisma.serviceRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.serviceRequest.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
