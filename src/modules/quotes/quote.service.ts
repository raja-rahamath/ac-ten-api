import { PrismaClient, Prisma, QuoteStatus, DiscountType } from '@prisma/client';
import {
  CreateQuoteInput,
  UpdateQuoteInput,
  QuoteItemInput,
  CustomerResponseInput,
  CreateRevisionInput,
  ConvertToInvoiceInput,
  QuoteQueryInput,
} from './quote.schema.js';

const prisma = new PrismaClient();

export class QuoteService {
  // Generate unique quote number
  private async generateQuoteNo(): Promise<string> {
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

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Calculate item totals
  private calculateItemTotals(item: QuoteItemInput): {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  } {
    const subtotal = item.quantity * item.unitPrice;

    let discountAmount = 0;
    if (item.discountType && item.discountValue > 0) {
      if (item.discountType === 'PERCENTAGE') {
        discountAmount = subtotal * (item.discountValue / 100);
      } else {
        discountAmount = item.discountValue;
      }
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (item.taxRate / 100);
    const total = afterDiscount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  }

  // Calculate quote totals
  private calculateQuoteTotals(
    items: Array<QuoteItemInput & { subtotal: number; discountAmount: number; taxAmount: number; total: number }>,
    quoteTaxRate: number,
    quoteDiscountType: DiscountType | null | undefined,
    quoteDiscountValue: number
  ): {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  } {
    // Sum of all item totals (before quote-level discount and tax)
    const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const itemsDiscountAmount = items.reduce((sum, item) => sum + item.discountAmount, 0);
    const itemsTaxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);

    // Quote-level subtotal is sum of item subtotals
    const subtotal = itemsSubtotal;

    // Quote-level discount
    let quoteDiscount = 0;
    if (quoteDiscountType && quoteDiscountValue > 0) {
      if (quoteDiscountType === 'PERCENTAGE') {
        quoteDiscount = subtotal * (quoteDiscountValue / 100);
      } else {
        quoteDiscount = quoteDiscountValue;
      }
    }

    // Total discount is item discounts + quote discount
    const discountAmount = itemsDiscountAmount + quoteDiscount;

    // Quote-level tax (if no item-level tax, apply quote tax)
    const afterDiscount = subtotal - discountAmount;
    const quoteTax = itemsTaxAmount > 0 ? itemsTaxAmount : afterDiscount * (quoteTaxRate / 100);
    const taxAmount = quoteTax;

    const total = afterDiscount + taxAmount;

    return { subtotal, discountAmount, taxAmount, total };
  }

  // Create a new quote
  async create(data: CreateQuoteInput, userId: string) {
    const quoteNo = await this.generateQuoteNo();

    // Calculate all item totals
    const itemsWithTotals = data.items.map((item, index) => ({
      ...item,
      sortOrder: item.sortOrder ?? index,
      ...this.calculateItemTotals(item),
    }));

    // Calculate quote totals
    const totals = this.calculateQuoteTotals(
      itemsWithTotals,
      data.taxRate || 0,
      data.discountType as DiscountType | null,
      data.discountValue || 0
    );

    const quote = await prisma.quote.create({
      data: {
        quoteNo,
        customerId: data.customerId,
        unitId: data.unitId || null,
        propertyId: data.propertyId || null,
        serviceRequestId: data.serviceRequestId || null,
        title: data.title,
        description: data.description,
        status: 'DRAFT',
        subtotal: totals.subtotal,
        taxRate: data.taxRate || 0,
        taxAmount: totals.taxAmount,
        discountType: data.discountType as DiscountType | null,
        discountValue: data.discountValue || 0,
        discountAmount: totals.discountAmount,
        total: totals.total,
        currency: data.currency || 'BHD',
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: new Date(data.validUntil),
        terms: data.terms,
        notes: data.notes,
        internalNotes: data.internalNotes,
        createdById: userId,
        items: {
          create: itemsWithTotals.map((item) => ({
            sortOrder: item.sortOrder,
            itemType: item.itemType,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discountType: item.discountType as DiscountType | null,
            discountValue: item.discountValue || 0,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate || 0,
            taxAmount: item.taxAmount,
            subtotal: item.subtotal,
            total: item.total,
            notes: item.notes,
          })),
        },
        activities: {
          create: {
            action: 'CREATED',
            description: 'Quote created',
            performedById: userId,
          },
        },
      },
      include: {
        customer: true,
        unit: { include: { building: true } },
        property: true,
        items: { orderBy: { sortOrder: 'asc' } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return quote;
  }

  // Get all quotes with filtering
  async getAll(query: QuoteQueryInput) {
    const {
      page,
      limit,
      search,
      status,
      customerId,
      fromDate,
      toDate,
      includeRevisions,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.QuoteWhereInput = {
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(search && {
        OR: [
          { quoteNo: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { customer: { firstName: { contains: search, mode: 'insensitive' } } },
          { customer: { lastName: { contains: search, mode: 'insensitive' } } },
          { customer: { orgName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
      ...(toDate && { createdAt: { lte: new Date(toDate) } }),
      // By default, only show latest versions
      ...(!includeRevisions && { isLatestVersion: true }),
    };

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: true,
          unit: { include: { building: true } },
          items: { orderBy: { sortOrder: 'asc' } },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { revisions: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return {
      data: quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get quote by ID
  async getById(id: string) {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        unit: { include: { building: true } },
        property: true,
        items: { orderBy: { sortOrder: 'asc' } },
        attachments: true,
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
            quoteNo: true,
            version: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        parentQuote: {
          select: {
            id: true,
            quoteNo: true,
            version: true,
          },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        sentBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        convertedToInvoice: { select: { id: true, invoiceNo: true } },
      },
    });

    return quote;
  }

  // Update quote (only DRAFT status)
  async update(id: string, data: UpdateQuoteInput, userId: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'DRAFT') {
      throw new Error('Only draft quotes can be edited. Create a revision instead.');
    }

    // If items are updated, recalculate totals
    let updateData: any = { ...data };

    if (data.items) {
      const itemsWithTotals = data.items.map((item, index) => ({
        ...item,
        sortOrder: item.sortOrder ?? index,
        ...this.calculateItemTotals(item),
      }));

      const totals = this.calculateQuoteTotals(
        itemsWithTotals,
        data.taxRate ?? Number(quote.taxRate),
        (data.discountType ?? quote.discountType) as DiscountType | null,
        data.discountValue ?? Number(quote.discountValue)
      );

      updateData = {
        ...updateData,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        total: totals.total,
      };

      // Delete existing items and create new ones
      await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
      await prisma.quoteItem.createMany({
        data: itemsWithTotals.map((item) => ({
          quoteId: id,
          sortOrder: item.sortOrder,
          itemType: item.itemType,
          name: item.name,
          description: item.description,
          sku: item.sku,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discountType: item.discountType as DiscountType | null,
          discountValue: item.discountValue || 0,
          discountAmount: item.discountAmount,
          taxRate: item.taxRate || 0,
          taxAmount: item.taxAmount,
          subtotal: item.subtotal,
          total: item.total,
          notes: item.notes,
        })),
      });

      delete updateData.items;
    }

    // Handle date conversions
    if (data.validFrom) {
      updateData.validFrom = new Date(data.validFrom);
    }
    if (data.validUntil) {
      updateData.validUntil = new Date(data.validUntil);
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        ...updateData,
        activities: {
          create: {
            action: 'UPDATED',
            description: 'Quote updated',
            performedById: userId,
          },
        },
      },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return updated;
  }

  // Send quote to customer
  async send(id: string, userId: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (!['DRAFT', 'PENDING_REVIEW'].includes(quote.status)) {
      throw new Error('Quote has already been sent');
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentById: userId,
        activities: {
          create: {
            action: 'SENT',
            description: 'Quote sent to customer',
            performedById: userId,
          },
        },
      },
    });

    // TODO: Send email to customer

    return updated;
  }

  // Mark quote as viewed
  async markAsViewed(id: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status === 'SENT') {
      await prisma.quote.update({
        where: { id },
        data: {
          status: 'VIEWED',
          activities: {
            create: {
              action: 'VIEWED',
              description: 'Quote viewed by customer',
            },
          },
        },
      });
    }
  }

  // Record customer response
  async recordCustomerResponse(id: string, data: CustomerResponseInput, userId?: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new Error('Quote not found');
    }

    // Map customer response to quote status
    let newStatus: QuoteStatus = quote.status;
    if (data.response === 'ACCEPTED') {
      newStatus = 'ACCEPTED';
    } else if (data.response === 'REJECTED') {
      newStatus = 'REJECTED';
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: newStatus,
        customerResponse: data.response,
        responseNotes: data.notes,
        respondedAt: new Date(),
        ...(data.response === 'REJECTED' && { rejectedAt: new Date() }),
        activities: {
          create: {
            action: `CUSTOMER_${data.response}`,
            description: `Customer ${data.response.toLowerCase()} the quote`,
            metadata: { notes: data.notes },
            performedById: userId,
          },
        },
      },
    });

    return updated;
  }

  // Create a revision (new version)
  async createRevision(id: string, data: CreateRevisionInput, userId: string) {
    const originalQuote = await prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!originalQuote) {
      throw new Error('Quote not found');
    }

    // Mark original as revised
    await prisma.quote.update({
      where: { id },
      data: {
        status: 'REVISED',
        isLatestVersion: false,
      },
    });

    // Calculate new version number
    const newVersion = originalQuote.version + 1;

    // Use same quote number with version suffix or generate new one
    const quoteNo = `${originalQuote.quoteNo}-V${newVersion}`;

    // Prepare items
    const items = data.items || originalQuote.items.map((item) => ({
      sortOrder: item.sortOrder,
      itemType: item.itemType as any,
      name: item.name,
      description: item.description || undefined,
      sku: item.sku || undefined,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      discountType: item.discountType as any,
      discountValue: Number(item.discountValue),
      taxRate: Number(item.taxRate),
      notes: item.notes || undefined,
    }));

    const itemsWithTotals = items.map((item, index) => ({
      ...item,
      sortOrder: item.sortOrder ?? index,
      ...this.calculateItemTotals(item),
    }));

    const totals = this.calculateQuoteTotals(
      itemsWithTotals,
      data.taxRate ?? Number(originalQuote.taxRate),
      (data.discountType ?? originalQuote.discountType) as DiscountType | null,
      data.discountValue ?? Number(originalQuote.discountValue)
    );

    // Create new revision
    const revision = await prisma.quote.create({
      data: {
        quoteNo,
        customerId: originalQuote.customerId,
        unitId: originalQuote.unitId,
        propertyId: originalQuote.propertyId,
        serviceRequestId: originalQuote.serviceRequestId,
        version: newVersion,
        parentQuoteId: originalQuote.parentQuoteId || originalQuote.id,
        isLatestVersion: true,
        title: data.title || originalQuote.title,
        description: data.description || originalQuote.description,
        status: 'DRAFT',
        subtotal: totals.subtotal,
        taxRate: data.taxRate ?? Number(originalQuote.taxRate),
        taxAmount: totals.taxAmount,
        discountType: (data.discountType ?? originalQuote.discountType) as DiscountType | null,
        discountValue: data.discountValue ?? Number(originalQuote.discountValue),
        discountAmount: totals.discountAmount,
        total: totals.total,
        currency: originalQuote.currency,
        validFrom: new Date(),
        validUntil: new Date(data.validUntil),
        terms: data.terms || originalQuote.terms,
        notes: data.notes || originalQuote.notes,
        internalNotes: data.internalNotes || originalQuote.internalNotes,
        createdById: userId,
        items: {
          create: itemsWithTotals.map((item) => ({
            sortOrder: item.sortOrder,
            itemType: item.itemType,
            name: item.name,
            description: item.description,
            sku: item.sku,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discountType: item.discountType as DiscountType | null,
            discountValue: item.discountValue || 0,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate || 0,
            taxAmount: item.taxAmount,
            subtotal: item.subtotal,
            total: item.total,
            notes: item.notes,
          })),
        },
        activities: {
          create: {
            action: 'REVISION_CREATED',
            description: `Revision ${newVersion} created${data.revisionReason ? `: ${data.revisionReason}` : ''}`,
            metadata: { previousVersion: originalQuote.version, reason: data.revisionReason },
            performedById: userId,
          },
        },
      },
      include: {
        customer: true,
        items: { orderBy: { sortOrder: 'asc' } },
      },
    });

    // Add activity to original quote
    await prisma.quoteActivity.create({
      data: {
        quoteId: id,
        action: 'SUPERSEDED',
        description: `Superseded by revision ${newVersion}`,
        metadata: { newQuoteId: revision.id },
        performedById: userId,
      },
    });

    return revision;
  }

  // Convert accepted quote to invoice
  async convertToInvoice(id: string, data: ConvertToInvoiceInput, userId: string) {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'ACCEPTED') {
      throw new Error('Only accepted quotes can be converted to invoices');
    }

    // Generate invoice number
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const lastInvoice = await prisma.invoice.findFirst({
      where: { invoiceNo: { startsWith: prefix } },
      orderBy: { invoiceNo: 'desc' },
    });
    let nextNumber = 1;
    if (lastInvoice) {
      const lastNumber = parseInt(lastInvoice.invoiceNo.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }
    const invoiceNo = `${prefix}${nextNumber.toString().padStart(4, '0')}`;

    // Create invoice - Note: This requires a serviceRequestId which we may not have
    // For standalone quotes, we need to handle this differently
    // For now, we'll throw an error if no service request is linked
    if (!quote.serviceRequestId) {
      throw new Error('Quote must be linked to a service request to convert to invoice');
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        serviceRequestId: quote.serviceRequestId,
        customerId: quote.customerId,
        status: 'DRAFT',
        subtotal: Number(quote.subtotal),
        taxAmount: Number(quote.taxAmount),
        discountAmount: Number(quote.discountAmount),
        total: Number(quote.total),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes || quote.notes,
        createdBy: userId,
        items: {
          create: quote.items.map((item) => ({
            itemType: item.itemType === 'SERVICE' ? 'SERVICE' :
                      item.itemType === 'LABOR' ? 'LABOR' :
                      item.itemType === 'MATERIAL' ? 'MATERIAL' : 'SERVICE',
            description: `${item.name}${item.description ? ` - ${item.description}` : ''}`,
            quantity: Math.round(Number(item.quantity)),
            unitPrice: Number(item.unitPrice),
            total: Number(item.total),
          })),
        },
      },
    });

    // Update quote status
    await prisma.quote.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedToInvoiceId: invoice.id,
        convertedAt: new Date(),
        activities: {
          create: {
            action: 'CONVERTED_TO_INVOICE',
            description: `Converted to invoice ${invoice.invoiceNo}`,
            metadata: { invoiceId: invoice.id },
            performedById: userId,
          },
        },
      },
    });

    return invoice;
  }

  // Cancel quote
  async cancel(id: string, userId: string, reason?: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (['CONVERTED', 'CANCELLED'].includes(quote.status)) {
      throw new Error('Quote cannot be cancelled');
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        activities: {
          create: {
            action: 'CANCELLED',
            description: reason ? `Cancelled: ${reason}` : 'Quote cancelled',
            performedById: userId,
          },
        },
      },
    });

    return updated;
  }

  // Delete quote (only DRAFT)
  async delete(id: string) {
    const quote = await prisma.quote.findUnique({ where: { id } });

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.status !== 'DRAFT') {
      throw new Error('Only draft quotes can be deleted');
    }

    await prisma.quote.delete({ where: { id } });
  }

  // Get quote statistics
  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalQuotes,
      draftQuotes,
      sentQuotes,
      acceptedQuotes,
      rejectedQuotes,
      expiredQuotes,
      convertedQuotes,
      totalValue,
      acceptedValue,
      recentQuotes,
    ] = await Promise.all([
      prisma.quote.count({ where: { isLatestVersion: true } }),
      prisma.quote.count({ where: { status: 'DRAFT', isLatestVersion: true } }),
      prisma.quote.count({ where: { status: 'SENT', isLatestVersion: true } }),
      prisma.quote.count({ where: { status: 'ACCEPTED', isLatestVersion: true } }),
      prisma.quote.count({ where: { status: 'REJECTED', isLatestVersion: true } }),
      prisma.quote.count({ where: { status: 'EXPIRED', isLatestVersion: true } }),
      prisma.quote.count({ where: { status: 'CONVERTED', isLatestVersion: true } }),
      prisma.quote.aggregate({
        where: { isLatestVersion: true },
        _sum: { total: true },
      }),
      prisma.quote.aggregate({
        where: { status: 'ACCEPTED', isLatestVersion: true },
        _sum: { total: true },
      }),
      prisma.quote.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          isLatestVersion: true,
        },
      }),
    ]);

    // Calculate conversion rate
    const totalWithResponse = acceptedQuotes + rejectedQuotes;
    const conversionRate = totalWithResponse > 0
      ? (acceptedQuotes / totalWithResponse) * 100
      : 0;

    return {
      totalQuotes,
      draftQuotes,
      sentQuotes,
      acceptedQuotes,
      rejectedQuotes,
      expiredQuotes,
      convertedQuotes,
      totalValue: totalValue._sum.total || 0,
      acceptedValue: acceptedValue._sum.total || 0,
      recentQuotes,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  // Get version history
  async getVersionHistory(quoteNo: string) {
    // Get base quote number without version suffix
    const baseQuoteNo = quoteNo.split('-V')[0];

    const versions = await prisma.quote.findMany({
      where: {
        OR: [
          { quoteNo: baseQuoteNo },
          { quoteNo: { startsWith: `${baseQuoteNo}-V` } },
        ],
      },
      orderBy: { version: 'asc' },
      select: {
        id: true,
        quoteNo: true,
        version: true,
        status: true,
        total: true,
        createdAt: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return versions;
  }

  // Check and expire quotes
  async expireOverdueQuotes() {
    const now = new Date();

    const expired = await prisma.quote.updateMany({
      where: {
        status: { in: ['SENT', 'VIEWED'] },
        validUntil: { lt: now },
        isLatestVersion: true,
      },
      data: { status: 'EXPIRED' },
    });

    return expired.count;
  }
}
