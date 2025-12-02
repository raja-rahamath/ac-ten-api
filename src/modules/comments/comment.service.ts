import { PrismaClient, Prisma, CommentType } from '@prisma/client';
import {
  CreateCommentInput,
  UpdateCommentInput,
  CommentQueryInput,
  AddCallCommentInput,
} from './comment.schema.js';
import { emailService } from '../../services/email.service.js';
import { logger } from '../../config/logger.js';

const prisma = new PrismaClient();

export class CommentService {
  // Create comment
  async create(data: CreateCommentInput, userId?: string) {
    // Verify service request exists
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: data.serviceRequestId },
    });

    if (!serviceRequest) {
      throw new Error('Service request not found');
    }

    return prisma.serviceRequestComment.create({
      data: {
        serviceRequestId: data.serviceRequestId,
        content: data.content,
        commentType: data.commentType as CommentType,
        isInternal: data.isInternal,
        isCustomerAuthor: data.isCustomerAuthor,
        contactMethod: data.contactMethod,
        contactNumber: data.contactNumber,
        contactDuration: data.contactDuration,
        contactedAt: data.contactedAt ? new Date(data.contactedAt) : undefined,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Add call comment (convenience method for zone head calls)
  async addCallComment(data: AddCallCommentInput, userId?: string) {
    // Verify service request exists
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: data.serviceRequestId },
    });

    if (!serviceRequest) {
      throw new Error('Service request not found');
    }

    const commentType = data.direction === 'OUTBOUND' ? 'CUSTOMER_CALL' : 'CUSTOMER_CALLED';

    return prisma.serviceRequestComment.create({
      data: {
        serviceRequestId: data.serviceRequestId,
        content: data.content,
        commentType: commentType as CommentType,
        isInternal: true,
        isCustomerAuthor: false,
        contactMethod: 'PHONE',
        contactNumber: data.contactNumber,
        contactDuration: data.contactDuration,
        contactedAt: data.contactedAt ? new Date(data.contactedAt) : new Date(),
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Update comment
  async update(id: string, data: UpdateCommentInput, userId: string) {
    const comment = await prisma.serviceRequestComment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    return prisma.serviceRequestComment.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.isInternal !== undefined && { isInternal: data.isInternal }),
        ...(data.preferredDate !== undefined && { preferredDate: data.preferredDate }),
        ...(data.preferredTime !== undefined && { preferredTime: data.preferredTime }),
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Delete comment
  async delete(id: string) {
    const comment = await prisma.serviceRequestComment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    await prisma.serviceRequestComment.delete({
      where: { id },
    });

    return { success: true };
  }

  // Get comment by ID
  async getById(id: string) {
    const comment = await prisma.serviceRequestComment.findUnique({
      where: { id },
      include: {
        serviceRequest: {
          select: {
            id: true,
            requestNo: true,
            title: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    return comment;
  }

  // Get all comments (with filters)
  async getAll(query: CommentQueryInput) {
    const {
      page,
      limit,
      serviceRequestId,
      commentType,
      isInternal,
      fromDate,
      toDate,
      sortOrder,
    } = query;

    const where: Prisma.ServiceRequestCommentWhereInput = {
      ...(serviceRequestId && { serviceRequestId }),
      ...(commentType && { commentType: commentType as CommentType }),
      ...(isInternal !== undefined && { isInternal }),
      ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
      ...(toDate && { createdAt: { lte: new Date(toDate) } }),
    };

    const [comments, total] = await Promise.all([
      prisma.serviceRequestComment.findMany({
        where,
        include: {
          serviceRequest: {
            select: {
              id: true,
              requestNo: true,
              title: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.serviceRequestComment.count({ where }),
    ]);

    return {
      data: comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get comments by service request
  async getByServiceRequestId(serviceRequestId: string, includeInternal = true) {
    const where: Prisma.ServiceRequestCommentWhereInput = {
      serviceRequestId,
      ...(!includeInternal && { isInternal: false }),
    };

    return prisma.serviceRequestComment.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get comments with scheduling preferences (useful for scheduling workflow)
  async getWithSchedulingPreferences(serviceRequestId: string) {
    return prisma.serviceRequestComment.findMany({
      where: {
        serviceRequestId,
        OR: [
          { preferredDate: { not: null } },
          { preferredTime: { not: null } },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get recent call logs for a service request
  async getCallLogs(serviceRequestId: string, limit = 10) {
    return prisma.serviceRequestComment.findMany({
      where: {
        serviceRequestId,
        commentType: {
          in: ['CUSTOMER_CALL', 'CUSTOMER_CALLED'],
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { contactedAt: 'desc' },
      take: limit,
    });
  }

  // Get customer-visible comments (for customer portal)
  async getCustomerVisibleComments(serviceRequestId: string) {
    return prisma.serviceRequestComment.findMany({
      where: {
        serviceRequestId,
        isInternal: false,
      },
      select: {
        id: true,
        content: true,
        commentType: true,
        isCustomerAuthor: true,
        createdAt: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get upcoming scheduled appointments from comments (for zone head notifications)
  async getUpcomingScheduledAppointments(options: {
    includeTodayEvening?: boolean;
    includeTomorrow?: boolean;
    includeNextNDays?: number;
  } = {}) {
    const { includeTodayEvening = true, includeTomorrow = true, includeNextNDays } = options;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Build date filters
    const dateFilters: string[] = [];
    if (includeTodayEvening) {
      dateFilters.push(todayStr);
    }
    if (includeTomorrow) {
      dateFilters.push(tomorrowStr);
    }
    if (includeNextNDays && includeNextNDays > 1) {
      for (let i = 2; i <= includeNextNDays; i++) {
        const nextDate = new Date(today);
        nextDate.setDate(nextDate.getDate() + i);
        dateFilters.push(nextDate.toISOString().split('T')[0]);
      }
    }

    if (dateFilters.length === 0) {
      return [];
    }

    return prisma.serviceRequestComment.findMany({
      where: {
        preferredDate: {
          in: dateFilters,
        },
        serviceRequest: {
          status: {
            notIn: ['COMPLETED', 'CLOSED', 'CANCELLED'],
          },
        },
      },
      include: {
        serviceRequest: {
          select: {
            id: true,
            requestNo: true,
            title: true,
            description: true,
            priority: true,
            status: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                name: true,
                nameAr: true,
                head: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
                secondaryHead: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
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
              },
            },
            property: {
              select: {
                id: true,
                name: true,
                address: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { preferredDate: 'asc' },
        { preferredTime: 'asc' },
      ],
    });
  }

  // Group scheduled appointments by zone for notifications
  async getScheduledAppointmentsByZone(date?: string) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const appointments = await prisma.serviceRequestComment.findMany({
      where: {
        preferredDate: targetDate,
        serviceRequest: {
          status: {
            notIn: ['COMPLETED', 'CLOSED', 'CANCELLED'],
          },
        },
      },
      include: {
        serviceRequest: {
          select: {
            id: true,
            requestNo: true,
            title: true,
            priority: true,
            status: true,
            zoneId: true,
            zone: {
              select: {
                id: true,
                name: true,
                head: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            customer: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
            property: {
              select: {
                name: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: { preferredTime: 'asc' },
    });

    // Group by zone
    const byZone = new Map<string, typeof appointments>();
    for (const apt of appointments) {
      const zoneId = apt.serviceRequest?.zoneId;
      if (zoneId) {
        if (!byZone.has(zoneId)) {
          byZone.set(zoneId, []);
        }
        byZone.get(zoneId)!.push(apt);
      }
    }

    return {
      date: targetDate,
      totalAppointments: appointments.length,
      zones: Array.from(byZone.entries()).map(([zoneId, zonApts]) => ({
        zoneId,
        zoneName: zonApts[0]?.serviceRequest?.zone?.name,
        zoneHead: zonApts[0]?.serviceRequest?.zone?.head,
        appointments: zonApts.map(a => ({
          commentId: a.id,
          preferredTime: a.preferredTime,
          serviceRequest: a.serviceRequest,
          notes: a.content,
        })),
      })),
    };
  }

  // Get comment statistics for a service request
  async getStats(serviceRequestId: string) {
    const [
      totalComments,
      internalComments,
      customerComments,
      callLogs,
      withSchedulingPref,
    ] = await Promise.all([
      prisma.serviceRequestComment.count({
        where: { serviceRequestId },
      }),
      prisma.serviceRequestComment.count({
        where: { serviceRequestId, isInternal: true },
      }),
      prisma.serviceRequestComment.count({
        where: { serviceRequestId, isCustomerAuthor: true },
      }),
      prisma.serviceRequestComment.count({
        where: {
          serviceRequestId,
          commentType: { in: ['CUSTOMER_CALL', 'CUSTOMER_CALLED'] },
        },
      }),
      prisma.serviceRequestComment.count({
        where: {
          serviceRequestId,
          OR: [
            { preferredDate: { not: null } },
            { preferredTime: { not: null } },
          ],
        },
      }),
    ]);

    // Get comment type breakdown
    const byType = await prisma.serviceRequestComment.groupBy({
      by: ['commentType'],
      where: { serviceRequestId },
      _count: { id: true },
    });

    return {
      total: totalComments,
      internal: internalComments,
      customerComments,
      callLogs,
      withSchedulingPreference: withSchedulingPref,
      byType: byType.map((t) => ({
        type: t.commentType,
        count: t._count.id,
      })),
    };
  }

  // Send zone head notifications for scheduled appointments
  async sendZoneHeadNotifications(options: {
    forToday?: boolean;
    forTomorrow?: boolean;
    forDate?: string;
  } = { forToday: true, forTomorrow: true }) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const datesToProcess: { date: string; label: string }[] = [];

    if (options.forDate) {
      const dateLabel = options.forDate === todayStr ? 'Today' :
                        options.forDate === tomorrowStr ? 'Tomorrow' :
                        new Date(options.forDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      datesToProcess.push({ date: options.forDate, label: dateLabel });
    } else {
      if (options.forToday) {
        datesToProcess.push({ date: todayStr, label: 'Today' });
      }
      if (options.forTomorrow) {
        datesToProcess.push({ date: tomorrowStr, label: 'Tomorrow' });
      }
    }

    const results: Array<{
      date: string;
      zoneName: string;
      zoneHeadEmail: string;
      appointmentCount: number;
      emailSent: boolean;
      error?: string;
    }> = [];

    for (const { date, label } of datesToProcess) {
      const data = await this.getScheduledAppointmentsByZone(date);

      for (const zone of data.zones) {
        const zoneHead = zone.zoneHead;

        if (!zoneHead || !zoneHead.email) {
          logger.warn({ zoneId: zone.zoneId, zoneName: zone.zoneName }, 'Zone head not found or has no email');
          results.push({
            date,
            zoneName: zone.zoneName || 'Unknown',
            zoneHeadEmail: 'N/A',
            appointmentCount: zone.appointments.length,
            emailSent: false,
            error: 'Zone head not found or has no email',
          });
          continue;
        }

        try {
          const emailData = {
            zoneHeadName: `${zoneHead.firstName} ${zoneHead.lastName}`,
            zoneName: zone.zoneName || 'Unknown',
            date,
            dateLabel: label,
            appointments: zone.appointments.map((apt) => ({
              time: apt.preferredTime || 'TBD',
              requestNo: apt.serviceRequest?.requestNo || 'N/A',
              title: apt.serviceRequest?.title || 'Service Request',
              customerName: apt.serviceRequest?.customer
                ? `${apt.serviceRequest.customer.firstName || ''} ${apt.serviceRequest.customer.lastName || ''}`.trim() || apt.serviceRequest.customer.phone || 'Unknown'
                : 'Unknown',
              customerPhone: apt.serviceRequest?.customer?.phone || undefined,
              propertyName: apt.serviceRequest?.property?.name || undefined,
              propertyAddress: apt.serviceRequest?.property?.address || undefined,
              priority: String(apt.serviceRequest?.priority || 'MEDIUM'),
              notes: apt.notes || undefined,
            })),
          };

          const sent = await emailService.sendZoneHeadTasksEmail(emailData, zoneHead.email);

          results.push({
            date,
            zoneName: zone.zoneName || 'Unknown',
            zoneHeadEmail: zoneHead.email,
            appointmentCount: zone.appointments.length,
            emailSent: sent,
            error: sent ? undefined : 'Email service failed to send',
          });

          logger.info({
            zoneId: zone.zoneId,
            zoneName: zone.zoneName,
            zoneHeadEmail: zoneHead.email,
            appointmentCount: zone.appointments.length,
            date,
          }, 'Zone head notification sent');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.error({ error, zoneId: zone.zoneId }, 'Failed to send zone head notification');
          results.push({
            date,
            zoneName: zone.zoneName || 'Unknown',
            zoneHeadEmail: zoneHead.email,
            appointmentCount: zone.appointments.length,
            emailSent: false,
            error: errorMessage,
          });
        }
      }
    }

    return {
      success: true,
      totalNotifications: results.length,
      sent: results.filter(r => r.emailSent).length,
      failed: results.filter(r => !r.emailSent).length,
      details: results,
    };
  }
}
