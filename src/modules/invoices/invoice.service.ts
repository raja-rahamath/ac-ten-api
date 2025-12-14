import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  RecordPaymentInput,
} from './invoice.schema.js';

// Get company settings (primary company)
async function getCompanySettings() {
  const company = await prisma.company.findFirst({
    where: { isPrimary: true },
  });

  return {
    vatRate: company?.vatRate ? Number(company.vatRate) / 100 : 0.10, // Default 10%
    vatEnabled: company?.vatEnabled ?? true,
    invoiceNoFormat: company?.invoiceNoFormat ?? 'INV-YYYY-NNNNN',
    invoiceNoSequence: company?.invoiceNoSequence ?? 0,
    receiptNoFormat: company?.receiptNoFormat ?? 'RCP-YYYY-NNNNN',
    receiptNoSequence: company?.receiptNoSequence ?? 0,
    paymentNoFormat: company?.paymentNoFormat ?? 'PAY-YYYY-NNNNN',
    paymentNoSequence: company?.paymentNoSequence ?? 0,
    maxDiscountPercent: company?.maxDiscountPercent ? Number(company.maxDiscountPercent) : 10,
    companyId: company?.id,
  };
}

// Generate document number from format pattern
async function generateDocumentNo(type: 'invoice' | 'receipt' | 'payment'): Promise<string> {
  const company = await prisma.company.findFirst({
    where: { isPrimary: true },
  });

  if (!company) {
    // Fallback to simple generation
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const prefix = type === 'invoice' ? 'INV' : type === 'receipt' ? 'RCP' : 'PAY';
    return `${prefix}-${year}-${random}`;
  }

  const formatField = type === 'invoice' ? 'invoiceNoFormat' : type === 'receipt' ? 'receiptNoFormat' : 'paymentNoFormat';
  const sequenceField = type === 'invoice' ? 'invoiceNoSequence' : type === 'receipt' ? 'receiptNoSequence' : 'paymentNoSequence';

  const format = (company as any)[formatField] as string;
  const currentSequence = (company as any)[sequenceField] as number;

  const newSequence = currentSequence + 1;
  const year = new Date().getFullYear().toString();

  // Replace YYYY with year and NNNNN with padded sequence
  let documentNo = format.replace('YYYY', year);
  const match = documentNo.match(/N+/);
  if (match) {
    const padding = match[0].length;
    documentNo = documentNo.replace(/N+/, newSequence.toString().padStart(padding, '0'));
  }

  // Update the sequence
  await prisma.company.update({
    where: { id: company.id },
    data: { [sequenceField]: newSequence },
  });

  return documentNo;
}

function generatePaymentNo(): string {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `PAY-${random}`;
}

export class InvoiceService {
  async create(input: CreateInvoiceInput, userId: string) {
    const { items, ...invoiceData } = input;
    const settings = await getCompanySettings();

    // Validate customer
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Validate service request if provided
    if (input.serviceRequestId) {
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: input.serviceRequestId },
      });
      if (!serviceRequest) {
        throw new NotFoundError('Service request not found');
      }
      // Check if invoice already exists for this service request
      const existingInvoice = await prisma.invoice.findUnique({
        where: { serviceRequestId: input.serviceRequestId },
      });
      if (existingInvoice) {
        throw new BadRequestError('Invoice already exists for this service request');
      }
    }

    // Calculate totals with configurable VAT
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = settings.vatEnabled ? subtotal * settings.vatRate : 0;
    const total = subtotal + taxAmount;

    if (!input.serviceRequestId) {
      throw new BadRequestError('Service request ID is required');
    }

    // Generate invoice number from settings
    const invoiceNo = await generateDocumentNo('invoice');

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        customerId: invoiceData.customerId,
        serviceRequestId: input.serviceRequestId,
        dueDate: new Date(invoiceData.dueDate),
        notes: invoiceData.notes,
        subtotal,
        taxAmount,
        total,
        status: 'DRAFT',
        createdBy: userId,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
      },
    });

    return invoice;
  }

  // Generate invoice from completed service request with all materials
  async createFromServiceRequest(serviceRequestId: string, userId: string, additionalItems?: { description: string; quantity: number; unitPrice: number }[], discountPercent?: number) {
    const settings = await getCompanySettings();

    // Get service request with all related data
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: serviceRequestId },
      include: {
        customer: true,
        materialUsage: {
          include: {
            item: {
              select: { name: true, itemNo: true },
            },
          },
        },
        siteVisits: {
          where: { status: 'COMPLETED' },
          include: {
            materialUsage: {
              include: {
                item: {
                  select: { name: true, itemNo: true },
                },
              },
            },
          },
        },
        complaintType: true,
      },
    });

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    if (!['COMPLETED', 'SITE_VISIT_COMPLETED'].includes(serviceRequest.status)) {
      throw new BadRequestError('Service request must be completed before generating invoice');
    }

    // Check if active invoice already exists (exclude cancelled invoices)
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        serviceRequestId,
        status: { not: 'CANCELLED' },
      },
    });
    if (existingInvoice) {
      throw new BadRequestError('Invoice already exists for this service request');
    }

    // Collect all material usage (from request and all completed site visits)
    const allMaterials = [
      ...serviceRequest.materialUsage,
      ...serviceRequest.siteVisits.flatMap((sv: any) => sv.materialUsage || []),
    ];

    // Build invoice items
    const invoiceItems: { description: string; quantity: number; unitPrice: number; total: number; itemType: string }[] = [];

    // Add service charge based on complaint type
    if (serviceRequest.complaintType) {
      const serviceCharge = serviceRequest.complaintType.defaultServiceCharge
        ? Number(serviceRequest.complaintType.defaultServiceCharge)
        : 0;
      invoiceItems.push({
        description: `Service: ${serviceRequest.complaintType.name}`,
        quantity: 1,
        unitPrice: serviceCharge,
        total: serviceCharge,
        itemType: 'SERVICE',
      });
    }

    // Add materials
    for (const material of allMaterials) {
      const itemName = material.item?.name || material.itemName || 'Material';
      const itemNo = material.item?.itemNo || '';
      invoiceItems.push({
        description: itemNo ? `${itemName} (${itemNo})` : itemName,
        quantity: material.quantity,
        unitPrice: Number(material.unitPrice),
        total: Number(material.total),
        itemType: 'PART',
      });
    }

    // Add additional items (service charges, etc.)
    if (additionalItems) {
      for (const item of additionalItems) {
        invoiceItems.push({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          itemType: 'SERVICE',
        });
      }
    }

    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);

    // Apply discount if provided (validate max discount)
    let discountAmount = 0;
    if (discountPercent && discountPercent > 0) {
      if (discountPercent > settings.maxDiscountPercent) {
        throw new BadRequestError(`Discount cannot exceed ${settings.maxDiscountPercent}%`);
      }
      discountAmount = subtotal * (discountPercent / 100);
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = settings.vatEnabled ? subtotalAfterDiscount * settings.vatRate : 0;
    const total = subtotalAfterDiscount + taxAmount;

    // Generate invoice number
    const invoiceNo = await generateDocumentNo('invoice');

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        customerId: serviceRequest.customerId,
        serviceRequestId,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        status: 'DRAFT',
        createdBy: userId,
        items: {
          create: invoiceItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            itemType: item.itemType as any,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        serviceRequest: true,
      },
    });

    // Update service request status
    await prisma.serviceRequest.update({
      where: { id: serviceRequestId },
      data: { status: 'INVOICED' },
    });

    // Create timeline entry
    await prisma.requestTimeline.create({
      data: {
        serviceRequestId,
        action: 'INVOICE_GENERATED',
        description: `Invoice ${invoiceNo} generated for total ${total.toFixed(3)}`,
        performedBy: userId,
      },
    });

    return invoice;
  }

  async findById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        serviceRequest: true,
        items: true,
        payments: {
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    return invoice;
  }

  async findAll(query: ListInvoicesQuery, userContext?: { role: string; departmentId?: string }) {
    const { search, status, customerId, serviceRequestId, fromDate, toDate } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by service request ID if provided
    if (serviceRequestId) {
      where.serviceRequestId = serviceRequestId;
    }

    // Department filter for managers - filter by service request's complaint type department
    if (userContext?.role === 'manager' && userContext.departmentId) {
      where.serviceRequest = {
        complaintType: {
          departmentId: userContext.departmentId,
        },
      };
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          _count: {
            select: { items: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, input: UpdateInvoiceInput) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Invoice not found');
    }

    if (existing.status === 'PAID') {
      throw new BadRequestError('Cannot update a paid invoice');
    }

    const { items, ...updateData } = input;
    const settings = await getCompanySettings();

    // If items are being updated, recalculate totals
    let totals: any = {};
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxAmount = settings.vatEnabled ? subtotal * settings.vatRate : 0;
      totals = {
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
      };

      // Delete existing items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      await prisma.invoiceItem.createMany({
        data: items.map((item) => ({
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
      });
    }

    const dataToUpdate: any = { ...totals };
    if (updateData.status) dataToUpdate.status = updateData.status;
    if (updateData.dueDate) dataToUpdate.dueDate = new Date(updateData.dueDate);
    if (updateData.notes !== undefined) dataToUpdate.notes = updateData.notes;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: dataToUpdate,
      include: {
        customer: true,
        items: true,
      },
    });

    return invoice;
  }

  async recordPayment(id: string, input: RecordPaymentInput, userId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        payments: true,
        customer: true,
        serviceRequest: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    if (invoice.status === 'CANCELLED') {
      throw new BadRequestError('Cannot record payment for cancelled invoice');
    }

    // Calculate total paid
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
    const remaining = invoice.total.toNumber() - totalPaid;

    if (input.amount > remaining) {
      throw new BadRequestError(`Payment amount exceeds remaining balance of ${remaining}`);
    }

    // Generate payment number
    const paymentNo = await generateDocumentNo('payment');

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        paymentNo,
        invoiceId: id,
        amount: input.amount,
        paymentMethod: input.paymentMethod as any,
        reference: input.reference,
        notes: input.notes,
        receivedBy: userId,
      },
    });

    // Update invoice status and paid amount
    const newTotalPaid = totalPaid + input.amount;
    const isFullyPaid = newTotalPaid >= invoice.total.toNumber();

    await prisma.invoice.update({
      where: { id },
      data: {
        status: isFullyPaid ? 'PAID' : 'PARTIAL',
        paidAt: isFullyPaid ? new Date() : null,
        paidAmount: newTotalPaid,
      },
    });

    // Generate receipt for this payment
    const receiptNo = await generateDocumentNo('receipt');

    const customer = invoice.customer;
    const customerAddress = [
      customer.addressLine1,
      customer.addressLine2,
      customer.city,
      customer.state,
    ].filter(Boolean).join(', ');

    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        invoiceId: id,
        paymentId: payment.id,
        customerId: invoice.customerId,
        customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.orgName || 'Customer',
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress,
        amount: input.amount,
        paymentMethod: input.paymentMethod as any,
        paymentDate: new Date(),
        paymentReference: input.reference,
        invoiceTotal: invoice.total.toNumber(),
        previouslyPaid: totalPaid,
        balanceAfter: remaining - input.amount,
        createdBy: userId,
      },
    });

    // If service request exists, update its status and create timeline
    if (invoice.serviceRequestId && isFullyPaid) {
      await prisma.serviceRequest.update({
        where: { id: invoice.serviceRequestId },
        data: { status: 'PAID' },
      });

      await prisma.requestTimeline.create({
        data: {
          serviceRequestId: invoice.serviceRequestId,
          action: 'PAYMENT_RECEIVED',
          description: `Payment of ${input.amount} received via ${input.paymentMethod}. Receipt: ${receiptNo}`,
          performedBy: userId,
        },
      });
    }

    return { payment, receipt };
  }

  async delete(id: string) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Invoice not found');
    }

    if (existing.status === 'PAID') {
      throw new BadRequestError('Cannot delete a paid invoice');
    }

    await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Invoice cancelled successfully' };
  }

  async getStats(userContext?: { role: string; departmentId?: string }) {
    // Build department filter for managers
    const where: any = {};
    if (userContext?.role === 'manager' && userContext.departmentId) {
      where.serviceRequest = {
        complaintType: {
          departmentId: userContext.departmentId,
        },
      };
    }

    const [total, byStatus, revenue] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { ...where, status: 'PAID' },
        _sum: { total: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = {
          count: item._count,
          amount: item._sum.total?.toNumber() || 0,
        };
        return acc;
      }, {} as Record<string, { count: number; amount: number }>),
      totalRevenue: revenue._sum.total?.toNumber() || 0,
    };
  }
}
