import { PrismaClient, Prisma, BillingCycle, MembershipStatus } from '@prisma/client';
import {
  CreatePlanInput,
  UpdatePlanInput,
  SubscribeInput,
  ChangePlanInput,
  CancelInput,
  PlanQueryInput,
  MembershipQueryInput,
} from './membership.schema.js';

const prisma = new PrismaClient();

export class MembershipService {
  // ==================== PLANS ====================

  // Create membership plan
  async createPlan(data: CreatePlanInput, userId: string) {
    // Check for duplicate code
    const existing = await prisma.membershipPlan.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Plan code already exists');
    }

    return prisma.membershipPlan.create({
      data: {
        name: data.name,
        nameAr: data.nameAr,
        code: data.code,
        description: data.description,
        descriptionAr: data.descriptionAr,
        price: data.price,
        billingCycle: data.billingCycle as BillingCycle,
        features: data.features,
        serviceDiscount: data.serviceDiscount,
        partsDiscount: data.partsDiscount,
        priorityService: data.priorityService,
        freeVisitsPerYear: data.freeVisitsPerYear,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        createdById: userId,
      },
    });
  }

  // Update membership plan
  async updatePlan(id: string, data: UpdatePlanInput, userId: string) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    return prisma.membershipPlan.update({
      where: { id },
      data: {
        ...data,
        billingCycle: data.billingCycle as BillingCycle | undefined,
        updatedById: userId,
      },
    });
  }

  // Get all plans
  async getPlans(query: PlanQueryInput) {
    const { page, limit, isActive, billingCycle, search, sortBy, sortOrder } = query;

    const where: Prisma.MembershipPlanWhereInput = {
      ...(isActive !== undefined && { isActive }),
      ...(billingCycle && { billingCycle: billingCycle as BillingCycle }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { code: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [plans, total] = await Promise.all([
      prisma.membershipPlan.findMany({
        where,
        include: {
          _count: {
            select: { subscriptions: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.membershipPlan.count({ where }),
    ]);

    return {
      data: plans,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get plan by ID
  async getPlanById(id: string) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    return plan;
  }

  // Get plan by code
  async getPlanByCode(code: string) {
    const plan = await prisma.membershipPlan.findUnique({
      where: { code },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    return plan;
  }

  // Delete plan
  async deletePlan(id: string) {
    // Check if plan has active subscriptions
    const subscriptions = await prisma.customerMembership.count({
      where: {
        planId: id,
        status: { in: ['ACTIVE', 'PENDING_PAYMENT'] },
      },
    });

    if (subscriptions > 0) {
      throw new Error('Cannot delete plan with active subscriptions');
    }

    await prisma.membershipPlan.delete({
      where: { id },
    });

    return { success: true };
  }

  // ==================== SUBSCRIPTIONS ====================

  // Subscribe customer to plan
  async subscribe(data: SubscribeInput, userId: string) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify plan exists and is active
    const plan = await prisma.membershipPlan.findUnique({
      where: { id: data.planId },
    });

    if (!plan) {
      throw new Error('Plan not found');
    }

    if (!plan.isActive) {
      throw new Error('Plan is not active');
    }

    // Check if customer already has an active membership
    const existingMembership = await prisma.customerMembership.findFirst({
      where: {
        customerId: data.customerId,
        status: { in: ['ACTIVE', 'PENDING_PAYMENT'] },
      },
    });

    if (existingMembership) {
      throw new Error('Customer already has an active membership');
    }

    // Calculate dates
    const startDate = data.startDate ? new Date(data.startDate) : new Date();
    const endDate = this.calculateEndDate(startDate, plan.billingCycle);

    return prisma.customerMembership.create({
      data: {
        customerId: data.customerId,
        planId: data.planId,
        startDate,
        endDate,
        autoRenew: data.autoRenew,
        paymentMethod: data.paymentMethod,
        nextBillingAt: endDate,
        createdById: userId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        plan: true,
      },
    });
  }

  // Renew membership
  async renew(membershipId: string, userId: string) {
    const membership = await prisma.customerMembership.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status === 'CANCELLED') {
      throw new Error('Cannot renew a cancelled membership');
    }

    // Calculate new end date
    const newEndDate = this.calculateEndDate(membership.endDate, membership.plan.billingCycle);

    return prisma.customerMembership.update({
      where: { id: membershipId },
      data: {
        endDate: newEndDate,
        status: 'ACTIVE',
        lastBilledAt: new Date(),
        nextBillingAt: newEndDate,
        freeVisitsUsed: 0, // Reset free visits on renewal
        updatedById: userId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        plan: true,
      },
    });
  }

  // Change plan
  async changePlan(data: ChangePlanInput, userId: string) {
    const membership = await prisma.customerMembership.findUnique({
      where: { id: data.membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status !== 'ACTIVE') {
      throw new Error('Can only change plan for active memberships');
    }

    const newPlan = await prisma.membershipPlan.findUnique({
      where: { id: data.newPlanId },
    });

    if (!newPlan) {
      throw new Error('New plan not found');
    }

    if (!newPlan.isActive) {
      throw new Error('New plan is not active');
    }

    // Calculate effective date and new end date
    const effectiveDate = data.effectiveDate ? new Date(data.effectiveDate) : membership.endDate;
    const newEndDate = this.calculateEndDate(effectiveDate, newPlan.billingCycle);

    return prisma.customerMembership.update({
      where: { id: data.membershipId },
      data: {
        planId: data.newPlanId,
        endDate: newEndDate,
        nextBillingAt: newEndDate,
        freeVisitsUsed: 0, // Reset free visits when changing plans
        updatedById: userId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        plan: true,
      },
    });
  }

  // Cancel membership
  async cancel(data: CancelInput, userId: string) {
    const membership = await prisma.customerMembership.findUnique({
      where: { id: data.membershipId },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status === 'CANCELLED') {
      throw new Error('Membership is already cancelled');
    }

    const updateData: Prisma.CustomerMembershipUpdateInput = {
      autoRenew: false,
      cancellationReason: data.reason,
      cancelledAt: new Date(),
      updatedById: userId,
    };

    if (data.immediate) {
      updateData.status = 'CANCELLED';
      updateData.endDate = new Date();
    }

    return prisma.customerMembership.update({
      where: { id: data.membershipId },
      data: updateData,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        plan: true,
      },
    });
  }

  // Suspend membership
  async suspend(membershipId: string, reason: string, userId: string) {
    const membership = await prisma.customerMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status !== 'ACTIVE') {
      throw new Error('Can only suspend active memberships');
    }

    return prisma.customerMembership.update({
      where: { id: membershipId },
      data: {
        status: 'SUSPENDED',
        cancellationReason: reason,
        updatedById: userId,
      },
    });
  }

  // Reactivate membership
  async reactivate(membershipId: string, userId: string) {
    const membership = await prisma.customerMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status !== 'SUSPENDED') {
      throw new Error('Can only reactivate suspended memberships');
    }

    // Check if membership has expired
    if (membership.endDate < new Date()) {
      throw new Error('Membership has expired. Please renew instead.');
    }

    return prisma.customerMembership.update({
      where: { id: membershipId },
      data: {
        status: 'ACTIVE',
        cancellationReason: null,
        updatedById: userId,
      },
    });
  }

  // Get all memberships
  async getMemberships(query: MembershipQueryInput) {
    const { page, limit, customerId, planId, status, fromDate, toDate, sortBy, sortOrder } = query;

    const where: Prisma.CustomerMembershipWhereInput = {
      ...(customerId && { customerId }),
      ...(planId && { planId }),
      ...(status && { status: status as MembershipStatus }),
      ...(fromDate && { startDate: { gte: new Date(fromDate) } }),
      ...(toDate && { endDate: { lte: new Date(toDate) } }),
    };

    const [memberships, total] = await Promise.all([
      prisma.customerMembership.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          plan: true,
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerMembership.count({ where }),
    ]);

    return {
      data: memberships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get membership by ID
  async getMembershipById(id: string) {
    const membership = await prisma.customerMembership.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        plan: true,
      },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    return membership;
  }

  // Get customer's active membership
  async getCustomerMembership(customerId: string) {
    const membership = await prisma.customerMembership.findFirst({
      where: {
        customerId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
    });

    return membership;
  }

  // Use free visit
  async useFreeVisit(membershipId: string, userId: string) {
    const membership = await prisma.customerMembership.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new Error('Membership not found');
    }

    if (membership.status !== 'ACTIVE') {
      throw new Error('Membership is not active');
    }

    if (membership.freeVisitsUsed >= membership.plan.freeVisitsPerYear) {
      throw new Error('No free visits remaining');
    }

    return prisma.customerMembership.update({
      where: { id: membershipId },
      data: {
        freeVisitsUsed: membership.freeVisitsUsed + 1,
        updatedById: userId,
      },
      include: {
        plan: true,
      },
    });
  }

  // Get statistics
  async getStats() {
    const [
      totalPlans,
      activePlans,
      totalMemberships,
      activeMemberships,
      expiredMemberships,
      cancelledMemberships,
    ] = await Promise.all([
      prisma.membershipPlan.count(),
      prisma.membershipPlan.count({ where: { isActive: true } }),
      prisma.customerMembership.count(),
      prisma.customerMembership.count({ where: { status: 'ACTIVE' } }),
      prisma.customerMembership.count({ where: { status: 'EXPIRED' } }),
      prisma.customerMembership.count({ where: { status: 'CANCELLED' } }),
    ]);

    // Revenue by plan
    const revenueByPlan = await prisma.customerMembership.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    // Get plan details for revenue calculation
    const plans = await prisma.membershipPlan.findMany({
      where: {
        id: { in: revenueByPlan.map((r) => r.planId) },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    const planRevenue = revenueByPlan.map((r) => {
      const plan = plans.find((p) => p.id === r.planId);
      return {
        planId: r.planId,
        planName: plan?.name || 'Unknown',
        subscribers: r._count.id,
        monthlyRevenue: plan ? Number(plan.price) * r._count.id : 0,
      };
    });

    return {
      plans: {
        total: totalPlans,
        active: activePlans,
      },
      memberships: {
        total: totalMemberships,
        active: activeMemberships,
        expired: expiredMemberships,
        cancelled: cancelledMemberships,
      },
      revenueByPlan: planRevenue,
      totalMonthlyRevenue: planRevenue.reduce((sum, p) => sum + p.monthlyRevenue, 0),
    };
  }

  // Process expired memberships (called by cron)
  async processExpiredMemberships() {
    const now = new Date();

    // Find expired memberships
    const expired = await prisma.customerMembership.findMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: now },
        autoRenew: false,
      },
    });

    // Update status to expired
    await prisma.customerMembership.updateMany({
      where: {
        id: { in: expired.map((m) => m.id) },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    return { processed: expired.length };
  }

  // ==================== PRIVATE METHODS ====================

  private calculateEndDate(startDate: Date, billingCycle: BillingCycle): Date {
    const endDate = new Date(startDate);

    switch (billingCycle) {
      case 'MONTHLY':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'SEMI_ANNUAL':
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case 'ANNUAL':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    return endDate;
  }
}
