import { Request, Response, NextFunction } from 'express';
import { LaborRateTypeService } from './labor-rate-type.service.js';
import { CreateLaborRateTypeInput, UpdateLaborRateTypeInput, ListLaborRateTypesQuery } from './labor-rate-type.schema.js';

const laborRateTypeService = new LaborRateTypeService();

export class LaborRateTypeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const laborRateType = await laborRateTypeService.create(req.body as CreateLaborRateTypeInput);
      res.status(201).json({
        success: true,
        data: laborRateType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const laborRateType = await laborRateTypeService.findById(req.params.id);
      res.json({
        success: true,
        data: laborRateType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await laborRateTypeService.findAll(req.query as unknown as ListLaborRateTypesQuery);
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
      const laborRateType = await laborRateTypeService.update(req.params.id, req.body as UpdateLaborRateTypeInput);
      res.json({
        success: true,
        data: laborRateType,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await laborRateTypeService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
