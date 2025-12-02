import { PrismaClient, Prisma, ReviewSource } from '@prisma/client';
import {
  CreateReviewInput,
  UpdateReviewInput,
  RespondToReviewInput,
  ReviewQueryInput,
  RequestReviewInput,
} from './review.schema.js';

const prisma = new PrismaClient();

export class ReviewService {
  // Create review
  async create(data: CreateReviewInput, userId?: string) {
    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Verify service request if provided
    if (data.serviceRequestId) {
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: data.serviceRequestId },
      });
      if (!serviceRequest) {
        throw new Error('Service request not found');
      }
      // Check if customer matches
      if (serviceRequest.customerId !== data.customerId) {
        throw new Error('Service request does not belong to this customer');
      }
    }

    // Verify work order if provided
    if (data.workOrderId) {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: data.workOrderId },
      });
      if (!workOrder) {
        throw new Error('Work order not found');
      }
    }

    // Check for existing review
    const existingReview = await prisma.customerReview.findFirst({
      where: {
        customerId: data.customerId,
        ...(data.serviceRequestId && { serviceRequestId: data.serviceRequestId }),
        ...(data.workOrderId && { workOrderId: data.workOrderId }),
      },
    });

    if (existingReview) {
      throw new Error('Review already exists for this service');
    }

    return prisma.customerReview.create({
      data: {
        customerId: data.customerId,
        serviceRequestId: data.serviceRequestId,
        workOrderId: data.workOrderId,
        overallRating: data.overallRating,
        qualityRating: data.qualityRating,
        timelinessRating: data.timelinessRating,
        professionalismRating: data.professionalismRating,
        valueRating: data.valueRating,
        comment: data.comment,
        wouldRecommend: data.wouldRecommend,
        isPublic: data.isPublic,
        source: data.source as ReviewSource,
        createdById: userId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        serviceRequest: {
          select: {
            id: true,
            requestNo: true,
            title: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            workOrderNo: true,
          },
        },
      },
    });
  }

  // Update review
  async update(id: string, data: UpdateReviewInput, userId: string) {
    const review = await prisma.customerReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return prisma.customerReview.update({
      where: { id },
      data: {
        ...data,
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
      },
    });
  }

  // Respond to review
  async respond(id: string, data: RespondToReviewInput, userId: string) {
    const review = await prisma.customerReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return prisma.customerReview.update({
      where: { id },
      data: {
        responseText: data.responseText,
        respondedAt: new Date(),
        respondedById: userId,
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
      },
    });
  }

  // Delete review
  async delete(id: string) {
    const review = await prisma.customerReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    await prisma.customerReview.delete({
      where: { id },
    });

    return { success: true };
  }

  // Get review by ID
  async getById(id: string) {
    const review = await prisma.customerReview.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        serviceRequest: {
          select: {
            id: true,
            requestNo: true,
            title: true,
            status: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            workOrderNo: true,
            status: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return review;
  }

  // Get all reviews
  async getAll(query: ReviewQueryInput) {
    const {
      page,
      limit,
      customerId,
      serviceRequestId,
      workOrderId,
      minRating,
      maxRating,
      isPublic,
      isVerified,
      hasResponse,
      wouldRecommend,
      source,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.CustomerReviewWhereInput = {
      ...(customerId && { customerId }),
      ...(serviceRequestId && { serviceRequestId }),
      ...(workOrderId && { workOrderId }),
      ...(minRating && { overallRating: { gte: minRating } }),
      ...(maxRating && { overallRating: { lte: maxRating } }),
      ...(isPublic !== undefined && { isPublic }),
      ...(isVerified !== undefined && { isVerified }),
      ...(hasResponse !== undefined && {
        responseText: hasResponse ? { not: null } : null,
      }),
      ...(wouldRecommend !== undefined && { wouldRecommend }),
      ...(source && { source: source as ReviewSource }),
      ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
      ...(toDate && { createdAt: { lte: new Date(toDate) } }),
    };

    const [reviews, total] = await Promise.all([
      prisma.customerReview.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          serviceRequest: {
            select: {
              id: true,
              requestNo: true,
              title: true,
            },
          },
          workOrder: {
            select: {
              id: true,
              workOrderNo: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customerReview.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get reviews for customer
  async getByCustomerId(customerId: string, onlyPublic = false) {
    return prisma.customerReview.findMany({
      where: {
        customerId,
        ...(onlyPublic && { isPublic: true }),
      },
      include: {
        serviceRequest: {
          select: {
            id: true,
            requestNo: true,
            title: true,
          },
        },
        workOrder: {
          select: {
            id: true,
            workOrderNo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get public reviews (for website display)
  async getPublicReviews(limit = 10) {
    return prisma.customerReview.findMany({
      where: {
        isPublic: true,
        isVerified: true,
        overallRating: { gte: 4 }, // Only show 4+ star reviews publicly
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // Get statistics
  async getStats() {
    const [
      totalReviews,
      publicReviews,
      reviewsWithResponse,
      avgOverall,
      avgQuality,
      avgTimeliness,
      avgProfessionalism,
      avgValue,
      recommendCount,
      ratingDistribution,
    ] = await Promise.all([
      prisma.customerReview.count(),
      prisma.customerReview.count({ where: { isPublic: true } }),
      prisma.customerReview.count({ where: { responseText: { not: null } } }),
      prisma.customerReview.aggregate({
        _avg: { overallRating: true },
      }),
      prisma.customerReview.aggregate({
        _avg: { qualityRating: true },
      }),
      prisma.customerReview.aggregate({
        _avg: { timelinessRating: true },
      }),
      prisma.customerReview.aggregate({
        _avg: { professionalismRating: true },
      }),
      prisma.customerReview.aggregate({
        _avg: { valueRating: true },
      }),
      prisma.customerReview.count({
        where: { wouldRecommend: true },
      }),
      prisma.customerReview.groupBy({
        by: ['overallRating'],
        _count: { id: true },
      }),
    ]);

    // Calculate NPS (Net Promoter Score)
    const totalWithRecommendation = await prisma.customerReview.count({
      where: { wouldRecommend: { not: null } },
    });
    const notRecommendCount = await prisma.customerReview.count({
      where: { wouldRecommend: false },
    });

    const npsScore = totalWithRecommendation > 0
      ? Math.round(((recommendCount - notRecommendCount) / totalWithRecommendation) * 100)
      : 0;

    // Format rating distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((r) => {
      distribution[r.overallRating] = r._count.id;
    });

    // Reviews by source
    const bySource = await prisma.customerReview.groupBy({
      by: ['source'],
      _count: { id: true },
    });

    return {
      total: totalReviews,
      public: publicReviews,
      withResponse: reviewsWithResponse,
      responseRate: totalReviews > 0
        ? Math.round((reviewsWithResponse / totalReviews) * 100)
        : 0,
      averages: {
        overall: Number(avgOverall._avg.overallRating?.toFixed(2)) || 0,
        quality: Number(avgQuality._avg.qualityRating?.toFixed(2)) || 0,
        timeliness: Number(avgTimeliness._avg.timelinessRating?.toFixed(2)) || 0,
        professionalism: Number(avgProfessionalism._avg.professionalismRating?.toFixed(2)) || 0,
        value: Number(avgValue._avg.valueRating?.toFixed(2)) || 0,
      },
      recommendation: {
        wouldRecommend: recommendCount,
        wouldNotRecommend: notRecommendCount,
        npsScore,
      },
      ratingDistribution: distribution,
      bySource: bySource.map((s) => ({
        source: s.source,
        count: s._count.id,
      })),
    };
  }

  // Toggle public visibility
  async togglePublic(id: string, userId: string) {
    const review = await prisma.customerReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return prisma.customerReview.update({
      where: { id },
      data: {
        isPublic: !review.isPublic,
        updatedById: userId,
      },
    });
  }

  // Mark review as verified
  async verify(id: string, userId: string) {
    const review = await prisma.customerReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new Error('Review not found');
    }

    return prisma.customerReview.update({
      where: { id },
      data: {
        isVerified: true,
        updatedById: userId,
      },
    });
  }

  // Request review from customer (creates notification)
  async requestReview(data: RequestReviewInput, userId: string) {
    // Verify customer exists and has email/phone
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Check if review already exists
    const existingReview = await prisma.customerReview.findFirst({
      where: {
        customerId: data.customerId,
        ...(data.serviceRequestId && { serviceRequestId: data.serviceRequestId }),
        ...(data.workOrderId && { workOrderId: data.workOrderId }),
      },
    });

    if (existingReview) {
      throw new Error('Review already exists for this service');
    }

    // Get service details for the notification
    let serviceDetails = '';
    if (data.serviceRequestId) {
      const sr = await prisma.serviceRequest.findUnique({
        where: { id: data.serviceRequestId },
        select: { requestNo: true, title: true },
      });
      if (sr) {
        serviceDetails = `Service Request #${sr.requestNo}: ${sr.title}`;
      }
    } else if (data.workOrderId) {
      const wo = await prisma.workOrder.findUnique({
        where: { id: data.workOrderId },
        select: { workOrderNo: true },
      });
      if (wo) {
        serviceDetails = `Work Order #${wo.workOrderNo}`;
      }
    }

    // Create notification(s) based on channel
    const notifications = [];

    if (data.channel === 'EMAIL' || data.channel === 'BOTH') {
      if (!customer.email) {
        throw new Error('Customer does not have an email address');
      }
      notifications.push(
        prisma.notification.create({
          data: {
            recipientType: 'CUSTOMER',
            customerId: data.customerId,
            channel: 'EMAIL',
            type: 'REVIEW_REQUEST',
            title: 'We value your feedback!',
            message: `Dear ${customer.firstName},\n\nThank you for choosing our services. We would appreciate if you could take a moment to share your experience with ${serviceDetails}.\n\nYour feedback helps us improve our services.\n\nBest regards,\nThe Team`,
            referenceType: data.serviceRequestId ? 'ServiceRequest' : 'WorkOrder',
            referenceId: data.serviceRequestId || data.workOrderId,
            createdById: userId,
          },
        })
      );
    }

    if (data.channel === 'SMS' || data.channel === 'BOTH') {
      if (!customer.phone) {
        throw new Error('Customer does not have a phone number');
      }
      notifications.push(
        prisma.notification.create({
          data: {
            recipientType: 'CUSTOMER',
            customerId: data.customerId,
            channel: 'SMS',
            type: 'REVIEW_REQUEST',
            title: 'Review Request',
            message: `Hi ${customer.firstName}, we'd love to hear your feedback about your recent service. Please share your experience!`,
            referenceType: data.serviceRequestId ? 'ServiceRequest' : 'WorkOrder',
            referenceId: data.serviceRequestId || data.workOrderId,
            createdById: userId,
          },
        })
      );
    }

    await Promise.all(notifications);

    return {
      success: true,
      message: `Review request sent via ${data.channel}`,
      customerId: data.customerId,
    };
  }

  // Get reviews pending response
  async getPendingResponse(limit = 20) {
    return prisma.customerReview.findMany({
      where: {
        responseText: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        serviceRequest: {
          select: {
            id: true,
            requestNo: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  // Get recent negative reviews (for alerts)
  async getRecentNegative(days = 7, ratingThreshold = 2) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return prisma.customerReview.findMany({
      where: {
        createdAt: { gte: sinceDate },
        overallRating: { lte: ratingThreshold },
      },
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
        serviceRequest: {
          select: {
            id: true,
            requestNo: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
