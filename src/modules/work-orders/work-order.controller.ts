import { Request, Response, NextFunction } from 'express';
import { WorkOrderService } from './work-order.service.js';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  createFromQuoteSchema,
  createFromEstimateSchema,
  assignTeamSchema,
  scheduleWorkOrderSchema,
  startEnRouteSchema,
  arriveAtSiteSchema,
  clockInSchema,
  clockOutSchema,
  completeChecklistSchema,
  addItemSchema,
  addPhotoSchema,
  completeWorkOrderSchema,
  putOnHoldSchema,
  cancelWorkOrderSchema,
  rescheduleWorkOrderSchema,
  requiresFollowUpSchema,
  workOrderQuerySchema,
} from './work-order.schema.js';

export class WorkOrderController {
  private workOrderService: WorkOrderService;

  constructor() {
    this.workOrderService = new WorkOrderService();
  }

  // Create work order
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createWorkOrderSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.create(data, userId);
      res.status(201).json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Create from quote
  async createFromQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFromQuoteSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.createFromQuote(data, userId);
      res.status(201).json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Create from estimate
  async createFromEstimate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createFromEstimateSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.createFromEstimate(data, userId);
      res.status(201).json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Get all work orders
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = workOrderQuerySchema.parse(req.query);
      const result = await this.workOrderService.getAll(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.workOrderService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Get by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const workOrder = await this.workOrderService.getById(id);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Get by service request
  async getByServiceRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceRequestId } = req.params;
      const workOrders = await this.workOrderService.getByServiceRequest(serviceRequestId);
      res.json(workOrders);
    } catch (error) {
      next(error);
    }
  }

  // Get by customer
  async getByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const workOrders = await this.workOrderService.getByCustomer(customerId);
      res.json(workOrders);
    } catch (error) {
      next(error);
    }
  }

  // Update work order
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateWorkOrderSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.update(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Assign team
  async assignTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = assignTeamSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.assignTeam(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Schedule
  async schedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = scheduleWorkOrderSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.schedule(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Confirm
  async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.confirm(id, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Start en route
  async startEnRoute(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = startEnRouteSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.startEnRoute(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Arrive at site
  async arriveAtSite(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = arriveAtSiteSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.arriveAtSite(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Start work
  async startWork(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.startWork(id, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Clock in
  async clockIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = clockInSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.clockIn(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Clock out
  async clockOut(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = clockOutSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.clockOut(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Complete checklist
  async completeChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = completeChecklistSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.completeChecklist(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Add item
  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = addItemSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.addItem(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Add photo (file upload)
  async addPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded' },
        });
      }

      // Get photo metadata from body
      const photoType = (req.body.photoType || 'DURING') as 'BEFORE' | 'DURING' | 'AFTER' | 'ISSUE' | 'SIGNATURE' | 'OTHER';
      const caption = req.body.caption;

      // Build file path relative to uploads directory
      const relativePath = `/uploads/work-orders/${id}/${file.filename}`;

      const data = {
        url: relativePath,
        photoType,
        caption,
      };

      const workOrder = await this.workOrderService.addPhoto(id, data, userId);
      res.json({
        success: true,
        data: workOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  // Complete work order
  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = completeWorkOrderSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.complete(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Put on hold
  async putOnHold(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = putOnHoldSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.putOnHold(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Resume from hold
  async resumeFromHold(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.resumeFromHold(id, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Requires follow-up
  async requiresFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = requiresFollowUpSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.requiresFollowUp(id, data.reason, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Cancel
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = cancelWorkOrderSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.cancel(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Reschedule
  async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = rescheduleWorkOrderSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const workOrder = await this.workOrderService.reschedule(id, data, userId);
      res.json(workOrder);
    } catch (error) {
      next(error);
    }
  }

  // Delete
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.workOrderService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
