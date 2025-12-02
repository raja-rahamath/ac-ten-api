import { PrismaClient, Prisma, EstimateStatus, DiscountType } from '@prisma/client';
import {
  CreateEstimateInput,
  UpdateEstimateInput,
  EstimateItemInput,
  EstimateLaborItemInput,
  ConvertToQuoteInput,
  EstimateQueryInput,
} from './estimate.schema.js';

const prisma = new PrismaClient();

export class EstimateService {
  // Generate unique estimate number
  private async generateEstimateNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EST-${year}-`;

    const lastEstimate = await prisma.estimate.findFirst({
      where: { estimateNo: { startsWith: prefix } },
      orderBy: { estimateNo: 'desc' },
    });

    let nextNumber = 1;
    if (lastEstimate) {
      const match = lastEstimate.estimateNo.match(new RegExp(`${prefix}(\\d+)`));
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Calculate item totals
  private calculateItemTotals(item: EstimateItemInput): {
    totalCost: number;
    markupAmount: number;
    totalPrice: number;
  } {
    const totalCost = item.quantity * item.unitCost;

    let markupAmount = 0;
    if (item.markupType && item.markupValue > 0) {
      if (item.markupType === 'PERCENTAGE') {
        markupAmount = totalCost * (item.markupValue / 100);
      } else {
        markupAmount = item.markupValue;
      }
    }

    const totalPrice = totalCost + markupAmount;

    return { totalCost, markupAmount, totalPrice };
  }

  // Calculate labor item totals
  private calculateLaborItemTotals(item: EstimateLaborItemInput): {
    totalCost: number;
    markupAmount: number;
    totalPrice: number;
  } {
    const totalCost = item.quantity * item.hours * item.hourlyRate;

    let markupAmount = 0;
    if (item.markupType && item.markupValue > 0) {
      if (item.markupType === 'PERCENTAGE') {
        markupAmount = totalCost * (item.markupValue / 100);
      } else {
        markupAmount = item.markupValue;
      }
    }

    const totalPrice = totalCost + markupAmount;

    return { totalCost, markupAmount, totalPrice };
  }

  // Calculate estimate totals from items and labor
  private calculateEstimateTotals(
    items: Array<EstimateItemInput & { totalCost: number; totalPrice: number }>,
    laborItems: Array<EstimateLaborItemInput & { totalCost: number; totalPrice: number }>,
    profitMarginType: DiscountType | null | undefined,
    profitMarginValue: number,
    vatRate: number,
    discountType: DiscountType | null | undefined,
    discountValue: number
  ) {
    // Sum costs by category
    const materialCost = items
      .filter(i => i.itemType === 'MATERIAL')
      .reduce((sum, i) => sum + i.totalCost, 0);
    const equipmentCost = items
      .filter(i => i.itemType === 'EQUIPMENT')
      .reduce((sum, i) => sum + i.totalCost, 0);
    const otherCost = items
      .filter(i => !['MATERIAL', 'EQUIPMENT'].includes(i.itemType))
      .reduce((sum, i) => sum + i.totalCost, 0);
    const laborCost = laborItems.reduce((sum, i) => sum + i.totalCost, 0);

    // Subtotal is sum of all prices (including markups)
    const itemsTotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const laborTotal = laborItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const subtotal = itemsTotal + laborTotal;

    // Calculate profit margin
    let profitAmount = 0;
    if (profitMarginType && profitMarginValue > 0) {
      if (profitMarginType === 'PERCENTAGE') {
        profitAmount = subtotal * (profitMarginValue / 100);
      } else {
        profitAmount = profitMarginValue;
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (discountType && discountValue > 0) {
      if (discountType === 'PERCENTAGE') {
        discountAmount = (subtotal + profitAmount) * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
    }

    // Total before VAT
    const totalBeforeVat = subtotal + profitAmount - discountAmount;

    // VAT calculation
    const vatAmount = totalBeforeVat * (vatRate / 100);

    // Final total
    const total = totalBeforeVat + vatAmount;

    return {
      materialCost,
      laborCost,
      equipmentCost,
      otherCost,
      subtotal,
      profitAmount,
      discountAmount,
      totalBeforeVat,
      vatAmount,
      total,
    };
  }

  // Create a new estimate
  async create(data: CreateEstimateInput, userId: string) {
    // Validate service request exists
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: data.serviceRequestId },
    });

    if (!serviceRequest) {
      throw new Error('Service request not found');
    }

    // Validate site visit if provided
    if (data.siteVisitId) {
      const siteVisit = await prisma.siteVisit.findUnique({
        where: { id: data.siteVisitId },
      });
      if (!siteVisit) {
        throw new Error('Site visit not found');
      }
    }

    const estimateNo = await this.generateEstimateNo();

    // Calculate all item totals
    const itemsWithTotals = (data.items || []).map((item, index) => ({
      ...item,
      sortOrder: item.sortOrder ?? index,
      ...this.calculateItemTotals(item),
    }));

    const laborItemsWithTotals = (data.laborItems || []).map((item, index) => ({
      ...item,
      sortOrder: item.sortOrder ?? index,
      ...this.calculateLaborItemTotals(item),
    }));

    // Calculate estimate totals
    const totals = this.calculateEstimateTotals(
      itemsWithTotals,
      laborItemsWithTotals,
      data.profitMarginType as DiscountType | null,
      data.profitMarginValue || 0,
      data.vatRate || 10,
      data.discountType as DiscountType | null,
      data.discountValue || 0
    );

    const estimate = await prisma.estimate.create({
      data: {
        estimateNo,
        serviceRequestId: data.serviceRequestId,
        siteVisitId: data.siteVisitId || null,
        title: data.title,
        description: data.description,
        scope: data.scope,
        status: 'DRAFT',

        // Costs
        materialCost: totals.materialCost,
        laborCost: totals.laborCost,
        equipmentCost: totals.equipmentCost,
        otherCost: totals.otherCost,
        subtotal: totals.subtotal,

        // Profit
        profitMarginType: data.profitMarginType as DiscountType | null,
        profitMarginValue: data.profitMarginValue || 0,
        profitAmount: totals.profitAmount,

        // VAT
        vatRate: data.vatRate || 10,
        vatAmount: totals.vatAmount,

        // Discount
        discountType: data.discountType as DiscountType | null,
        discountValue: data.discountValue || 0,
        discountAmount: totals.discountAmount,
        discountReason: data.discountReason,

        // Totals
        totalBeforeVat: totals.totalBeforeVat,
        total: totals.total,

        // Timeline
        estimatedDuration: data.estimatedDuration,
        estimatedStartDate: data.estimatedStartDate ? new Date(data.estimatedStartDate) : null,
        estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : null,

        // Notes
        internalNotes: data.internalNotes,
        assumptions: data.assumptions,
        exclusions: data.exclusions,

        createdById: userId,

        // Items
        items: {
          create: itemsWithTotals.map((item) => ({
            sortOrder: item.sortOrder,
            itemType: item.itemType,
            inventoryItemId: item.inventoryItemId || null,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            markupType: item.markupType as DiscountType | null,
            markupValue: item.markupValue || 0,
            markupAmount: item.markupAmount,
            totalPrice: item.totalPrice,
            notes: item.notes,
          })),
        },

        // Labor items
        laborItems: {
          create: laborItemsWithTotals.map((item) => ({
            sortOrder: item.sortOrder,
            laborType: item.laborType,
            description: item.description,
            quantity: item.quantity,
            hours: item.hours,
            hourlyRate: item.hourlyRate,
            totalCost: item.totalCost,
            markupType: item.markupType as DiscountType | null,
            markupValue: item.markupValue || 0,
            markupAmount: item.markupAmount,
            totalPrice: item.totalPrice,
            notes: item.notes,
          })),
        },

        // Activity
        activities: {
          create: {
            action: 'CREATED',
            description: 'Estimate created',
            performedById: userId,
          },
        },
      },
      include: {
        serviceRequest: {
          include: {
            customer: true,
            zone: true,
          },
        },
        siteVisit: true,
        items: { orderBy: { sortOrder: 'asc' } },
        laborItems: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: data.serviceRequestId },
      data: { status: 'ESTIMATION_IN_PROGRESS' },
    });

    return estimate;
  }

  // Get all estimates
  async getAll(query: EstimateQueryInput) {
    const {
      page,
      limit,
      search,
      status,
      serviceRequestId,
      fromDate,
      toDate,
      includeRevisions,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.EstimateWhereInput = {
      ...(status && { status }),
      ...(serviceRequestId && { serviceRequestId }),
      ...(search && {
        OR: [
          { estimateNo: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
      ...(toDate && { createdAt: { lte: new Date(toDate) } }),
      ...(!includeRevisions && { isLatestVersion: true }),
    };

    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          serviceRequest: {
            include: {
              customer: true,
              zone: true,
            },
          },
          items: { orderBy: { sortOrder: 'asc' } },
          laborItems: { orderBy: { sortOrder: 'asc' } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          approvedBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { revisions: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.estimate.count({ where }),
    ]);

    return {
      data: estimates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get estimate by ID
  async getById(id: string) {
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        serviceRequest: {
          include: {
            customer: true,
            zone: true,
            complaintType: true,
          },
        },
        siteVisit: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            inventoryItem: true,
          },
        },
        laborItems: { orderBy: { sortOrder: 'asc' } },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            performedBy: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        revisions: {
          orderBy: { version: 'desc' },
          select: {
            id: true,
            estimateNo: true,
            version: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        parentEstimate: {
          select: {
            id: true,
            estimateNo: true,
            version: true,
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        rejectedBy: { select: { id: true, firstName: true, lastName: true } },
        convertedToQuote: { select: { id: true, quoteNo: true } },
      },
    });

    return estimate;
  }

  // Update estimate (only DRAFT or REVISION_REQUESTED status)
  async update(id: string, data: UpdateEstimateInput, userId: string) {
    const estimate = await prisma.estimate.findUnique({ where: { id } });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(estimate.status)) {
      throw new Error('Only draft or revision-requested estimates can be edited');
    }

    // Prepare update data
    let updateData: any = { ...data };

    // If items are provided, recalculate totals
    if (data.items || data.laborItems) {
      const itemsWithTotals = (data.items || []).map((item, index) => ({
        ...item,
        sortOrder: item.sortOrder ?? index,
        ...this.calculateItemTotals(item),
      }));

      const laborItemsWithTotals = (data.laborItems || []).map((item, index) => ({
        ...item,
        sortOrder: item.sortOrder ?? index,
        ...this.calculateLaborItemTotals(item),
      }));

      const totals = this.calculateEstimateTotals(
        itemsWithTotals,
        laborItemsWithTotals,
        (data.profitMarginType ?? estimate.profitMarginType) as DiscountType | null,
        data.profitMarginValue ?? Number(estimate.profitMarginValue),
        data.vatRate ?? Number(estimate.vatRate),
        (data.discountType ?? estimate.discountType) as DiscountType | null,
        data.discountValue ?? Number(estimate.discountValue)
      );

      updateData = {
        ...updateData,
        materialCost: totals.materialCost,
        laborCost: totals.laborCost,
        equipmentCost: totals.equipmentCost,
        otherCost: totals.otherCost,
        subtotal: totals.subtotal,
        profitAmount: totals.profitAmount,
        vatAmount: totals.vatAmount,
        discountAmount: totals.discountAmount,
        totalBeforeVat: totals.totalBeforeVat,
        total: totals.total,
      };

      // Delete and recreate items
      if (data.items) {
        await prisma.estimateItem.deleteMany({ where: { estimateId: id } });
        await prisma.estimateItem.createMany({
          data: itemsWithTotals.map((item) => ({
            estimateId: id,
            sortOrder: item.sortOrder,
            itemType: item.itemType,
            inventoryItemId: item.inventoryItemId || null,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unit: item.unit,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            markupType: item.markupType as DiscountType | null,
            markupValue: item.markupValue || 0,
            markupAmount: item.markupAmount,
            totalPrice: item.totalPrice,
            notes: item.notes,
          })),
        });
      }

      if (data.laborItems) {
        await prisma.estimateLaborItem.deleteMany({ where: { estimateId: id } });
        await prisma.estimateLaborItem.createMany({
          data: laborItemsWithTotals.map((item) => ({
            estimateId: id,
            sortOrder: item.sortOrder,
            laborType: item.laborType,
            description: item.description,
            quantity: item.quantity,
            hours: item.hours,
            hourlyRate: item.hourlyRate,
            totalCost: item.totalCost,
            markupType: item.markupType as DiscountType | null,
            markupValue: item.markupValue || 0,
            markupAmount: item.markupAmount,
            totalPrice: item.totalPrice,
            notes: item.notes,
          })),
        });
      }

      delete updateData.items;
      delete updateData.laborItems;
    }

    // Handle date conversions
    if (data.estimatedStartDate) {
      updateData.estimatedStartDate = new Date(data.estimatedStartDate);
    }
    if (data.estimatedEndDate) {
      updateData.estimatedEndDate = new Date(data.estimatedEndDate);
    }

    const updated = await prisma.estimate.update({
      where: { id },
      data: {
        ...updateData,
        activities: {
          create: {
            action: 'UPDATED',
            description: 'Estimate updated',
            performedById: userId,
          },
        },
      },
      include: {
        serviceRequest: {
          include: { customer: true },
        },
        items: { orderBy: { sortOrder: 'asc' } },
        laborItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return updated;
  }

  // Submit estimate for manager approval
  async submitForApproval(id: string, userId: string, notes?: string) {
    const estimate = await prisma.estimate.findUnique({ where: { id } });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (!['DRAFT', 'REVISION_REQUESTED'].includes(estimate.status)) {
      throw new Error('Only draft or revision-requested estimates can be submitted');
    }

    const updated = await prisma.estimate.update({
      where: { id },
      data: {
        status: 'PENDING_MANAGER_APPROVAL',
        submittedAt: new Date(),
        submittedById: userId,
        activities: {
          create: {
            action: 'SUBMITTED',
            description: notes ? `Submitted for approval: ${notes}` : 'Submitted for manager approval',
            performedById: userId,
          },
        },
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: estimate.serviceRequestId },
      data: { status: 'ESTIMATE_PENDING_APPROVAL' },
    });

    return updated;
  }

  // Manager approves estimate
  async approve(id: string, userId: string, notes?: string) {
    const estimate = await prisma.estimate.findUnique({ where: { id } });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (estimate.status !== 'PENDING_MANAGER_APPROVAL') {
      throw new Error('Only pending estimates can be approved');
    }

    const updated = await prisma.estimate.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: userId,
        activities: {
          create: {
            action: 'APPROVED',
            description: notes ? `Approved: ${notes}` : 'Estimate approved by manager',
            performedById: userId,
          },
        },
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: estimate.serviceRequestId },
      data: { status: 'ESTIMATE_APPROVED' },
    });

    return updated;
  }

  // Manager rejects estimate
  async reject(id: string, userId: string, reason: string) {
    const estimate = await prisma.estimate.findUnique({ where: { id } });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (estimate.status !== 'PENDING_MANAGER_APPROVAL') {
      throw new Error('Only pending estimates can be rejected');
    }

    const updated = await prisma.estimate.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedById: userId,
        rejectionReason: reason,
        activities: {
          create: {
            action: 'REJECTED',
            description: `Rejected: ${reason}`,
            performedById: userId,
          },
        },
      },
    });

    return updated;
  }

  // Manager requests revision
  async requestRevision(id: string, userId: string, reason: string, notes?: string) {
    const estimate = await prisma.estimate.findUnique({ where: { id } });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (estimate.status !== 'PENDING_MANAGER_APPROVAL') {
      throw new Error('Only pending estimates can have revision requested');
    }

    const updated = await prisma.estimate.update({
      where: { id },
      data: {
        status: 'REVISION_REQUESTED',
        activities: {
          create: {
            action: 'REVISION_REQUESTED',
            description: `Revision requested: ${reason}${notes ? `. Notes: ${notes}` : ''}`,
            metadata: { reason, notes },
            performedById: userId,
          },
        },
      },
    });

    return updated;
  }

  // Convert approved estimate to customer quote
  async convertToQuote(id: string, data: ConvertToQuoteInput, userId: string) {
    const estimate = await prisma.estimate.findUnique({
      where: { id },
      include: {
        serviceRequest: {
          include: { customer: true },
        },
        items: true,
        laborItems: true,
      },
    });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (estimate.status !== 'APPROVED') {
      throw new Error('Only approved estimates can be converted to quotes');
    }

    // Generate quote number
    const year = new Date().getFullYear();
    const prefix = `QUO-${year}-`;
    const lastQuote = await prisma.quote.findFirst({
      where: { quoteNo: { startsWith: prefix } },
      orderBy: { quoteNo: 'desc' },
    });
    let nextNumber = 1;
    if (lastQuote) {
      const lastNumber = parseInt(lastQuote.quoteNo.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }
    const quoteNo = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

    // Prepare quote items from estimate items and labor
    const quoteItems = [
      ...estimate.items.map((item, index) => ({
        sortOrder: index,
        itemType: item.itemType === 'MATERIAL' ? 'MATERIAL' as const :
                  item.itemType === 'EQUIPMENT' ? 'EQUIPMENT' as const : 'OTHER' as const,
        name: item.name,
        description: item.description,
        sku: item.sku,
        quantity: Number(item.quantity),
        unit: item.unit,
        unitPrice: Number(item.totalPrice) / Number(item.quantity), // Use selling price
        taxRate: 0, // Tax applied at quote level
      })),
      ...estimate.laborItems.map((item, index) => ({
        sortOrder: estimate.items.length + index,
        itemType: 'LABOR' as const,
        name: item.description,
        description: `${item.quantity} worker(s) x ${item.hours} hours`,
        sku: null as string | null,
        quantity: 1,
        unit: 'service',
        unitPrice: Number(item.totalPrice), // Use selling price
        taxRate: 0,
      })),
    ];

    // Calculate quote totals with optional customer discount
    let subtotal = quoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    let discountAmount = 0;
    if (data.adjustPricing && data.customerDiscount > 0) {
      if (data.customerDiscountType === 'PERCENTAGE') {
        discountAmount = subtotal * (data.customerDiscount / 100);
      } else {
        discountAmount = data.customerDiscount;
      }
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (Number(estimate.vatRate) / 100);
    const total = afterDiscount + taxAmount;

    // Create the quote
    const quote = await prisma.quote.create({
      data: {
        quoteNo,
        customerId: estimate.serviceRequest.customerId,
        serviceRequestId: estimate.serviceRequestId,
        title: data.title || estimate.title,
        description: data.description || estimate.description,
        status: 'DRAFT',
        subtotal,
        taxRate: Number(estimate.vatRate),
        taxAmount,
        discountType: data.adjustPricing ? data.customerDiscountType as DiscountType | null : null,
        discountValue: data.adjustPricing ? data.customerDiscount : 0,
        discountAmount,
        total,
        validFrom: new Date(),
        validUntil: new Date(data.validUntil),
        terms: data.terms,
        notes: data.notes,
        createdById: userId,
        items: {
          create: quoteItems.map((item, index) => ({
            sortOrder: item.sortOrder,
            itemType: item.itemType,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discountType: null,
            discountValue: 0,
            discountAmount: 0,
            taxRate: 0,
            taxAmount: 0,
            subtotal: item.quantity * item.unitPrice,
            total: item.quantity * item.unitPrice,
            notes: null,
          })),
        },
        activities: {
          create: {
            action: 'CREATED_FROM_ESTIMATE',
            description: `Created from estimate ${estimate.estimateNo}`,
            metadata: { estimateId: id },
            performedById: userId,
          },
        },
      },
    });

    // Update estimate status
    await prisma.estimate.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedToQuoteId: quote.id,
        convertedAt: new Date(),
        activities: {
          create: {
            action: 'CONVERTED_TO_QUOTE',
            description: `Converted to quote ${quoteNo}`,
            metadata: { quoteId: quote.id },
            performedById: userId,
          },
        },
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: estimate.serviceRequestId },
      data: { status: 'QUOTATION_IN_PROGRESS' },
    });

    return quote;
  }

  // Cancel estimate
  async cancel(id: string, userId: string, reason?: string) {
    const estimate = await prisma.estimate.findUnique({ where: { id } });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (['CONVERTED', 'CANCELLED'].includes(estimate.status)) {
      throw new Error('Estimate cannot be cancelled');
    }

    const updated = await prisma.estimate.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        activities: {
          create: {
            action: 'CANCELLED',
            description: reason ? `Cancelled: ${reason}` : 'Estimate cancelled',
            performedById: userId,
          },
        },
      },
    });

    return updated;
  }

  // Delete estimate (only DRAFT)
  async delete(id: string) {
    const estimate = await prisma.estimate.findUnique({ where: { id } });

    if (!estimate) {
      throw new Error('Estimate not found');
    }

    if (estimate.status !== 'DRAFT') {
      throw new Error('Only draft estimates can be deleted');
    }

    await prisma.estimate.delete({ where: { id } });
  }

  // Get estimate statistics
  async getStats() {
    const [
      totalEstimates,
      draftEstimates,
      pendingApproval,
      approvedEstimates,
      rejectedEstimates,
      convertedEstimates,
      totalValue,
      approvedValue,
    ] = await Promise.all([
      prisma.estimate.count({ where: { isLatestVersion: true } }),
      prisma.estimate.count({ where: { status: 'DRAFT', isLatestVersion: true } }),
      prisma.estimate.count({ where: { status: 'PENDING_MANAGER_APPROVAL', isLatestVersion: true } }),
      prisma.estimate.count({ where: { status: 'APPROVED', isLatestVersion: true } }),
      prisma.estimate.count({ where: { status: 'REJECTED', isLatestVersion: true } }),
      prisma.estimate.count({ where: { status: 'CONVERTED', isLatestVersion: true } }),
      prisma.estimate.aggregate({
        where: { isLatestVersion: true },
        _sum: { total: true },
      }),
      prisma.estimate.aggregate({
        where: { status: 'APPROVED', isLatestVersion: true },
        _sum: { total: true },
      }),
    ]);

    // Calculate approval rate
    const totalReviewed = approvedEstimates + rejectedEstimates;
    const approvalRate = totalReviewed > 0 ? (approvedEstimates / totalReviewed) * 100 : 0;

    return {
      totalEstimates,
      draftEstimates,
      pendingApproval,
      approvedEstimates,
      rejectedEstimates,
      convertedEstimates,
      totalValue: totalValue._sum.total || 0,
      approvedValue: approvedValue._sum.total || 0,
      approvalRate: Math.round(approvalRate * 100) / 100,
    };
  }
}
