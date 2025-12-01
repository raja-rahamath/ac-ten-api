import { Request, Response, NextFunction } from 'express';
import { UnitService } from './unit.service.js';
import { CreateUnitInput, UpdateUnitInput, ListUnitsQuery } from './unit.schema.js';

const unitService = new UnitService();

export class UnitController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const unit = await unitService.create(req.body as CreateUnitInput);
      res.status(201).json({
        success: true,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const unit = await unitService.findById(req.params.id);
      res.json({
        success: true,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await unitService.findAll(req.query as unknown as ListUnitsQuery);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const unit = await unitService.update(req.params.id, req.body as UpdateUnitInput);
      res.json({
        success: true,
        data: unit,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await unitService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
