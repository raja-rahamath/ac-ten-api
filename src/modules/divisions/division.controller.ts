import { Request, Response, NextFunction } from 'express';
import { DivisionService } from './division.service.js';
import { CreateDivisionInput, UpdateDivisionInput, ListDivisionsQuery } from './division.schema.js';

const divisionService = new DivisionService();

export class DivisionController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const division = await divisionService.create(req.body as CreateDivisionInput);
      res.status(201).json({
        success: true,
        data: division,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const division = await divisionService.findById(req.params.id);
      res.json({
        success: true,
        data: division,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await divisionService.findAll(req.query as unknown as ListDivisionsQuery);
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
      const division = await divisionService.update(req.params.id, req.body as UpdateDivisionInput);
      res.json({
        success: true,
        data: division,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await divisionService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
