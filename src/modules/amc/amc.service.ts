import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  CreateAmcContractInput,
  UpdateAmcContractInput,
  UpdateAmcStatusInput,
  ContractPropertyInput,
  ContractServiceInput,
  UpdateScheduleStatusInput,
  RecordPaymentInput,
  ListAmcContractsQuery,
  ListSchedulesQuery,
  ListPaymentsQuery,
} from './amc.schema.js';
import { AmcServiceFrequency, AmcPaymentTerms } from '@prisma/client';

function generateContractNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `AMC-${timestamp}${random}`;
}

// Calculate visits per year based on frequency
function getVisitsPerYear(frequency: AmcServiceFrequency): number {
  const map: Record<AmcServiceFrequency, number> = {
    WEEKLY: 52,
    BI_WEEKLY: 26,
    MONTHLY: 12,
    BI_MONTHLY: 6,
    QUARTERLY: 4,
    SEMI_ANNUAL: 2,
    ANNUAL: 1,
  };
  return map[frequency];
}

// Calculate payment installments based on terms
function getInstallmentsPerYear(terms: AmcPaymentTerms): number {
  const map: Record<AmcPaymentTerms, number> = {
    UPFRONT: 1,
    MONTHLY: 12,
    QUARTERLY: 4,
    SEMI_ANNUAL: 2,
    ANNUAL: 1,
  };
  return map[terms];
}

export class AmcService {
  // ==================== CONTRACT CRUD ====================

  async create(input: CreateAmcContractInput, userId: string) {
    const { properties, services, ...contractData } = input;

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: contractData.customerId },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Create contract with properties and services
    const contract = await prisma.amcContract.create({
      data: {
        contractNo: generateContractNo(),
        ...contractData,
        createdById: userId,
        properties: {
          create: properties.map((p) => ({
            unitId: p.unitId,
            propertyId: p.propertyId,
            notes: p.notes,
          })),
        },
        services: {
          create: services.map((s) => ({
            complaintTypeId: s.complaintTypeId,
            frequency: s.frequency,
            visitsPerYear: s.visitsPerYear || getVisitsPerYear(s.frequency as AmcServiceFrequency),
            serviceCost: s.serviceCost,
            notes: s.notes,
          })),
        },
      },
      include: {
        customer: true,
        properties: {
          include: {
            unit: { include: { building: true } },
            property: true,
          },
        },
        services: {
          include: { complaintType: true },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return contract;
  }

  async findById(id: string) {
    const contract = await prisma.amcContract.findUnique({
      where: { id },
      include: {
        customer: true,
        properties: {
          include: {
            unit: { include: { building: true } },
            property: true,
          },
        },
        services: {
          include: { complaintType: true },
        },
        schedules: {
          orderBy: { scheduledDate: 'asc' },
          take: 50,
          include: {
            unit: true,
            property: true,
            complaintType: true,
            serviceRequest: { select: { id: true, requestNo: true, status: true } },
          },
        },
        payments: {
          orderBy: { dueDate: 'asc' },
          include: { invoice: { select: { id: true, invoiceNo: true } } },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        renewedFrom: { select: { id: true, contractNo: true } },
        renewedTo: { select: { id: true, contractNo: true } },
      },
    });

    if (!contract) {
      throw new NotFoundError('AMC Contract not found');
    }

    return contract;
  }

  async findAll(query: ListAmcContractsQuery) {
    const { search, customerId, status, expiringWithinDays } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { contractNo: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
        { customer: { orgName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    if (expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + expiringWithinDays);
      where.endDate = { lte: futureDate };
      where.status = 'ACTIVE';
    }

    const [contracts, total] = await Promise.all([
      prisma.amcContract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          properties: {
            include: {
              unit: { include: { building: { select: { buildingNumber: true, name: true } } } },
              property: { select: { name: true, propertyNo: true } },
            },
          },
          services: {
            include: { complaintType: { select: { name: true } } },
          },
          _count: {
            select: {
              schedules: true,
              payments: true,
            },
          },
        },
      }),
      prisma.amcContract.count({ where }),
    ]);

    return {
      data: contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateAmcContractInput) {
    const contract = await prisma.amcContract.findUnique({ where: { id } });
    if (!contract) {
      throw new NotFoundError('AMC Contract not found');
    }

    if (contract.status !== 'DRAFT') {
      throw new BadRequestError('Only draft contracts can be edited');
    }

    const updated = await prisma.amcContract.update({
      where: { id },
      data: input,
      include: {
        customer: true,
        properties: { include: { unit: true, property: true } },
        services: { include: { complaintType: true } },
      },
    });

    return updated;
  }

  async updateStatus(id: string, input: UpdateAmcStatusInput, userId: string) {
    const contract = await prisma.amcContract.findUnique({ where: { id } });
    if (!contract) {
      throw new NotFoundError('AMC Contract not found');
    }

    const updateData: any = { status: input.status };

    if (input.status === 'ACTIVE' && contract.status === 'PENDING_APPROVAL') {
      updateData.approvedById = userId;
      updateData.approvedAt = new Date();
    }

    if (input.status === 'CANCELLED') {
      updateData.cancelledById = userId;
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = input.reason;
    }

    const updated = await prisma.amcContract.update({
      where: { id },
      data: updateData,
    });

    // If activating, generate schedules and payment plan
    if (input.status === 'ACTIVE' && contract.status !== 'ACTIVE') {
      await this.generateSchedules(id);
      await this.generatePaymentSchedule(id);
    }

    return updated;
  }

  async delete(id: string) {
    const contract = await prisma.amcContract.findUnique({ where: { id } });
    if (!contract) {
      throw new NotFoundError('AMC Contract not found');
    }

    if (contract.status !== 'DRAFT') {
      throw new BadRequestError('Only draft contracts can be deleted');
    }

    await prisma.amcContract.delete({ where: { id } });
    return { success: true };
  }

  // ==================== PROPERTIES ====================

  async addProperty(contractId: string, input: ContractPropertyInput) {
    const contract = await prisma.amcContract.findUnique({ where: { id: contractId } });
    if (!contract) {
      throw new NotFoundError('AMC Contract not found');
    }

    const property = await prisma.amcContractProperty.create({
      data: {
        contractId,
        unitId: input.unitId,
        propertyId: input.propertyId,
        notes: input.notes,
      },
      include: { unit: true, property: true },
    });

    return property;
  }

  async removeProperty(contractId: string, propertyId: string) {
    const property = await prisma.amcContractProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property || property.contractId !== contractId) {
      throw new NotFoundError('Contract property not found');
    }

    await prisma.amcContractProperty.delete({ where: { id: propertyId } });
    return { success: true };
  }

  // ==================== SERVICES ====================

  async addService(contractId: string, input: ContractServiceInput) {
    const contract = await prisma.amcContract.findUnique({ where: { id: contractId } });
    if (!contract) {
      throw new NotFoundError('AMC Contract not found');
    }

    const service = await prisma.amcContractService.create({
      data: {
        contractId,
        complaintTypeId: input.complaintTypeId,
        frequency: input.frequency,
        visitsPerYear: input.visitsPerYear || getVisitsPerYear(input.frequency as AmcServiceFrequency),
        serviceCost: input.serviceCost,
        notes: input.notes,
      },
      include: { complaintType: true },
    });

    return service;
  }

  async removeService(contractId: string, serviceId: string) {
    const service = await prisma.amcContractService.findUnique({
      where: { id: serviceId },
    });

    if (!service || service.contractId !== contractId) {
      throw new NotFoundError('Contract service not found');
    }

    await prisma.amcContractService.delete({ where: { id: serviceId } });
    return { success: true };
  }

  // ==================== SCHEDULE GENERATION ====================

  async generateSchedules(contractId: string) {
    const contract = await prisma.amcContract.findUnique({
      where: { id: contractId },
      include: {
        properties: true,
        services: true,
      },
    });

    if (!contract) {
      throw new NotFoundError('AMC Contract not found');
    }

    // Delete existing schedules
    await prisma.amcServiceSchedule.deleteMany({
      where: { contractId, status: 'SCHEDULED' },
    });

    const schedules: any[] = [];
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);

    // For each service and property combination, generate schedules
    for (const service of contract.services) {
      const intervalDays = Math.floor(365 / service.visitsPerYear);

      for (const property of contract.properties) {
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          schedules.push({
            contractId,
            unitId: property.unitId,
            propertyId: property.propertyId,
            complaintTypeId: service.complaintTypeId,
            scheduledDate: new Date(currentDate),
            status: 'SCHEDULED',
          });

          currentDate.setDate(currentDate.getDate() + intervalDays);
        }
      }
    }

    if (schedules.length > 0) {
      await prisma.amcServiceSchedule.createMany({ data: schedules });
    }

    return { schedulesCreated: schedules.length };
  }

  // ==================== PAYMENT SCHEDULE GENERATION ====================

  async generatePaymentSchedule(contractId: string) {
    const contract = await prisma.amcContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundError('AMC Contract not found');
    }

    // Delete existing pending payments
    await prisma.amcPaymentSchedule.deleteMany({
      where: { contractId, status: 'PENDING' },
    });

    const installments = getInstallmentsPerYear(contract.paymentTerms);
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    const monthsBetween = Math.max(
      1,
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth())
    );

    const totalInstallments = Math.ceil(monthsBetween / (12 / installments));
    const installmentAmount = Number(contract.contractValue) / totalInstallments;

    const payments: any[] = [];
    let currentDate = new Date(startDate);
    const intervalMonths = 12 / installments;

    for (let i = 0; i < totalInstallments; i++) {
      payments.push({
        contractId,
        installmentNo: i + 1,
        dueDate: new Date(currentDate),
        amount: installmentAmount,
        status: 'PENDING',
      });

      currentDate.setMonth(currentDate.getMonth() + intervalMonths);
    }

    if (payments.length > 0) {
      await prisma.amcPaymentSchedule.createMany({ data: payments });
    }

    return { paymentsCreated: payments.length };
  }

  // ==================== SCHEDULES ====================

  async getSchedules(query: ListSchedulesQuery) {
    const { contractId, status, fromDate, toDate } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (contractId) {
      where.contractId = contractId;
    }

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) where.scheduledDate.gte = new Date(fromDate);
      if (toDate) where.scheduledDate.lte = new Date(toDate);
    }

    const [schedules, total] = await Promise.all([
      prisma.amcServiceSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledDate: 'asc' },
        include: {
          contract: {
            include: { customer: true },
          },
          unit: { include: { building: true } },
          property: true,
          complaintType: true,
          serviceRequest: { select: { id: true, requestNo: true, status: true } },
        },
      }),
      prisma.amcServiceSchedule.count({ where }),
    ]);

    return {
      data: schedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateScheduleStatus(scheduleId: string, input: UpdateScheduleStatusInput, userId: string) {
    const schedule = await prisma.amcServiceSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundError('Schedule not found');
    }

    const updateData: any = {
      status: input.status,
      notes: input.notes,
    };

    if (input.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.completedById = userId;
    }

    const updated = await prisma.amcServiceSchedule.update({
      where: { id: scheduleId },
      data: updateData,
    });

    return updated;
  }

  // ==================== PAYMENTS ====================

  async getPayments(query: ListPaymentsQuery) {
    const { contractId, status } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (contractId) {
      where.contractId = contractId;
    }

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.amcPaymentSchedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { dueDate: 'asc' },
        include: {
          contract: {
            include: { customer: true },
          },
          invoice: { select: { id: true, invoiceNo: true } },
        },
      }),
      prisma.amcPaymentSchedule.count({ where }),
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async recordPayment(paymentId: string, input: RecordPaymentInput) {
    const payment = await prisma.amcPaymentSchedule.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundError('Payment schedule not found');
    }

    const updatedPayment = await prisma.amcPaymentSchedule.update({
      where: { id: paymentId },
      data: {
        paidAt: new Date(),
        paidAmount: input.paidAmount,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        notes: input.notes,
        status: input.paidAmount >= Number(payment.amount) ? 'PAID' : 'PARTIALLY_PAID',
      },
    });

    return updatedPayment;
  }

  // ==================== DASHBOARD STATS ====================

  async getDashboardStats() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const [
      totalContracts,
      activeContracts,
      expiringContracts,
      pendingPayments,
      overduePayments,
      upcomingSchedules,
    ] = await Promise.all([
      prisma.amcContract.count(),
      prisma.amcContract.count({ where: { status: 'ACTIVE' } }),
      prisma.amcContract.count({
        where: {
          status: 'ACTIVE',
          endDate: { lte: thirtyDaysFromNow, gte: today },
        },
      }),
      prisma.amcPaymentSchedule.count({
        where: { status: { in: ['PENDING', 'DUE'] } },
      }),
      prisma.amcPaymentSchedule.count({
        where: { status: 'OVERDUE' },
      }),
      prisma.amcServiceSchedule.count({
        where: {
          status: 'SCHEDULED',
          scheduledDate: { gte: today, lte: thirtyDaysFromNow },
        },
      }),
    ]);

    return {
      totalContracts,
      activeContracts,
      expiringContracts,
      pendingPayments,
      overduePayments,
      upcomingSchedules,
    };
  }

  // ==================== RENEWAL ====================

  async renewContract(contractId: string, userId: string) {
    const oldContract = await prisma.amcContract.findUnique({
      where: { id: contractId },
      include: {
        properties: true,
        services: true,
      },
    });

    if (!oldContract) {
      throw new NotFoundError('AMC Contract not found');
    }

    if (oldContract.status !== 'ACTIVE' && oldContract.status !== 'EXPIRED') {
      throw new BadRequestError('Only active or expired contracts can be renewed');
    }

    // Calculate new period (same duration)
    const oldDuration = oldContract.endDate.getTime() - oldContract.startDate.getTime();
    const newStartDate = new Date(oldContract.endDate);
    newStartDate.setDate(newStartDate.getDate() + 1);
    const newEndDate = new Date(newStartDate.getTime() + oldDuration);

    // Create new contract
    const newContract = await prisma.amcContract.create({
      data: {
        contractNo: generateContractNo(),
        customerId: oldContract.customerId,
        startDate: newStartDate,
        endDate: newEndDate,
        contractValue: oldContract.contractValue,
        paymentTerms: oldContract.paymentTerms,
        autoRenew: oldContract.autoRenew,
        renewalReminderDays: oldContract.renewalReminderDays,
        terms: oldContract.terms,
        notes: `Renewed from ${oldContract.contractNo}`,
        renewedFromId: oldContract.id,
        createdById: userId,
        status: 'DRAFT',
        properties: {
          create: oldContract.properties.map((p) => ({
            unitId: p.unitId,
            propertyId: p.propertyId,
            notes: p.notes,
          })),
        },
        services: {
          create: oldContract.services.map((s) => ({
            complaintTypeId: s.complaintTypeId,
            frequency: s.frequency,
            visitsPerYear: s.visitsPerYear,
            serviceCost: s.serviceCost,
            notes: s.notes,
          })),
        },
      },
      include: {
        customer: true,
        properties: { include: { unit: true, property: true } },
        services: { include: { complaintType: true } },
      },
    });

    // Mark old contract as renewed
    await prisma.amcContract.update({
      where: { id: contractId },
      data: { status: 'RENEWED' },
    });

    return newContract;
  }
}
