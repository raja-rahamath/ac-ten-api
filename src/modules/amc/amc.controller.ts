import { Request, Response, NextFunction } from 'express';
import { AmcService } from './amc.service.js';
import {
  createAmcContractSchema,
  updateAmcContractSchema,
  updateAmcStatusSchema,
  addContractPropertySchema,
  addContractServiceSchema,
  updateScheduleStatusSchema,
  recordPaymentSchema,
  listAmcContractsQuerySchema,
  listSchedulesQuerySchema,
  listPaymentsQuerySchema,
} from './amc.schema.js';

const amcService = new AmcService();

export class AmcController {
  // ==================== CONTRACTS ====================

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = createAmcContractSchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const contract = await amcService.create(input, userId);
      res.status(201).json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contract = await amcService.findById(id);
      res.json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listAmcContractsQuerySchema.parse(req.query);
      const result = await amcService.findAll(query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = updateAmcContractSchema.parse(req.body);
      const contract = await amcService.update(id, input);
      res.json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = updateAmcStatusSchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const contract = await amcService.updateStatus(id, input, userId);
      res.json({ success: true, data: contract });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await amcService.delete(id);
      res.json({ success: true, message: 'Contract deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== PROPERTIES ====================

  async addProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = addContractPropertySchema.parse(req.body);
      const property = await amcService.addProperty(id, input);
      res.status(201).json({ success: true, data: property });
    } catch (error) {
      next(error);
    }
  }

  async removeProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, propertyId } = req.params;
      await amcService.removeProperty(id, propertyId);
      res.json({ success: true, message: 'Property removed from contract' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== SERVICES ====================

  async addService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const input = addContractServiceSchema.parse(req.body);
      const service = await amcService.addService(id, input);
      res.status(201).json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  }

  async removeService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, serviceId } = req.params;
      await amcService.removeService(id, serviceId);
      res.json({ success: true, message: 'Service removed from contract' });
    } catch (error) {
      next(error);
    }
  }

  // ==================== SCHEDULES ====================

  async getSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listSchedulesQuerySchema.parse(req.query);
      const result = await amcService.getSchedules(query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async generateSchedules(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await amcService.generateSchedules(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateScheduleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { scheduleId } = req.params;
      const input = updateScheduleStatusSchema.parse(req.body);
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const schedule = await amcService.updateScheduleStatus(scheduleId, input, userId);
      res.json({ success: true, data: schedule });
    } catch (error) {
      next(error);
    }
  }

  // ==================== PAYMENTS ====================

  async getPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const query = listPaymentsQuerySchema.parse(req.query);
      const result = await amcService.getPayments(query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async generatePaymentSchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await amcService.generatePaymentSchedule(id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { paymentId } = req.params;
      const input = recordPaymentSchema.parse(req.body);
      const payment = await amcService.recordPayment(paymentId, input);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }

  // ==================== DASHBOARD & RENEWAL ====================

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await amcService.getDashboardStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  async renewContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }
      const newContract = await amcService.renewContract(id, userId);
      res.status(201).json({ success: true, data: newContract });
    } catch (error) {
      next(error);
    }
  }
}
