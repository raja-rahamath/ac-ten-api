import { Request, Response, NextFunction } from 'express';
import { PropertyService } from './property.service.js';

const service = new PropertyService();

export class PropertyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const property = await service.create(req.body);
      res.status(201).json({
        success: true,
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.findAll(req.query as any);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const property = await service.findById(req.params.id);
      res.json({
        success: true,
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const property = await service.update(req.params.id, req.body);
      res.json({
        success: true,
        data: property,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async linkToCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, ownershipType } = req.body;
      const result = await service.linkToCustomer(req.params.id, customerId, ownershipType);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
