import { Request, Response, NextFunction } from 'express';
import { UnitTypeService } from './unit-type.service.js';
import { CreateUnitTypeInput, UpdateUnitTypeInput, ListUnitTypesQuery } from './unit-type.schema.js';

const unitTypeService = new UnitTypeService();

export class UnitTypeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const unitType = await unitTypeService.create(req.body as CreateUnitTypeInput);
      res.status(201).json({
        success: true,
        data: unitType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const unitType = await unitTypeService.findById(req.params.id);
      res.json({
        success: true,
        data: unitType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await unitTypeService.findAll(req.query as unknown as ListUnitTypesQuery);
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
      const unitType = await unitTypeService.update(req.params.id, req.body as UpdateUnitTypeInput);
      res.json({
        success: true,
        data: unitType,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await unitTypeService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
