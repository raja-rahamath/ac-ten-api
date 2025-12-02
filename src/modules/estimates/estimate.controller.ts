import { Request, Response, NextFunction } from 'express';
import { EstimateService } from './estimate.service.js';
import {
  createEstimateSchema,
  updateEstimateSchema,
  submitEstimateSchema,
  approveEstimateSchema,
  rejectEstimateSchema,
  requestRevisionSchema,
  convertToQuoteSchema,
  estimateQuerySchema,
} from './estimate.schema.js';

const estimateService = new EstimateService();

export class EstimateController {
  // Create estimate
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createEstimateSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const estimate = await estimateService.create(data, userId);
      return res.status(201).json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // Get all estimates
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = estimateQuerySchema.parse(req.query);
      const result = await estimateService.getAll(query);
      return res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // Get estimate by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const estimate = await estimateService.getById(id);

      if (!estimate) {
        return res.status(404).json({ error: 'Estimate not found' });
      }

      return res.json(estimate);
    } catch (error) {
      next(error);
    }
  }

  // Update estimate
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateEstimateSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const estimate = await estimateService.update(id, data, userId);
      return res.json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Estimate not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only draft')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Submit for approval
  async submitForApproval(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = submitEstimateSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const estimate = await estimateService.submitForApproval(id, userId, data.notes);
      return res.json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Estimate not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only draft')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Approve estimate (manager action)
  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = approveEstimateSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const estimate = await estimateService.approve(id, userId, data.notes);
      return res.json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Estimate not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only pending')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Reject estimate (manager action)
  async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = rejectEstimateSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const estimate = await estimateService.reject(id, userId, data.reason);
      return res.json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Estimate not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only pending')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Request revision (manager action)
  async requestRevision(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = requestRevisionSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const estimate = await estimateService.requestRevision(id, userId, data.reason, data.notes);
      return res.json(estimate);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Estimate not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only pending')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Convert to quote
  async convertToQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = convertToQuoteSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const quote = await estimateService.convertToQuote(id, data, userId);
      return res.json(quote);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Estimate not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only approved')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Cancel estimate
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const estimate = await estimateService.cancel(id, userId, reason);
      return res.json(estimate);
    } catch (error: any) {
      if (error.message === 'Estimate not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('cannot be cancelled')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Delete estimate
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await estimateService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Estimate not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only draft')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Get statistics
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await estimateService.getStats();
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
