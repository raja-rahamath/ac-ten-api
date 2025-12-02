import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service.js';
import {
  createTemplateSchema,
  updateTemplateSchema,
  sendNotificationSchema,
  sendTemplateNotificationSchema,
  scheduleAppointmentReminderSchema,
  sendBulkNotificationSchema,
  markAsReadSchema,
  retryNotificationSchema,
  notificationQuerySchema,
  templateQuerySchema,
} from './notification.schema.js';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // ==================== TEMPLATES ====================

  // Create template
  async createTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createTemplateSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const template = await this.notificationService.createTemplate(data, userId);
      res.status(201).json(template);
    } catch (error) {
      next(error);
    }
  }

  // Update template
  async updateTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateTemplateSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const template = await this.notificationService.updateTemplate(id, data, userId);
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  // Get all templates
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const query = templateQuerySchema.parse(req.query);
      const result = await this.notificationService.getTemplates(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get template by ID
  async getTemplateById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const template = await this.notificationService.getTemplateById(id);
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  // Delete template
  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.notificationService.deleteTemplate(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ==================== NOTIFICATIONS ====================

  // Send notification
  async send(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendNotificationSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await this.notificationService.send(data, userId);
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }

  // Send from template
  async sendFromTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendTemplateNotificationSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await this.notificationService.sendFromTemplate(data, userId);
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }

  // Schedule appointment reminder
  async scheduleAppointmentReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const data = scheduleAppointmentReminderSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await this.notificationService.scheduleAppointmentReminder(data, userId);
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }

  // Send bulk notifications
  async sendBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const data = sendBulkNotificationSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await this.notificationService.sendBulk(data, userId);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get all notifications
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = notificationQuerySchema.parse(req.query);
      const result = await this.notificationService.getAll(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get notification by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const notification = await this.notificationService.getById(id);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  // Get notifications for customer
  async getByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const unreadOnly = req.query.unreadOnly === 'true';
      const notifications = await this.notificationService.getByCustomer(customerId, unreadOnly);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.notificationService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Mark as read
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const data = markAsReadSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await this.notificationService.markAsRead(data.notificationIds, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Cancel notification
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await this.notificationService.cancel(id, userId);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  // Retry failed notification
  async retry(req: Request, res: Response, next: NextFunction) {
    try {
      const data = retryNotificationSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notification = await this.notificationService.retry(data.notificationId, userId);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  // Process scheduled notifications (called by cron/worker)
  async processScheduled(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.notificationService.processScheduledNotifications();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
