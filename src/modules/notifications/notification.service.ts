import { PrismaClient, Prisma, NotificationChannel, NotificationType, NotificationStatus, RecipientType } from '@prisma/client';
import {
  CreateTemplateInput,
  UpdateTemplateInput,
  SendNotificationInput,
  SendTemplateNotificationInput,
  ScheduleAppointmentReminderInput,
  SendBulkNotificationInput,
  NotificationQueryInput,
  TemplateQueryInput,
} from './notification.schema.js';

const prisma = new PrismaClient();

export class NotificationService {
  // ==================== TEMPLATES ====================

  // Create notification template
  async createTemplate(data: CreateTemplateInput, userId: string) {
    // If setting as default, unset other defaults of same type/channel
    if (data.isDefault) {
      await prisma.notificationTemplate.updateMany({
        where: {
          type: data.type as NotificationType,
          channel: data.channel as NotificationChannel,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return prisma.notificationTemplate.create({
      data: {
        name: data.name,
        type: data.type as NotificationType,
        channel: data.channel as NotificationChannel,
        title: data.title,
        titleAr: data.titleAr,
        subject: data.subject,
        subjectAr: data.subjectAr,
        body: data.body,
        bodyAr: data.bodyAr,
        isActive: data.isActive,
        isDefault: data.isDefault,
        createdById: userId,
      },
    });
  }

  // Update notification template
  async updateTemplate(id: string, data: UpdateTemplateInput, userId: string) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.notificationTemplate.updateMany({
        where: {
          type: template.type,
          channel: template.channel,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...data,
        updatedById: userId,
      },
    });
  }

  // Get all templates
  async getTemplates(query: TemplateQueryInput) {
    const { page, limit, type, channel, isActive, search } = query;

    const where: Prisma.NotificationTemplateWhereInput = {
      ...(type && { type: type as NotificationType }),
      ...(channel && { channel: channel as NotificationChannel }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { body: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [templates, total] = await Promise.all([
      prisma.notificationTemplate.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notificationTemplate.count({ where }),
    ]);

    return {
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get template by ID
  async getTemplateById(id: string) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    return template;
  }

  // Delete template
  async deleteTemplate(id: string) {
    await prisma.notificationTemplate.delete({
      where: { id },
    });
    return { success: true };
  }

  // ==================== NOTIFICATIONS ====================

  // Send notification
  async send(data: SendNotificationInput, userId: string) {
    // Resolve recipient contact info if not provided
    let phoneNumber = data.phoneNumber;
    let email = data.email;

    if (data.recipientType === 'CUSTOMER' && data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: data.customerId },
      });
      if (customer) {
        phoneNumber = phoneNumber || customer.phone || undefined;
        email = email || customer.email || undefined;
      }
    } else if (data.recipientType === 'EMPLOYEE' && data.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
      });
      if (employee) {
        phoneNumber = phoneNumber || employee.phone || undefined;
        email = email || employee.email || undefined;
      }
    }

    // Validate channel requirements
    if (data.channel === 'SMS' && !phoneNumber) {
      throw new Error('Phone number is required for SMS notifications');
    }
    if (data.channel === 'EMAIL' && !email) {
      throw new Error('Email is required for email notifications');
    }
    if (data.channel === 'WHATSAPP' && !phoneNumber) {
      throw new Error('Phone number is required for WhatsApp notifications');
    }

    const notification = await prisma.notification.create({
      data: {
        recipientType: data.recipientType as RecipientType,
        customerId: data.customerId,
        employeeId: data.employeeId,
        userId: data.userId,
        channel: data.channel as NotificationChannel,
        type: data.type as NotificationType,
        title: data.title,
        message: data.message,
        templateId: data.templateId,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        phoneNumber,
        email,
        subject: data.subject,
        metadata: data.metadata,
        status: data.scheduledFor ? 'SCHEDULED' : 'PENDING',
        createdById: userId,
      },
    });

    // If not scheduled, send immediately
    if (!data.scheduledFor) {
      await this.processNotification(notification.id);
    }

    return notification;
  }

  // Send notification using template
  async sendFromTemplate(data: SendTemplateNotificationInput, userId: string) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.isActive) {
      throw new Error('Template is not active');
    }

    // Replace template variables
    let message = template.body;
    let title = template.title || '';
    let subject = template.subject || '';

    if (data.variables) {
      for (const [key, value] of Object.entries(data.variables)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
        title = title.replace(new RegExp(placeholder, 'g'), value);
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
      }
    }

    return this.send(
      {
        recipientType: data.recipientType,
        customerId: data.customerId,
        employeeId: data.employeeId,
        userId: data.userId,
        channel: template.channel as 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'WHATSAPP',
        type: template.type as SendNotificationInput['type'],
        title,
        message,
        templateId: template.id,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        scheduledFor: data.scheduledFor,
        subject,
      },
      userId
    );
  }

  // Schedule appointment reminder
  async scheduleAppointmentReminder(data: ScheduleAppointmentReminderInput, userId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Calculate reminder time
    const appointmentDate = new Date(data.appointmentDate);
    const reminderTime = new Date(appointmentDate.getTime() - data.reminderMinutesBefore * 60 * 1000);

    // Check if reminder time is in the future
    if (reminderTime <= new Date()) {
      throw new Error('Reminder time must be in the future');
    }

    // Get default template for appointment reminder
    const template = await prisma.notificationTemplate.findFirst({
      where: {
        type: 'APPOINTMENT_REMINDER',
        channel: data.channel as NotificationChannel,
        isActive: true,
        isDefault: true,
      },
    });

    const message = data.message || template?.body ||
      `Reminder: You have an appointment scheduled for ${appointmentDate.toLocaleString()}. Please confirm your availability.`;

    const title = template?.title || 'Appointment Reminder';

    return this.send(
      {
        recipientType: 'CUSTOMER',
        customerId: data.customerId,
        channel: data.channel,
        type: 'APPOINTMENT_REMINDER',
        title,
        message,
        templateId: template?.id,
        referenceType: data.workOrderId ? 'WorkOrder' : data.serviceRequestId ? 'ServiceRequest' : undefined,
        referenceId: data.workOrderId || data.serviceRequestId,
        scheduledFor: reminderTime.toISOString(),
      },
      userId
    );
  }

  // Send bulk notifications
  async sendBulk(data: SendBulkNotificationInput, userId: string) {
    const notifications: Prisma.NotificationCreateManyInput[] = [];

    for (const recipientId of data.recipientIds) {
      let phoneNumber: string | undefined;
      let email: string | undefined;

      if (data.recipientType === 'CUSTOMER') {
        const customer = await prisma.customer.findUnique({
          where: { id: recipientId },
        });
        phoneNumber = customer?.phone || undefined;
        email = customer?.email || undefined;
      } else if (data.recipientType === 'EMPLOYEE') {
        const employee = await prisma.employee.findUnique({
          where: { id: recipientId },
        });
        phoneNumber = employee?.phone || undefined;
        email = employee?.email || undefined;
      }

      notifications.push({
        recipientType: data.recipientType as RecipientType,
        customerId: data.recipientType === 'CUSTOMER' ? recipientId : undefined,
        employeeId: data.recipientType === 'EMPLOYEE' ? recipientId : undefined,
        channel: data.channel as NotificationChannel,
        type: data.type as NotificationType,
        title: data.title,
        message: data.message,
        templateId: data.templateId,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        phoneNumber,
        email,
        status: data.scheduledFor ? 'SCHEDULED' : 'PENDING',
        createdById: userId,
      });
    }

    await prisma.notification.createMany({
      data: notifications,
    });

    // If not scheduled, process immediately
    if (!data.scheduledFor) {
      const createdNotifications = await prisma.notification.findMany({
        where: {
          createdById: userId,
          status: 'PENDING',
          createdAt: { gte: new Date(Date.now() - 5000) }, // Last 5 seconds
        },
      });

      for (const notification of createdNotifications) {
        await this.processNotification(notification.id);
      }
    }

    return { success: true, count: notifications.length };
  }

  // Get notifications
  async getAll(query: NotificationQueryInput) {
    const {
      page,
      limit,
      recipientType,
      customerId,
      employeeId,
      channel,
      type,
      status,
      referenceType,
      referenceId,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.NotificationWhereInput = {
      ...(recipientType && { recipientType: recipientType as RecipientType }),
      ...(customerId && { customerId }),
      ...(employeeId && { employeeId }),
      ...(channel && { channel: channel as NotificationChannel }),
      ...(type && { type: type as NotificationType }),
      ...(status && { status: status as NotificationStatus }),
      ...(referenceType && { referenceType }),
      ...(referenceId && { referenceId }),
      ...(fromDate && { createdAt: { gte: new Date(fromDate) } }),
      ...(toDate && { createdAt: { lte: new Date(toDate) } }),
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get notification by ID
  async getById(id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
      include: {
        customer: true,
        employee: true,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  // Get notifications for customer
  async getByCustomer(customerId: string, unreadOnly: boolean = false) {
    return prisma.notification.findMany({
      where: {
        customerId,
        ...(unreadOnly && { readAt: null }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // Mark notifications as read
  async markAsRead(notificationIds: string[], userId: string) {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: 'READ',
      },
    });

    return { success: true, count: notificationIds.length };
  }

  // Cancel scheduled notification
  async cancel(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.status !== 'SCHEDULED' && notification.status !== 'PENDING') {
      throw new Error('Can only cancel pending or scheduled notifications');
    }

    return prisma.notification.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  // Retry failed notification
  async retry(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.status !== 'FAILED') {
      throw new Error('Can only retry failed notifications');
    }

    if (notification.retryCount >= notification.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    await prisma.notification.update({
      where: { id },
      data: {
        status: 'PENDING',
        retryCount: notification.retryCount + 1,
        failedAt: null,
        failureReason: null,
      },
    });

    return this.processNotification(id);
  }

  // Process scheduled notifications (called by cron job)
  async processScheduledNotifications() {
    const notifications = await prisma.notification.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: { lte: new Date() },
      },
      take: 100,
    });

    let processed = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        await this.processNotification(notification.id);
        processed++;
      } catch (error) {
        failed++;
      }
    }

    return { processed, failed };
  }

  // Get notification statistics
  async getStats() {
    const [total, pending, scheduled, sent, delivered, failed, todaySent] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { status: 'PENDING' } }),
      prisma.notification.count({ where: { status: 'SCHEDULED' } }),
      prisma.notification.count({ where: { status: 'SENT' } }),
      prisma.notification.count({ where: { status: 'DELIVERED' } }),
      prisma.notification.count({ where: { status: 'FAILED' } }),
      prisma.notification.count({
        where: {
          sentAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    // Channel breakdown
    const byChannel = await prisma.notification.groupBy({
      by: ['channel'],
      _count: { id: true },
    });

    return {
      total,
      pending,
      scheduled,
      sent,
      delivered,
      failed,
      todaySent,
      byChannel: byChannel.reduce((acc, item) => {
        acc[item.channel] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      deliveryRate: sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0',
    };
  }

  // ==================== PRIVATE METHODS ====================

  // Process a single notification
  private async processNotification(id: string) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    try {
      // Update to processing
      await prisma.notification.update({
        where: { id },
        data: { status: 'PENDING' },
      });

      // Send based on channel
      let success = false;
      switch (notification.channel) {
        case 'SMS':
          success = await this.sendSms(notification.phoneNumber!, notification.message);
          break;
        case 'EMAIL':
          success = await this.sendEmail(notification.email!, notification.subject || notification.title, notification.message);
          break;
        case 'WHATSAPP':
          success = await this.sendWhatsApp(notification.phoneNumber!, notification.message);
          break;
        case 'PUSH':
          success = await this.sendPush(notification.userId!, notification.title, notification.message);
          break;
        case 'IN_APP':
          // In-app notifications are automatically delivered
          success = true;
          break;
      }

      if (success) {
        await prisma.notification.update({
          where: { id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });
      } else {
        throw new Error('Send failed');
      }

      return notification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await prisma.notification.update({
        where: { id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: errorMessage,
        },
      });
      throw error;
    }
  }

  // Send SMS (placeholder - implement with actual SMS provider)
  private async sendSms(phoneNumber: string, message: string): Promise<boolean> {
    // TODO: Integrate with Twilio, Nexmo, or other SMS provider
    console.log(`[SMS] Sending to ${phoneNumber}: ${message}`);

    // Placeholder - in production, integrate with SMS gateway
    // Example with Twilio:
    // const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({
    //   body: message,
    //   to: phoneNumber,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    // });

    return true;
  }

  // Send Email (placeholder - implement with actual email provider)
  private async sendEmail(email: string, subject: string, body: string): Promise<boolean> {
    // TODO: Integrate with SendGrid, Mailgun, or other email provider
    console.log(`[EMAIL] Sending to ${email}: ${subject}`);

    // Placeholder - in production, integrate with email service
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({
    //   to: email,
    //   from: process.env.FROM_EMAIL,
    //   subject,
    //   text: body,
    // });

    return true;
  }

  // Send WhatsApp (placeholder - implement with WhatsApp Business API)
  private async sendWhatsApp(phoneNumber: string, message: string): Promise<boolean> {
    // TODO: Integrate with WhatsApp Business API
    console.log(`[WHATSAPP] Sending to ${phoneNumber}: ${message}`);

    return true;
  }

  // Send Push notification (placeholder - implement with Firebase, OneSignal, etc.)
  private async sendPush(userId: string, title: string, body: string): Promise<boolean> {
    // TODO: Integrate with Firebase Cloud Messaging or other push service
    console.log(`[PUSH] Sending to user ${userId}: ${title}`);

    return true;
  }
}
