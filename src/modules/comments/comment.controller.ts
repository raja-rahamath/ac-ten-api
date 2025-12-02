import { Request, Response, NextFunction } from 'express';
import { CommentService } from './comment.service.js';
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
  addCallCommentSchema,
} from './comment.schema.js';

export class CommentController {
  private commentService: CommentService;

  constructor() {
    this.commentService = new CommentService();
  }

  // Create comment
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCommentSchema.parse(req.body);
      const userId = req.user?.id;
      const comment = await this.commentService.create(data, userId);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  // Add call comment (convenience endpoint for zone head calls)
  async addCallComment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = addCallCommentSchema.parse(req.body);
      const userId = req.user?.id;
      const comment = await this.commentService.addCallComment(data, userId);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  // Update comment
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateCommentSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const comment = await this.commentService.update(id, data, userId);
      res.json(comment);
    } catch (error) {
      next(error);
    }
  }

  // Delete comment
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.commentService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Get comment by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const comment = await this.commentService.getById(id);
      res.json(comment);
    } catch (error) {
      next(error);
    }
  }

  // Get all comments
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = commentQuerySchema.parse(req.query);
      const result = await this.commentService.getAll(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get comments by service request
  async getByServiceRequestId(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceRequestId } = req.params;
      const includeInternal = req.query.includeInternal !== 'false';
      const comments = await this.commentService.getByServiceRequestId(
        serviceRequestId,
        includeInternal
      );
      res.json(comments);
    } catch (error) {
      next(error);
    }
  }

  // Get comments with scheduling preferences
  async getWithSchedulingPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceRequestId } = req.params;
      const comments = await this.commentService.getWithSchedulingPreferences(serviceRequestId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  }

  // Get call logs for a service request
  async getCallLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceRequestId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const callLogs = await this.commentService.getCallLogs(serviceRequestId, limit);
      res.json(callLogs);
    } catch (error) {
      next(error);
    }
  }

  // Get customer-visible comments (for customer portal)
  async getCustomerVisibleComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceRequestId } = req.params;
      const comments = await this.commentService.getCustomerVisibleComments(serviceRequestId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  }

  // Get comment statistics for a service request
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceRequestId } = req.params;
      const stats = await this.commentService.getStats(serviceRequestId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Get upcoming scheduled appointments (for today/tomorrow)
  async getUpcomingAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const includeTodayEvening = req.query.includeToday !== 'false';
      const includeTomorrow = req.query.includeTomorrow !== 'false';
      const includeNextNDays = req.query.days ? parseInt(req.query.days as string) : undefined;

      const appointments = await this.commentService.getUpcomingScheduledAppointments({
        includeTodayEvening,
        includeTomorrow,
        includeNextNDays,
      });
      res.json(appointments);
    } catch (error) {
      next(error);
    }
  }

  // Get scheduled appointments grouped by zone for a specific date
  async getScheduledByZone(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const result = await this.commentService.getScheduledAppointmentsByZone(date as string);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Send zone head notifications for scheduled appointments
  async sendZoneHeadNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const { forToday, forTomorrow, forDate } = req.body;

      const result = await this.commentService.sendZoneHeadNotifications({
        forToday: forToday !== false,
        forTomorrow: forTomorrow !== false,
        forDate,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
