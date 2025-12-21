import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  CreateServiceRequestInput,
  UpdateServiceRequestInput,
  AssignServiceRequestInput,
  ListServiceRequestsQuery,
} from './service-request.schema.js';

async function generateRequestNo(): Promise<string> {
  // Get all service requests with the SR-##### format to find the highest number
  const requests = await prisma.$queryRaw<{ request_no: string }[]>`
    SELECT request_no
    FROM fixitbh_ac.service_requests
    WHERE request_no ~ '^SR-[0-9]+$'
    ORDER BY CAST(SUBSTRING(request_no FROM 4) AS INTEGER) DESC
    LIMIT 1
  `;

  let nextNumber = 1;
  if (requests.length > 0 && requests[0].request_no) {
    // Extract the number part from SR-00001 format
    const match = requests[0].request_no.match(/SR-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format as SR-00001 (5 digits, padded with zeros)
  return `SR-${nextNumber.toString().padStart(5, '0')}`;
}

export class ServiceRequestService {
  async create(input: CreateServiceRequestInput, userId?: string) {
    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Validate property exists - check Unit first, then legacy Property
    let zoneId = input.zoneId;
    let zoneHeadId: string | null = null;
    let unitId: string | null = null;
    let propertyId: string | null = null;
    let areaId: string | null = null;

    const unit = await prisma.unit.findUnique({
      where: { id: input.propertyId },
      include: {
        building: {
          select: { areaId: true },
        },
      },
    });

    if (unit) {
      // It's a Unit - store in unitId field
      unitId = unit.id;
      // Get areaId from unit's building
      areaId = unit.building?.areaId || null;
    } else {
      // Fall back to legacy Property model
      const property = await prisma.property.findUnique({
        where: { id: input.propertyId },
      });
      if (!property) {
        throw new NotFoundError('Property not found');
      }
      // It's a Property - store in propertyId field
      propertyId = property.id;
      // Get areaId from property
      areaId = property.areaId || null;
    }

    // Derive zoneId from area if not provided
    if (!zoneId && areaId) {
      // Look up the zone that contains this area
      const zoneArea = await prisma.zoneArea.findFirst({
        where: { areaId, isActive: true },
        include: {
          zone: {
            select: { id: true, headId: true },
          },
        },
      });
      if (zoneArea?.zone) {
        zoneId = zoneArea.zone.id;
        zoneHeadId = zoneArea.zone.headId;
      }
    } else if (zoneId && !zoneHeadId) {
      // If zoneId was provided directly, still get the zone head
      const zone = await prisma.zone.findUnique({
        where: { id: zoneId },
        select: { headId: true },
      });
      zoneHeadId = zone?.headId || null;
    }

    // Validate zone exists - zoneId is required
    if (!zoneId) {
      throw new BadRequestError('Zone is required. Please select a property with a valid zone.');
    }

    const zone = await prisma.zone.findUnique({
      where: { id: zoneId },
    });
    if (!zone) {
      throw new NotFoundError('Zone not found');
    }

    // Validate complaint type exists and get its department
    const complaintType = await prisma.complaintType.findUnique({
      where: { id: input.complaintTypeId },
    });
    if (!complaintType) {
      throw new NotFoundError('Complaint type not found');
    }

    // Find employee for auto-assignment based on zone AND department match
    // Priority:
    // 1. Find an employee in the zone who belongs to the same department as the complaint type
    // 2. Fall back to zone head if no department-matching employee found
    let assignedEmployeeId: string | null = null;
    let assignedEmployee: { employee: { id: string; firstName: string; lastName: string } } | null = null;
    let assignmentReason = 'zone head';

    // If complaint type has a department, try to find a matching employee in the zone
    if (complaintType.departmentId && zoneId) {
      const departmentEmployee = await prisma.employeeZone.findFirst({
        where: {
          zoneId: zoneId,
          isActive: true,
          employee: {
            isActive: true,
            departmentId: complaintType.departmentId,
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (departmentEmployee?.employee) {
        assignedEmployeeId = departmentEmployee.employee.id;
        assignedEmployee = { employee: departmentEmployee.employee };
        assignmentReason = `department match (${departmentEmployee.employee.department?.name || 'Unknown'})`;
      }
    }

    // Fall back to zone head if no department-matching employee found
    if (!assignedEmployeeId && zoneHeadId) {
      // Verify the employee is active
      const zoneHeadEmployee = await prisma.employee.findUnique({
        where: { id: zoneHeadId, isActive: true },
        select: { id: true, firstName: true, lastName: true },
      });
      if (zoneHeadEmployee) {
        assignedEmployeeId = zoneHeadEmployee.id;
        assignedEmployee = { employee: zoneHeadEmployee };
        assignmentReason = 'zone head';
      }
    }

    // Fall back to EmployeeZone table if no direct zone head found
    if (!assignedEmployeeId) {
      const fallbackZoneHead = await prisma.employeeZone.findFirst({
        where: {
          zoneId: zoneId,
          role: { in: ['PRIMARY_HEAD', 'SECONDARY_HEAD'] },
          isActive: true,
          employee: {
            isActive: true,
          },
        },
        orderBy: [
          // Prefer PRIMARY_HEAD over SECONDARY_HEAD
          { role: 'asc' },
        ],
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      if (fallbackZoneHead?.employee) {
        assignedEmployeeId = fallbackZoneHead.employee.id;
        assignedEmployee = { employee: fallbackZoneHead.employee };
        assignmentReason = 'zone head (fallback)';
      }
    }

    const requestNo = await generateRequestNo();

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        requestNo,
        customerId: input.customerId,
        propertyId: propertyId,
        unitId: unitId,
        assetId: input.assetId,
        zoneId: zoneId,
        complaintTypeId: input.complaintTypeId,
        requestType: input.requestType as any,
        priority: input.priority as any,
        title: input.title,
        description: input.description,
        status: assignedEmployeeId ? 'ASSIGNED' : 'NEW',
        assignedToId: assignedEmployeeId,
      },
      include: {
        customer: true,
        property: true,
        unit: true,
        zone: true,
        complaintType: true,
        assignedTo: true,
      },
    });

    // Create timeline entry for request creation
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId: serviceRequest.id,
        action: 'REQUEST_CREATED',
        description: 'Service request created',
        performedBy: userId,
      },
    });

    // Create timeline entry for auto-assignment if employee found
    if (assignedEmployee) {
      await prisma.requestTimeline.create({
        data: {
          serviceRequestId: serviceRequest.id,
          action: 'AUTO_ASSIGNED',
          description: `Auto-assigned to ${assignedEmployee.employee.firstName} ${assignedEmployee.employee.lastName} (${assignmentReason})`,
        },
      });
    }

    return serviceRequest;
  }

  async findById(id: string) {
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        customer: true,
        property: true,
        unit: {
          include: {
            building: true,
          },
        },
        asset: true,
        zone: true,
        complaintType: true,
        assignedTo: true,
        timeline: {
          orderBy: { createdAt: 'desc' },
          include: {
            performer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
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

  async findAll(query: ListServiceRequestsQuery, userContext?: { role: string; departmentId?: string }) {
    const { search, status, priority, customerId, assignedEmployeeId, zoneId, zoneIds, complaintTypeId, dateFrom, dateTo } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Department filter for managers - filter by complaint type's department
    if (userContext?.role === 'manager' && userContext.departmentId) {
      where.complaintType = {
        departmentId: userContext.departmentId,
      };
    }

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
    if (complaintTypeId) where.complaintTypeId = complaintTypeId;

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        // Add 1 day to include the end date fully
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lte = endDate;
      }
    }

    // Support both single zoneId and multiple zoneIds (comma-separated)
    if (zoneIds) {
      const zoneIdArray = zoneIds.split(',').map((id) => id.trim()).filter(Boolean);
      if (zoneIdArray.length > 0) {
        where.zoneId = { in: zoneIdArray };
      }
    } else if (zoneId) {
      where.zoneId = zoneId;
    }

    const [serviceRequests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          requestNo: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          source: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
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
          unit: {
            select: {
              id: true,
              unitNo: true,
              flatNumber: true,
              building: {
                select: {
                  id: true,
                  name: true,
                },
              },
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
          zone: {
            select: {
              id: true,
              name: true,
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
    if (input.status) {
      updateData.status = input.status;
      // Set startedAt when status changes to IN_PROGRESS
      if (input.status === 'IN_PROGRESS' && existing.status !== 'IN_PROGRESS' && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
      // Set completedAt when status changes to COMPLETED
      if (input.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (input.priority) updateData.priority = input.priority;
    if (input.title) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.internalNotes !== undefined) updateData.internalNotes = input.internalNotes;
    if (input.complaintTypeId) updateData.complaintTypeId = input.complaintTypeId;

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        property: true,
        unit: true,
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

    // Create timeline entry for service type change
    if (input.complaintTypeId && input.complaintTypeId !== existing.complaintTypeId) {
      const newTypeName = serviceRequest.complaintType?.name || 'Unknown';
      await prisma.requestTimeline.create({
        data: {
          serviceRequestId: id,
          action: 'TYPE_CHANGED',
          description: `Service type changed to ${newTypeName}`,
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

  async getStats(userContext?: { role: string; departmentId?: string }) {
    // Build department filter for managers
    const where: any = {};
    if (userContext?.role === 'manager' && userContext.departmentId) {
      where.complaintType = {
        departmentId: userContext.departmentId,
      };
    }

    const [total, byStatus, byPriority] = await Promise.all([
      prisma.serviceRequest.count({ where }),
      prisma.serviceRequest.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.serviceRequest.groupBy({
        by: ['priority'],
        where,
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

  // Add attachment to service request
  async addAttachment(
    serviceRequestId: string,
    attachment: {
      fileName: string;
      fileType: string;
      fileSize: number;
      filePath: string;
    },
    userId?: string
  ) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    });

    if (!existing) {
      throw new NotFoundError('Service request not found');
    }

    const newAttachment = await prisma.requestAttachment.create({
      data: {
        serviceRequestId,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        filePath: attachment.filePath,
        uploadedBy: userId,
      },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId,
        action: 'ATTACHMENT_ADDED',
        description: `File uploaded: ${attachment.fileName}`,
        performedBy: userId,
      },
    });

    return newAttachment;
  }

  // Get attachments for a service request
  async getAttachments(serviceRequestId: string) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    });

    if (!existing) {
      throw new NotFoundError('Service request not found');
    }

    return prisma.requestAttachment.findMany({
      where: { serviceRequestId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Delete attachment
  async deleteAttachment(serviceRequestId: string, attachmentId: string, userId?: string) {
    const attachment = await prisma.requestAttachment.findFirst({
      where: { id: attachmentId, serviceRequestId },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    await prisma.requestAttachment.delete({
      where: { id: attachmentId },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId,
        action: 'ATTACHMENT_REMOVED',
        description: `File removed: ${attachment.fileName}`,
        performedBy: userId,
      },
    });

    return { message: 'Attachment deleted successfully' };
  }

  // Link asset to service request
  async linkAsset(serviceRequestId: string, assetId: string, userId?: string) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
    });

    if (!existing) {
      throw new NotFoundError('Service request not found');
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
    });

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { assetId },
      include: {
        asset: {
          include: {
            type: true,
          },
        },
      },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId,
        action: 'ASSET_LINKED',
        description: `Asset linked: ${asset.name || asset.assetNo}`,
        performedBy: userId,
      },
    });

    return serviceRequest;
  }

  // Unlink asset from service request
  async unlinkAsset(serviceRequestId: string, userId?: string) {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: { asset: true },
    });

    if (!existing) {
      throw new NotFoundError('Service request not found');
    }

    const assetName = existing.asset?.name || existing.asset?.assetNo || 'Unknown';

    const serviceRequest = await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { assetId: null },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId,
        action: 'ASSET_UNLINKED',
        description: `Asset unlinked: ${assetName}`,
        performedBy: userId,
      },
    });

    return serviceRequest;
  }
}
