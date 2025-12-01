import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  ListCollectionsQuery,
  UpdateCollectionInput,
  VoidCollectionInput,
  CollectionDailyReportQuery,
} from './collection.schema.js';

export class CollectionService {
  async findAll(query: ListCollectionsQuery) {
    const { search, paymentMethod, customerId, fromDate, toDate, receivedBy } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { paymentNo: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { invoice: { invoiceNo: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (receivedBy) where.receivedBy = receivedBy;

    if (customerId) {
      where.invoice = { customerId };
    }

    if (fromDate || toDate) {
      where.receivedAt = {};
      if (fromDate) where.receivedAt.gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        where.receivedAt.lte = endDate;
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          invoice: {
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  orgName: true,
                  phone: true,
                },
              },
            },
          },
          receipt: {
            select: {
              id: true,
              receiptNo: true,
            },
          },
        },
        orderBy: { receivedAt: 'desc' },
      }),
      prisma.payment.count({ where }),
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

  async findById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            customer: true,
            serviceRequest: true,
          },
        },
        receipt: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  async update(id: string, input: UpdateCollectionInput) {
    const existing = await prisma.payment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Payment not found');
    }

    const dataToUpdate: any = {};
    if (input.reference !== undefined) dataToUpdate.reference = input.reference;
    if (input.notes !== undefined) dataToUpdate.notes = input.notes;

    return prisma.payment.update({
      where: { id },
      data: dataToUpdate,
      include: {
        invoice: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                orgName: true,
              },
            },
          },
        },
      },
    });
  }

  async void(id: string, input: VoidCollectionInput, userId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        receipt: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.receipt) {
      throw new BadRequestError('Cannot void payment with associated receipt. Void the receipt first.');
    }

    // Update invoice paid amount and status
    const newPaidAmount = payment.invoice.paidAmount?.toNumber() ?? 0 - payment.amount.toNumber();
    let newStatus = payment.invoice.status;

    if (newPaidAmount <= 0) {
      newStatus = 'SENT';
    } else if (newPaidAmount < payment.invoice.total.toNumber()) {
      newStatus = 'PARTIAL';
    }

    await prisma.$transaction([
      // Update invoice
      prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount < 0 ? 0 : newPaidAmount,
          status: newStatus,
          paidAt: newPaidAmount >= payment.invoice.total.toNumber() ? payment.invoice.paidAt : null,
        },
      }),
      // Delete the payment
      prisma.payment.delete({
        where: { id },
      }),
    ]);

    return { message: 'Payment voided successfully', reason: input.reason };
  }

  async getStats(fromDate?: string, toDate?: string) {
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.receivedAt = {};
      if (fromDate) dateFilter.receivedAt.gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.receivedAt.lte = endDate;
      }
    }

    const [total, byMethod, byDate, recentPayments] = await Promise.all([
      // Total collected
      prisma.payment.aggregate({
        where: dateFilter,
        _sum: { amount: true },
        _count: true,
      }),
      // By payment method
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: dateFilter,
        _sum: { amount: true },
        _count: true,
      }),
      // Last 7 days collection trend
      prisma.$queryRaw`
        SELECT
          DATE(received_at) as date,
          SUM(amount) as total,
          COUNT(*) as count
        FROM fixitbh_ac.payments
        WHERE received_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(received_at)
        ORDER BY date DESC
      `,
      // Recent payments
      prisma.payment.findMany({
        where: dateFilter,
        take: 5,
        orderBy: { receivedAt: 'desc' },
        include: {
          invoice: {
            include: {
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                  orgName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      totalCollected: total._sum.amount?.toNumber() || 0,
      totalPayments: total._count || 0,
      byMethod: byMethod.map((m) => ({
        method: m.paymentMethod,
        amount: m._sum.amount?.toNumber() || 0,
        count: m._count,
      })),
      trend: byDate,
      recentPayments,
    };
  }

  async getDailyReport(query: CollectionDailyReportQuery) {
    const date = query.date ? new Date(query.date) : new Date();
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const where: any = {
      receivedAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (query.receivedBy) {
      where.receivedBy = query.receivedBy;
    }

    const [payments, summary] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          invoice: {
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  orgName: true,
                },
              },
            },
          },
        },
        orderBy: { receivedAt: 'asc' },
      }),
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalCollected = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalCollected,
      totalPayments: payments.length,
      byMethod: summary.map((s) => ({
        method: s.paymentMethod,
        amount: s._sum.amount?.toNumber() || 0,
        count: s._count,
      })),
      payments,
    };
  }

  async getCollectors() {
    // Get unique users who have received payments
    const collectors = await prisma.payment.findMany({
      select: {
        receivedBy: true,
      },
      distinct: ['receivedBy'],
    });

    // Get user details for each collector
    const userIds = collectors.map((c) => c.receivedBy);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        employee: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : u.email,
    }));
  }
}
