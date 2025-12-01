import { prisma } from '../../config/database.js';
import {
  DateRangeQuery,
  ServiceRequestReportQuery,
  RevenueReportQuery,
  EmployeeReportQuery,
} from './report.schema.js';

export class ReportService {
  private getDateRange(query: DateRangeQuery) {
    const now = new Date();
    let fromDate: Date;
    let toDate = new Date(now);
    toDate.setHours(23, 59, 59, 999);

    switch (query.period) {
      case 'today':
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - 7);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - 1);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - 3);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'year':
        fromDate = new Date(now);
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case 'custom':
      default:
        fromDate = query.fromDate ? new Date(query.fromDate) : new Date(now.setMonth(now.getMonth() - 1));
        if (query.toDate) {
          toDate = new Date(query.toDate);
          toDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    return { fromDate, toDate };
  }

  // Dashboard Summary
  async getDashboardSummary(query: DateRangeQuery) {
    const { fromDate, toDate } = this.getDateRange(query);

    const [
      serviceRequests,
      invoices,
      payments,
      customers,
      employees,
      amcContracts,
    ] = await Promise.all([
      // Service requests stats
      prisma.serviceRequest.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        _count: true,
      }),
      // Invoice stats
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Payment stats
      prisma.payment.aggregate({
        where: {
          receivedAt: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Customer stats
      prisma.customer.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
      }),
      // Active employees
      prisma.employee.count({
        where: { isActive: true },
      }),
      // Active AMC contracts
      prisma.amcContract.count({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const srByStatus = serviceRequests.reduce((acc, item) => {
      acc[item.status] = item._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: { from: fromDate, to: toDate },
      serviceRequests: {
        total: Object.values(srByStatus).reduce((a, b) => a + b, 0),
        byStatus: srByStatus,
      },
      invoices: {
        count: invoices._count,
        total: invoices._sum.total?.toNumber() || 0,
      },
      collections: {
        count: payments._count,
        total: payments._sum.amount?.toNumber() || 0,
      },
      newCustomers: customers,
      activeEmployees: employees,
      activeAmcContracts: amcContracts,
    };
  }

  // Service Request Report
  async getServiceRequestReport(query: ServiceRequestReportQuery) {
    const { fromDate, toDate } = this.getDateRange(query);

    const baseWhere = {
      createdAt: { gte: fromDate, lte: toDate },
    };

    const [total, byStatus, byType, trend, recentRequests] = await Promise.all([
      prisma.serviceRequest.count({ where: baseWhere }),
      prisma.serviceRequest.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: true,
      }),
      prisma.serviceRequest.groupBy({
        by: ['type'],
        where: baseWhere,
        _count: true,
      }),
      prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count,
          status
        FROM fixitbh_ac.service_requests
        WHERE created_at >= ${fromDate} AND created_at <= ${toDate}
        GROUP BY DATE(created_at), status
        ORDER BY date DESC
        LIMIT 30
      `,
      prisma.serviceRequest.findMany({
        where: baseWhere,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { firstName: true, lastName: true, orgName: true },
          },
          assignedTo: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
    ]);

    return {
      period: { from: fromDate, to: toDate },
      total,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      trend,
      recentRequests,
    };
  }

  // Revenue Report
  async getRevenueReport(query: RevenueReportQuery) {
    const { fromDate, toDate } = this.getDateRange(query);

    const [
      totalInvoiced,
      totalCollected,
      invoicesByStatus,
      collectionsByMethod,
      revenueTrend,
      topCustomers,
    ] = await Promise.all([
      // Total invoiced
      prisma.invoice.aggregate({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Total collected
      prisma.payment.aggregate({
        where: {
          receivedAt: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Invoices by status
      prisma.invoice.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        _sum: { total: true },
        _count: true,
      }),
      // Collections by method
      prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: {
          receivedAt: { gte: fromDate, lte: toDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      // Revenue trend (daily for last 30 days)
      prisma.$queryRaw`
        SELECT
          DATE(received_at) as date,
          SUM(amount) as amount,
          COUNT(*) as count
        FROM fixitbh_ac.payments
        WHERE received_at >= ${fromDate} AND received_at <= ${toDate}
        GROUP BY DATE(received_at)
        ORDER BY date DESC
      `,
      // Top customers by revenue
      prisma.$queryRaw`
        SELECT
          c.id,
          c.first_name,
          c.last_name,
          c.org_name,
          SUM(p.amount) as total_paid,
          COUNT(DISTINCT p.id) as payment_count
        FROM fixitbh_ac.payments p
        JOIN fixitbh_ac.invoices i ON p.invoice_id = i.id
        JOIN fixitbh_ac.customers c ON i.customer_id = c.id
        WHERE p.received_at >= ${fromDate} AND p.received_at <= ${toDate}
        GROUP BY c.id, c.first_name, c.last_name, c.org_name
        ORDER BY total_paid DESC
        LIMIT 10
      `,
    ]);

    return {
      period: { from: fromDate, to: toDate },
      summary: {
        totalInvoiced: totalInvoiced._sum.total?.toNumber() || 0,
        invoiceCount: totalInvoiced._count,
        totalCollected: totalCollected._sum.amount?.toNumber() || 0,
        paymentCount: totalCollected._count,
        collectionRate: totalInvoiced._sum.total?.toNumber()
          ? ((totalCollected._sum.amount?.toNumber() || 0) / totalInvoiced._sum.total.toNumber()) * 100
          : 0,
      },
      invoicesByStatus: invoicesByStatus.map((s) => ({
        status: s.status,
        amount: s._sum.total?.toNumber() || 0,
        count: s._count,
      })),
      collectionsByMethod: collectionsByMethod.map((m) => ({
        method: m.paymentMethod,
        amount: m._sum.amount?.toNumber() || 0,
        count: m._count,
      })),
      trend: revenueTrend,
      topCustomers,
    };
  }

  // AMC Report
  async getAmcReport(query: DateRangeQuery) {
    const { fromDate, toDate } = this.getDateRange(query);

    const [
      contractsByStatus,
      upcomingVisits,
      completedVisits,
      overdueVisits,
      revenueFromAmc,
    ] = await Promise.all([
      // Contracts by status
      prisma.amcContract.groupBy({
        by: ['status'],
        _count: true,
        _sum: { totalAmount: true },
      }),
      // Upcoming visits (next 30 days)
      prisma.amcSchedule.count({
        where: {
          scheduledDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      // Completed visits in period
      prisma.amcSchedule.count({
        where: {
          completedAt: { gte: fromDate, lte: toDate },
          status: 'COMPLETED',
        },
      }),
      // Overdue visits
      prisma.amcSchedule.count({
        where: {
          scheduledDate: { lt: new Date() },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
      // Revenue from AMC
      prisma.amcPayment.aggregate({
        where: {
          paidAt: { gte: fromDate, lte: toDate },
          status: 'PAID',
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      period: { from: fromDate, to: toDate },
      contracts: {
        byStatus: contractsByStatus.map((c) => ({
          status: c.status,
          count: c._count,
          value: c._sum.totalAmount?.toNumber() || 0,
        })),
        total: contractsByStatus.reduce((acc, c) => acc + c._count, 0),
        totalValue: contractsByStatus.reduce((acc, c) => acc + (c._sum.totalAmount?.toNumber() || 0), 0),
      },
      visits: {
        upcoming: upcomingVisits,
        completed: completedVisits,
        overdue: overdueVisits,
      },
      revenue: {
        total: revenueFromAmc._sum.amount?.toNumber() || 0,
        paymentCount: revenueFromAmc._count,
      },
    };
  }

  // Employee Performance Report
  async getEmployeeReport(query: EmployeeReportQuery) {
    const { fromDate, toDate } = this.getDateRange(query);

    const where: any = {
      completedAt: { gte: fromDate, lte: toDate },
      status: 'COMPLETED',
    };

    if (query.employeeId) {
      where.assignedToId = query.employeeId;
    }

    const [performanceByEmployee, totalCompleted] = await Promise.all([
      prisma.serviceRequest.groupBy({
        by: ['assignedToId'],
        where,
        _count: true,
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    // Get employee details
    const employeeIds = performanceByEmployee.map((p) => p.assignedToId).filter(Boolean) as string[];
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNo: true,
      },
    });

    const employeeMap = new Map(employees.map((e) => [e.id, e]));

    return {
      period: { from: fromDate, to: toDate },
      totalCompleted,
      byEmployee: performanceByEmployee
        .filter((p) => p.assignedToId)
        .map((p) => {
          const emp = employeeMap.get(p.assignedToId!);
          return {
            employeeId: p.assignedToId,
            name: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
            employeeNo: emp?.employeeNo,
            completedJobs: p._count,
          };
        })
        .sort((a, b) => b.completedJobs - a.completedJobs),
    };
  }

  // Customer Report
  async getCustomerReport(query: DateRangeQuery) {
    const { fromDate, toDate } = this.getDateRange(query);

    const [
      newCustomers,
      activeCustomers,
      customersByType,
      topCustomersByRequests,
    ] = await Promise.all([
      // New customers in period
      prisma.customer.count({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
      }),
      // Active customers (with service requests in period)
      prisma.serviceRequest.findMany({
        where: {
          createdAt: { gte: fromDate, lte: toDate },
        },
        select: { customerId: true },
        distinct: ['customerId'],
      }),
      // Customers by type
      prisma.customer.groupBy({
        by: ['type'],
        _count: true,
      }),
      // Top customers by request count
      prisma.$queryRaw`
        SELECT
          c.id,
          c.first_name,
          c.last_name,
          c.org_name,
          c.type,
          COUNT(sr.id) as request_count
        FROM fixitbh_ac.customers c
        LEFT JOIN fixitbh_ac.service_requests sr ON c.id = sr.customer_id
          AND sr.created_at >= ${fromDate} AND sr.created_at <= ${toDate}
        GROUP BY c.id, c.first_name, c.last_name, c.org_name, c.type
        HAVING COUNT(sr.id) > 0
        ORDER BY request_count DESC
        LIMIT 10
      `,
    ]);

    return {
      period: { from: fromDate, to: toDate },
      newCustomers,
      activeCustomers: activeCustomers.length,
      byType: customersByType.map((c) => ({
        type: c.type,
        count: c._count,
      })),
      topCustomers: topCustomersByRequests,
    };
  }
}
