import { PrismaClient, Prisma, PaymentMethod } from '@prisma/client';
import {
  CreateReceiptInput,
  VoidReceiptInput,
  ReceiptQueryInput,
} from './receipt.schema.js';

const prisma = new PrismaClient();

export class ReceiptService {
  // Generate unique receipt number
  private async generateReceiptNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCP-${year}-`;

    const lastReceipt = await prisma.receipt.findFirst({
      where: { receiptNo: { startsWith: prefix } },
      orderBy: { receiptNo: 'desc' },
    });

    let nextNumber = 1;
    if (lastReceipt) {
      const lastNumber = parseInt(lastReceipt.receiptNo.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  // Create receipt
  async create(data: CreateReceiptInput, userId: string) {
    // Get invoice and customer details
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: {
        customer: true,
        payments: { where: { id: data.paymentId } },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Calculate previous payments and balance
    const previousPayments = await prisma.payment.findMany({
      where: {
        invoiceId: data.invoiceId,
        id: { not: data.paymentId }, // Exclude current payment if provided
      },
    });

    const previouslyPaid = previousPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const balanceAfter = Number(invoice.total) - previouslyPaid - data.amount;

    // Generate receipt number
    const receiptNo = await this.generateReceiptNo();

    // Prepare customer info
    const customer = invoice.customer;
    const customerName = customer.customerType === 'ORGANIZATION'
      ? customer.orgName || ''
      : `${customer.firstName || ''} ${customer.lastName || ''}`.trim();

    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        invoiceId: data.invoiceId,
        paymentId: data.paymentId || null,
        customerId: invoice.customerId,
        customerName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        amount: data.amount,
        paymentMethod: data.paymentMethod as PaymentMethod,
        paymentDate: new Date(data.paymentDate),
        paymentReference: data.paymentReference,
        invoiceTotal: Number(invoice.total),
        previouslyPaid,
        balanceAfter,
        description: data.description,
        notes: data.notes,
        createdById: userId,
      },
      include: {
        invoice: true,
        customer: true,
        payment: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return receipt;
  }

  // Generate receipt from payment
  async generateFromPayment(paymentId: string, userId: string) {
    // Check if receipt already exists for this payment
    const existingReceipt = await prisma.receipt.findUnique({
      where: { paymentId },
    });

    if (existingReceipt) {
      throw new Error('Receipt already exists for this payment');
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: {
          include: { customer: true },
        },
      },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    const invoice = payment.invoice;
    const customer = invoice.customer;

    // Calculate previous payments and balance
    const previousPayments = await prisma.payment.findMany({
      where: {
        invoiceId: invoice.id,
        receivedAt: { lt: payment.receivedAt },
      },
    });

    const previouslyPaid = previousPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    const balanceAfter = Number(invoice.total) - previouslyPaid - Number(payment.amount);

    // Generate receipt number
    const receiptNo = await this.generateReceiptNo();

    // Prepare customer info
    const customerName = customer.customerType === 'ORGANIZATION'
      ? customer.orgName || ''
      : `${customer.firstName || ''} ${customer.lastName || ''}`.trim();

    const receipt = await prisma.receipt.create({
      data: {
        receiptNo,
        invoiceId: invoice.id,
        paymentId: payment.id,
        customerId: customer.id,
        customerName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.receivedAt,
        paymentReference: payment.reference,
        invoiceTotal: Number(invoice.total),
        previouslyPaid,
        balanceAfter,
        description: `Payment for Invoice ${invoice.invoiceNo}`,
        notes: payment.notes,
        createdById: userId,
      },
      include: {
        invoice: true,
        customer: true,
        payment: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return receipt;
  }

  // Get all receipts with filtering
  async getAll(query: ReceiptQueryInput) {
    const {
      page,
      limit,
      search,
      invoiceId,
      customerId,
      paymentMethod,
      fromDate,
      toDate,
      isVoided,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.ReceiptWhereInput = {
      ...(invoiceId && { invoiceId }),
      ...(customerId && { customerId }),
      ...(paymentMethod && { paymentMethod }),
      ...(isVoided !== undefined && { isVoided }),
      ...(search && {
        OR: [
          { receiptNo: { contains: search, mode: 'insensitive' } },
          { customerName: { contains: search, mode: 'insensitive' } },
          { invoice: { invoiceNo: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(fromDate && { paymentDate: { gte: new Date(fromDate) } }),
      ...(toDate && { paymentDate: { lte: new Date(toDate) } }),
    };

    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          invoice: true,
          customer: true,
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ]);

    return {
      data: receipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get receipt by ID
  async getById(id: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            items: true,
            serviceRequest: true,
          },
        },
        customer: true,
        payment: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        voidedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return receipt;
  }

  // Get receipt by number
  async getByReceiptNo(receiptNo: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { receiptNo },
      include: {
        invoice: {
          include: {
            items: true,
            serviceRequest: true,
          },
        },
        customer: true,
        payment: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        voidedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return receipt;
  }

  // Void receipt
  async void(id: string, data: VoidReceiptInput, userId: string) {
    const receipt = await prisma.receipt.findUnique({ where: { id } });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    if (receipt.isVoided) {
      throw new Error('Receipt is already voided');
    }

    const updated = await prisma.receipt.update({
      where: { id },
      data: {
        isVoided: true,
        voidedAt: new Date(),
        voidedById: userId,
        voidReason: data.reason,
      },
      include: {
        invoice: true,
        customer: true,
      },
    });

    return updated;
  }

  // Record print
  async recordPrint(id: string) {
    const receipt = await prisma.receipt.findUnique({ where: { id } });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    await prisma.receipt.update({
      where: { id },
      data: {
        printedAt: new Date(),
        printCount: { increment: 1 },
      },
    });
  }

  // Record email
  async recordEmail(id: string) {
    const receipt = await prisma.receipt.findUnique({ where: { id } });

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    await prisma.receipt.update({
      where: { id },
      data: {
        emailedAt: new Date(),
      },
    });

    // TODO: Send actual email
  }

  // Get receipts for invoice
  async getByInvoice(invoiceId: string) {
    const receipts = await prisma.receipt.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return receipts;
  }

  // Get receipts for customer
  async getByCustomer(customerId: string) {
    const receipts = await prisma.receipt.findMany({
      where: { customerId },
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return receipts;
  }

  // Get statistics
  async getStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalReceipts,
      voidedReceipts,
      totalAmount,
      monthlyAmount,
      recentReceipts,
      byPaymentMethod,
    ] = await Promise.all([
      prisma.receipt.count({ where: { isVoided: false } }),
      prisma.receipt.count({ where: { isVoided: true } }),
      prisma.receipt.aggregate({
        where: { isVoided: false },
        _sum: { amount: true },
      }),
      prisma.receipt.aggregate({
        where: {
          isVoided: false,
          paymentDate: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.receipt.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          isVoided: false,
        },
      }),
      prisma.receipt.groupBy({
        by: ['paymentMethod'],
        where: { isVoided: false },
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return {
      totalReceipts,
      voidedReceipts,
      totalAmount: totalAmount._sum.amount || 0,
      monthlyAmount: monthlyAmount._sum.amount || 0,
      recentReceipts,
      byPaymentMethod: byPaymentMethod.map((pm) => ({
        method: pm.paymentMethod,
        count: pm._count,
        amount: pm._sum.amount || 0,
      })),
    };
  }
}
