import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  RecordPaymentInput,
} from './invoice.schema.js';

function generateInvoiceNo(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

function generatePaymentNo(): string {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `PAY-${random}`;
}

export class InvoiceService {
  async create(input: CreateInvoiceInput, userId: string) {
    const { items, ...invoiceData } = input;

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

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 0.05; // 5% VAT
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    if (!input.serviceRequestId) {
      throw new BadRequestError('Service request ID is required');
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo: generateInvoiceNo(),
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

  async findAll(query: ListInvoicesQuery) {
    const { search, status, customerId, fromDate, toDate } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

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

    // If items are being updated, recalculate totals
    let totals: any = {};
    if (items && items.length > 0) {
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const taxRate = 0.05;
      const taxAmount = subtotal * taxRate;
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

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        paymentNo: generatePaymentNo(),
        invoiceId: id,
        amount: input.amount,
        paymentMethod: input.paymentMethod as any,
        reference: input.reference,
        notes: input.notes,
        receivedBy: userId,
      },
    });

    // Update invoice status if fully paid
    const newTotalPaid = totalPaid + input.amount;
    if (newTotalPaid >= invoice.total.toNumber()) {
      await prisma.invoice.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          paidAmount: newTotalPaid,
        },
      });
    } else {
      await prisma.invoice.update({
        where: { id },
        data: {
          status: 'PARTIAL',
          paidAmount: newTotalPaid,
        },
      });
    }

    return payment;
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

  async getStats() {
    const [total, byStatus, revenue] = await Promise.all([
      prisma.invoice.count(),
      prisma.invoice.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: { status: 'PAID' },
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
