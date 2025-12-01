import { Request, Response, NextFunction } from 'express';
import { GovernorateService } from './governorate.service.js';
import { CreateGovernorateInput, UpdateGovernorateInput, ListGovernoratesQuery } from './governorate.schema.js';

const governorateService = new GovernorateService();

export class GovernorateController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const governorate = await governorateService.create(req.body as CreateGovernorateInput);
      res.status(201).json({
        success: true,
        data: governorate,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const governorate = await governorateService.findById(req.params.id);
      res.json({
        success: true,
        data: governorate,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await governorateService.findAll(req.query as unknown as ListGovernoratesQuery);
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
      const governorate = await governorateService.update(req.params.id, req.body as UpdateGovernorateInput);
      res.json({
        success: true,
        data: governorate,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await governorateService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
