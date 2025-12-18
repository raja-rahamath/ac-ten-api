import { PrismaClient, Prisma, WorkOrderStatus, Priority } from '@prisma/client';
import {
  CreateWorkOrderInput,
  UpdateWorkOrderInput,
  CreateFromQuoteInput,
  CreateFromEstimateInput,
  AssignTeamInput,
  ScheduleWorkOrderInput,
  StartEnRouteInput,
  ArriveAtSiteInput,
  ClockInInput,
  ClockOutInput,
  CompleteChecklistInput,
  AddItemInput,
  AddPhotoInput,
  CompleteWorkOrderInput,
  PutOnHoldInput,
  CancelWorkOrderInput,
  RescheduleWorkOrderInput,
  WorkOrderQueryInput,
} from './work-order.schema.js';

const prisma = new PrismaClient();

export class WorkOrderService {
  // Generate unique work order number
  private async generateWorkOrderNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `WO-${year}-`;

    const lastWorkOrder = await prisma.workOrder.findFirst({
      where: { workOrderNo: { startsWith: prefix } },
      orderBy: { workOrderNo: 'desc' },
    });

    let nextNumber = 1;
    if (lastWorkOrder) {
      const match = lastWorkOrder.workOrderNo.match(new RegExp(`${prefix}(\\d+)`));
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Calculate total costs
  private calculateTotals(laborCost: number, materialCost: number, additionalCost: number) {
    return laborCost + materialCost + additionalCost;
  }

  // Create a new work order
  async create(data: CreateWorkOrderInput, userId: string) {
    // Validate service request exists
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: data.serviceRequestId },
    });

    if (!serviceRequest) {
      throw new Error('Service request not found');
    }

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const workOrderNo = await this.generateWorkOrderNo();

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNo,
        serviceRequestId: data.serviceRequestId,
        customerId: data.customerId,
        quoteId: data.quoteId,
        estimateId: data.estimateId,
        title: data.title,
        description: data.description,
        scope: data.scope,
        specialInstructions: data.specialInstructions,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        estimatedDuration: data.estimatedDuration,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
        createdById: userId,
        // Create team members if provided
        ...(data.team && data.team.length > 0 && {
          team: {
            create: data.team.map((member) => ({
              employeeId: member.employeeId,
              role: member.role,
            })),
          },
        }),
        // Create items if provided
        ...(data.items && data.items.length > 0 && {
          items: {
            create: data.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitCost: item.unitCost,
              totalCost: item.quantity * item.unitCost,
            })),
          },
        }),
        // Create checklists if provided
        ...(data.checklists && data.checklists.length > 0 && {
          checklists: {
            create: data.checklists.map((checklistItem, index) => ({
              sortOrder: checklistItem.sortOrder ?? index,
              item: checklistItem.item,
              category: checklistItem.category,
              isRequired: checklistItem.isRequired,
              isCompleted: false,
            })),
          },
        }),
      },
      include: this.getWorkOrderIncludes(),
    });

    // Create activity log
    await this.logActivity(workOrder.id, 'CREATED', `Work order ${workOrderNo} created`, userId);

    // Update service request status to SCHEDULED
    await prisma.serviceRequest.update({
      where: { id: data.serviceRequestId },
      data: { status: 'SCHEDULED' },
    });

    return workOrder;
  }

  // Create work order from approved quote
  async createFromQuote(data: CreateFromQuoteInput, userId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id: data.quoteId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error('Only accepted quotes can be converted to work orders');
    }

    if (!quote.serviceRequestId) {
      throw new Error('Quote is not linked to a service request');
    }

    const workOrderNo = await this.generateWorkOrderNo();

    // Convert quote items to work order items
    const workOrderItems = quote.items.map((item) => ({
      name: item.name,
      description: item.description || undefined,
      quantity: item.quantity.toNumber(),
      unit: item.unit,
      unitCost: item.unitPrice.toNumber(),
      totalCost: (item.quantity.toNumber() * item.unitPrice.toNumber()),
      isFromEstimate: false,
      isAdditional: false,
    }));

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNo,
        serviceRequestId: quote.serviceRequestId,
        customerId: quote.customerId,
        quoteId: quote.id,
        title: quote.title,
        description: quote.description,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        estimatedDuration: data.estimatedDuration,
        specialInstructions: data.specialInstructions,
        status: 'PENDING',
        priority: 'MEDIUM',
        createdById: userId,
        items: {
          create: workOrderItems,
        },
        ...(data.team && data.team.length > 0 && {
          team: {
            create: data.team.map((member) => ({
              employeeId: member.employeeId,
              role: member.role,
            })),
          },
        }),
      },
      include: this.getWorkOrderIncludes(),
    });

    // Log activity
    await this.logActivity(workOrder.id, 'CREATED', `Work order created from quote ${quote.quoteNo}`, userId);

    return workOrder;
  }

  // Create work order from approved estimate
  async createFromEstimate(data: CreateFromEstimateInput, userId: string) {
    const estimate = await prisma.estimate.findUnique({
      where: { id: data.estimateId },
      include: {
        items: true,
        laborItems: true,
        serviceRequest: true,
      },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (estimate.status !== 'APPROVED') {
      throw new Error('Only approved estimates can be converted to work orders');
    }

    const workOrderNo = await this.generateWorkOrderNo();

    // Convert estimate items to work order items
    const workOrderItems = estimate.items.map((item) => ({
      inventoryItemId: item.inventoryItemId,
      name: item.name,
      description: item.description || undefined,
      quantity: item.quantity.toNumber(),
      unit: item.unit,
      unitCost: item.unitCost.toNumber(),
      totalCost: item.totalCost.toNumber(),
      isFromEstimate: true,
      isAdditional: false,
    }));

    const workOrder = await prisma.workOrder.create({
      data: {
        workOrderNo,
        serviceRequestId: estimate.serviceRequestId,
        customerId: estimate.serviceRequest.customerId,
        estimateId: estimate.id,
        title: estimate.title,
        description: estimate.description,
        scope: estimate.scope,
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        estimatedDuration: data.estimatedDuration || estimate.estimatedDuration,
        specialInstructions: data.specialInstructions,
        status: 'PENDING',
        priority: 'MEDIUM',
        createdById: userId,
        items: {
          create: workOrderItems,
        },
        ...(data.team && data.team.length > 0 && {
          team: {
            create: data.team.map((member) => ({
              employeeId: member.employeeId,
              role: member.role,
            })),
          },
        }),
      },
      include: this.getWorkOrderIncludes(),
    });

    // Log activity
    await this.logActivity(workOrder.id, 'CREATED', `Work order created from estimate ${estimate.estimateNo}`, userId);

    return workOrder;
  }

  // Get all work orders
  async getAll(query: WorkOrderQueryInput) {
    const {
      page,
      limit,
      search,
      status,
      priority,
      serviceRequestId,
      customerId,
      assignedToId,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.WorkOrderWhereInput = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(serviceRequestId && { serviceRequestId }),
      ...(customerId && { customerId }),
      ...(assignedToId && {
        team: {
          some: { employeeId: assignedToId },
        },
      }),
      ...(search && {
        OR: [
          { workOrderNo: { contains: search, mode: 'insensitive' as const } },
          { title: { contains: search, mode: 'insensitive' as const } },
          { serviceRequest: { is: { requestNo: { contains: search, mode: 'insensitive' as const } } } },
          { customer: { is: { firstName: { contains: search, mode: 'insensitive' as const } } } },
          { customer: { is: { lastName: { contains: search, mode: 'insensitive' as const } } } },
          { customer: { is: { orgName: { contains: search, mode: 'insensitive' as const } } } },
        ],
      }),
      ...(fromDate && { scheduledDate: { gte: new Date(fromDate) } }),
      ...(toDate && { scheduledDate: { lte: new Date(toDate) } }),
    };

    const [workOrders, total] = await Promise.all([
      prisma.workOrder.findMany({
        where,
        include: {
          serviceRequest: {
            include: {
              complaintType: true,
              zone: true,
            },
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              orgName: true,
              phone: true,
              email: true,
            },
          },
          team: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                },
              },
            },
          },
          quote: {
            select: {
              id: true,
              quoteNo: true,
              total: true,
            },
          },
          estimate: {
            select: {
              id: true,
              estimateNo: true,
              total: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.workOrder.count({ where }),
    ]);

    return {
      data: workOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get work order by ID
  async getById(id: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: this.getWorkOrderIncludes(),
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    return workOrder;
  }

  // Update work order
  async update(id: string, data: UpdateWorkOrderInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (!['PENDING', 'SCHEDULED'].includes(workOrder.status)) {
      throw new Error('Can only update pending or scheduled work orders');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.scope !== undefined && { scope: data.scope }),
        ...(data.specialInstructions !== undefined && { specialInstructions: data.specialInstructions }),
        ...(data.scheduledDate && { scheduledDate: new Date(data.scheduledDate) }),
        ...(data.scheduledTime !== undefined && { scheduledTime: data.scheduledTime }),
        ...(data.estimatedDuration !== undefined && { estimatedDuration: data.estimatedDuration }),
        ...(data.priority && { priority: data.priority }),
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'UPDATED', 'Work order details updated', userId);

    return updated;
  }

  // Assign team
  async assignTeam(id: string, data: AssignTeamInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Delete existing team members
    await prisma.workOrderTeam.deleteMany({
      where: { workOrderId: id },
    });

    // Create new team members
    await prisma.workOrderTeam.createMany({
      data: data.team.map((member) => ({
        workOrderId: id,
        employeeId: member.employeeId,
        role: member.role,
      })),
    });

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: workOrder.status === 'PENDING' ? 'SCHEDULED' : workOrder.status,
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    const teamNames = data.team.map((m) => m.employeeId).join(', ');
    await this.logActivity(id, 'TEAM_ASSIGNED', `Team assigned: ${teamNames}`, userId);

    return updated;
  }

  // Schedule work order
  async schedule(id: string, data: ScheduleWorkOrderInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        estimatedDuration: data.estimatedDuration,
        status: 'SCHEDULED',
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'SCHEDULED', `Scheduled for ${new Date(data.scheduledDate).toLocaleDateString()}`, userId);

    return updated;
  }

  // Confirm work order
  async confirm(id: string, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'SCHEDULED') {
      throw new Error('Work order must be scheduled before confirming');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'CONFIRMED', 'Work order confirmed', userId);

    return updated;
  }

  // Start en route
  async startEnRoute(id: string, data: StartEnRouteInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (!['SCHEDULED', 'CONFIRMED'].includes(workOrder.status)) {
      throw new Error('Work order must be scheduled or confirmed to start en route');
    }

    // Update or create labor entry for this employee
    const existingLabor = await prisma.workOrderLabor.findFirst({
      where: {
        workOrderId: id,
        employeeId: data.employeeId,
        clockOutAt: null,
      },
    });

    if (existingLabor) {
      await prisma.workOrderLabor.update({
        where: { id: existingLabor.id },
        data: {
          travelStartAt: new Date(),
        },
      });
    } else {
      await prisma.workOrderLabor.create({
        data: {
          workOrderId: id,
          employeeId: data.employeeId,
          clockInAt: new Date(),
          travelStartAt: new Date(),
          hourlyRate: 25, // Default hourly rate
          notes: data.notes,
        },
      });
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'EN_ROUTE',
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'EN_ROUTE', 'Technician en route to site', userId);

    return updated;
  }

  // Arrive at site
  async arriveAtSite(id: string, data: ArriveAtSiteInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    // Update labor entry
    const labor = await prisma.workOrderLabor.findFirst({
      where: {
        workOrderId: id,
        employeeId: data.employeeId,
        clockOutAt: null,
      },
    });

    if (labor) {
      await prisma.workOrderLabor.update({
        where: { id: labor.id },
        data: {
          arrivedAt: new Date(),
        },
      });
    }

    await this.logActivity(id, 'ARRIVED', 'Technician arrived at site', userId);

    return this.getById(id);
  }

  // Start work
  async startWork(id: string, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (!['SCHEDULED', 'CONFIRMED', 'EN_ROUTE'].includes(workOrder.status)) {
      throw new Error('Work order must be scheduled, confirmed, or en route to start work');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'STARTED', 'Work started', userId);

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: workOrder.serviceRequestId },
      data: { status: 'IN_PROGRESS' },
    });

    return updated;
  }

  // Clock in employee
  async clockIn(id: string, data: ClockInInput, userId: string) {
    // Check if employee already clocked in
    const existingLabor = await prisma.workOrderLabor.findFirst({
      where: {
        workOrderId: id,
        employeeId: data.employeeId,
        clockOutAt: null,
      },
    });

    if (existingLabor) {
      throw new Error('Employee is already clocked in');
    }

    await prisma.workOrderLabor.create({
      data: {
        workOrderId: id,
        employeeId: data.employeeId,
        clockInAt: new Date(),
        hourlyRate: 25, // Default hourly rate
        notes: data.notes,
      },
    });

    await this.logActivity(id, 'CLOCK_IN', `Employee ${data.employeeId} clocked in`, userId);

    return this.getById(id);
  }

  // Clock out employee
  async clockOut(id: string, data: ClockOutInput, userId: string) {
    const labor = await prisma.workOrderLabor.findFirst({
      where: {
        workOrderId: id,
        employeeId: data.employeeId,
        clockOutAt: null,
      },
    });

    if (!labor) {
      throw new Error('Employee is not clocked in');
    }

    const clockOutTime = new Date();
    const totalMinutes = Math.round((clockOutTime.getTime() - labor.clockInAt.getTime()) / 60000) - data.breakMinutes;

    await prisma.workOrderLabor.update({
      where: { id: labor.id },
      data: {
        clockOutAt: clockOutTime,
        breakMinutes: data.breakMinutes,
        totalMinutes: totalMinutes > 0 ? totalMinutes : 0,
        notes: data.notes,
      },
    });

    // Update total labor cost
    await this.updateTotalCosts(id);

    await this.logActivity(id, 'CLOCK_OUT', `Employee ${data.employeeId} clocked out`, userId);

    return this.getById(id);
  }

  // Complete checklist item
  async completeChecklist(id: string, data: CompleteChecklistInput, userId: string) {
    const checklist = await prisma.workOrderChecklist.findFirst({
      where: {
        id: data.checklistId,
        workOrderId: id,
      },
    });

    if (!checklist) {
      throw new Error('Checklist item not found');
    }

    await prisma.workOrderChecklist.update({
      where: { id: data.checklistId },
      data: {
        isCompleted: data.isCompleted,
        completedAt: data.isCompleted ? new Date() : null,
        completedById: data.isCompleted ? userId : null,
        notes: data.notes,
        photoUrl: data.photoUrl,
      },
    });

    await this.logActivity(id, 'CHECKLIST_UPDATED', `Checklist item ${checklist.item} ${data.isCompleted ? 'completed' : 'uncompleted'}`, userId);

    return this.getById(id);
  }

  // Add item/material
  async addItem(id: string, data: AddItemInput, userId: string) {
    await prisma.workOrderItem.create({
      data: {
        workOrderId: id,
        inventoryItemId: data.inventoryItemId,
        name: data.name,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        unitCost: data.unitCost,
        totalCost: data.quantity * data.unitCost,
        isAdditional: data.isAdditional,
      },
    });

    // Update total costs
    await this.updateTotalCosts(id);

    await this.logActivity(id, 'ITEM_ADDED', `Item added: ${data.name} x ${data.quantity}`, userId);

    return this.getById(id);
  }

  // Add photo
  async addPhoto(id: string, data: AddPhotoInput, userId: string) {
    await prisma.workOrderPhoto.create({
      data: {
        workOrderId: id,
        url: data.url,
        photoType: data.photoType,
        caption: data.caption,
        takenById: userId,
      },
    });

    await this.logActivity(id, 'PHOTO_ADDED', `${data.photoType} photo added`, userId);

    return this.getById(id);
  }

  // Complete work order
  async complete(id: string, data: CompleteWorkOrderInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        checklists: true,
      },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      throw new Error('Work order must be in progress to complete');
    }

    // Check required checklists are completed
    const requiredIncomplete = workOrder.checklists.filter(
      (c) => c.isRequired && !c.isCompleted
    );
    if (requiredIncomplete.length > 0) {
      throw new Error(`Required checklist items not completed: ${requiredIncomplete.map((c) => c.item).join(', ')}`);
    }

    const completedAt = new Date();
    const actualDuration = workOrder.startedAt
      ? Math.round((completedAt.getTime() - workOrder.startedAt.getTime()) / 60000)
      : null;

    // Update additional cost if provided
    if (data.additionalCost > 0) {
      await prisma.workOrder.update({
        where: { id },
        data: { additionalCost: data.additionalCost },
      });
    }

    // Update total costs first
    await this.updateTotalCosts(id);

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt,
        actualDuration,
        workPerformed: data.workPerformed,
        technicianNotes: data.technicianNotes,
        technicianSignature: data.technicianSignature,
        customerSignature: data.customerSignature,
        customerFeedback: data.customerFeedback,
        signedAt: data.customerSignature ? new Date() : null,
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'COMPLETED', 'Work order completed', userId);

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: workOrder.serviceRequestId },
      data: { status: 'COMPLETED' },
    });

    return updated;
  }

  // Put on hold
  async putOnHold(id: string, data: PutOnHoldInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'IN_PROGRESS') {
      throw new Error('Only in-progress work orders can be put on hold');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'ON_HOLD',
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'ON_HOLD', `Put on hold: ${data.reason}`, userId);

    return updated;
  }

  // Resume from hold
  async resumeFromHold(id: string, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'ON_HOLD') {
      throw new Error('Work order is not on hold');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'RESUMED', 'Work resumed', userId);

    return updated;
  }

  // Mark as requires follow-up
  async requiresFollowUp(id: string, reason: string, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'REQUIRES_FOLLOWUP',
        technicianNotes: reason,
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'REQUIRES_FOLLOWUP', `Requires follow-up: ${reason}`, userId);

    return updated;
  }

  // Cancel work order
  async cancel(id: string, data: CancelWorkOrderInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (['COMPLETED', 'CANCELLED'].includes(workOrder.status)) {
      throw new Error('Cannot cancel completed or already cancelled work order');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        technicianNotes: data.reason,
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'CANCELLED', `Cancelled: ${data.reason}`, userId);

    return updated;
  }

  // Reschedule work order
  async reschedule(id: string, data: RescheduleWorkOrderInput, userId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(workOrder.status)) {
      throw new Error('Cannot reschedule work order in current status');
    }

    const updated = await prisma.workOrder.update({
      where: { id },
      data: {
        scheduledDate: new Date(data.scheduledDate),
        scheduledTime: data.scheduledTime,
        status: 'SCHEDULED',
        updatedById: userId,
      },
      include: this.getWorkOrderIncludes(),
    });

    await this.logActivity(id, 'RESCHEDULED', `Rescheduled: ${data.reason}`, userId);

    return updated;
  }

  // Get work orders by service request
  async getByServiceRequest(serviceRequestId: string) {
    return prisma.workOrder.findMany({
      where: { serviceRequestId },
      include: this.getWorkOrderIncludes(),
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get work orders by customer
  async getByCustomer(customerId: string) {
    return prisma.workOrder.findMany({
      where: { customerId },
      include: {
        serviceRequest: {
          include: {
            complaintType: true,
          },
        },
        team: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get statistics
  async getStats() {
    const [
      total,
      pending,
      scheduled,
      inProgress,
      completed,
      cancelled,
      todayScheduled,
      thisWeekScheduled,
    ] = await Promise.all([
      prisma.workOrder.count(),
      prisma.workOrder.count({ where: { status: 'PENDING' } }),
      prisma.workOrder.count({ where: { status: 'SCHEDULED' } }),
      prisma.workOrder.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.workOrder.count({ where: { status: 'COMPLETED' } }),
      prisma.workOrder.count({ where: { status: 'CANCELLED' } }),
      prisma.workOrder.count({
        where: {
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.workOrder.count({
        where: {
          scheduledDate: {
            gte: new Date(),
            lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      pending,
      scheduled,
      inProgress,
      completed,
      cancelled,
      todayScheduled,
      thisWeekScheduled,
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0',
    };
  }

  // Delete work order (only pending/scheduled)
  async delete(id: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new Error('Work order not found');
    }

    if (!['PENDING', 'SCHEDULED'].includes(workOrder.status)) {
      throw new Error('Can only delete pending or scheduled work orders');
    }

    await prisma.workOrder.delete({
      where: { id },
    });

    return { success: true };
  }

  // Helper: Update total costs
  private async updateTotalCosts(id: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        items: true,
        laborEntries: true,
      },
    });

    if (!workOrder) return;

    // Calculate material cost
    const materialCost = workOrder.items.reduce(
      (sum, item) => sum + item.totalCost.toNumber(),
      0
    );

    // Calculate labor cost (assuming hourly rates)
    const laborCost = workOrder.laborEntries.reduce((sum, entry) => {
      const hours = entry.totalMinutes ? entry.totalMinutes / 60 : 0;
      const rate = entry.hourlyRate?.toNumber() || 25; // Default hourly rate
      return sum + hours * rate;
    }, 0);

    const totalCost = materialCost + laborCost + (workOrder.additionalCost?.toNumber() || 0);

    await prisma.workOrder.update({
      where: { id },
      data: {
        materialCost,
        laborCost,
        totalCost,
      },
    });
  }

  // Helper: Log activity
  private async logActivity(
    workOrderId: string,
    action: string,
    description: string,
    userId: string
  ) {
    await prisma.workOrderActivity.create({
      data: {
        workOrderId,
        action,
        description,
        performedById: userId,
      },
    });
  }

  // Helper: Get work order includes
  private getWorkOrderIncludes(): Prisma.WorkOrderInclude {
    return {
      serviceRequest: {
        include: {
          customer: true,
          complaintType: true,
          zone: true,
          attachments: true,
          property: {
            include: {
              areaRef: true,
            },
          },
          unit: {
            include: {
              building: {
                include: {
                  block: {
                    include: {
                      area: true,
                    },
                  },
                  road: true,
                  area: true,
                },
              },
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          orgName: true,
          phone: true,
          email: true,
        },
      },
      quote: {
        select: {
          id: true,
          quoteNo: true,
          total: true,
        },
      },
      estimate: {
        select: {
          id: true,
          estimateNo: true,
          total: true,
        },
      },
      team: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      },
      items: true,
      laborEntries: {
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      checklists: {
        orderBy: { sortOrder: 'asc' },
      },
      photos: {
        orderBy: { createdAt: 'desc' },
      },
      activities: {
        orderBy: { performedAt: 'desc' },
        take: 20,
      },
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    };
  }
}
