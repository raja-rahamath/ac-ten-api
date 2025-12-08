import { Request, Response, NextFunction } from 'express';
import { SiteVisitService } from './site-visit.service.js';
import {
  createSiteVisitSchema,
  updateSiteVisitSchema,
  completeSiteVisitSchema,
  rescheduleSiteVisitSchema,
  siteVisitQuerySchema,
  awaitingPartsSchema,
  addMaterialSchema,
} from './site-visit.schema.js';

const siteVisitService = new SiteVisitService();

export class SiteVisitController {
  // Create site visit
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createSiteVisitSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.create(data, userId);
      return res.status(201).json(siteVisit);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // Get all site visits
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = siteVisitQuerySchema.parse(req.query);
      const result = await siteVisitService.getAll(query);
      return res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      next(error);
    }
  }

  // Get site visit by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const siteVisit = await siteVisitService.getById(id);

      if (!siteVisit) {
        return res.status(404).json({ error: 'Site visit not found' });
      }

      return res.json(siteVisit);
    } catch (error) {
      next(error);
    }
  }

  // Update site visit
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateSiteVisitSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.update(id, data, userId);
      return res.json(siteVisit);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Cannot update')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Start site visit
  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.start(id, userId, notes);
      return res.json(siteVisit);
    } catch (error: any) {
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('cannot be started')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Complete site visit
  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = completeSiteVisitSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.complete(id, data, userId);
      return res.json(siteVisit);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only in-progress')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Reschedule site visit
  async reschedule(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = rescheduleSiteVisitSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.reschedule(id, data, userId);
      return res.json(siteVisit);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Cannot reschedule')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Mark as no access
  async markNoAccess(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.markNoAccess(id, userId, reason);
      return res.json(siteVisit);
    } catch (error: any) {
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('cannot be changed')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Cancel site visit
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.cancel(id, userId, reason);
      return res.json(siteVisit);
    } catch (error: any) {
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('cannot be cancelled')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Delete site visit
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await siteVisitService.delete(id);
      return res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only scheduled')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Get site visits for a service request
  async getByServiceRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { serviceRequestId } = req.params;
      const siteVisits = await siteVisitService.getByServiceRequest(serviceRequestId);
      return res.json(siteVisits);
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await siteVisitService.getStats();
      return res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Mark site visit as awaiting parts
  async markAwaitingParts(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = awaitingPartsSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.markAwaitingParts(id, data, userId);
      return res.json(siteVisit);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only in-progress')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Resume site visit (from awaiting parts)
  async resume(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const siteVisit = await siteVisitService.resume(id, userId, notes);
      return res.json(siteVisit);
    } catch (error: any) {
      if (error.message === 'Site visit not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Only site visits awaiting parts')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Add material to site visit
  async addMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = addMaterialSchema.parse(req.body);
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const material = await siteVisitService.addMaterial(id, data, userId);
      return res.status(201).json(material);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      if (error.message === 'Site visit not found' || error.message === 'Inventory item not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Either itemId or itemName')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }

  // Get materials for site visit
  async getMaterials(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const materials = await siteVisitService.getMaterials(id);
      return res.json(materials);
    } catch (error) {
      next(error);
    }
  }

  // Remove material from site visit
  async removeMaterial(req: Request, res: Response, next: NextFunction) {
    try {
      const { materialId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await siteVisitService.removeMaterial(materialId, userId);
      return res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Material usage not found') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('Cannot remove material')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
}
