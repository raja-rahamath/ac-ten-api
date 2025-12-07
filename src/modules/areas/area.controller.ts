import { Request, Response, NextFunction } from 'express';
import { AreaService } from './area.service.js';
import { CreateAreaInput, UpdateAreaInput, ListAreasQuery } from './area.schema.js';

const areaService = new AreaService();

export class AreaController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await areaService.create(req.body as CreateAreaInput);
      res.status(201).json({
        success: true,
        data: area,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const area = await areaService.findById(req.params.id);
      res.json({
        success: true,
        data: area,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await areaService.findAll(req.query as unknown as ListAreasQuery);
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
      const area = await areaService.update(req.params.id, req.body as UpdateAreaInput);
      res.json({
        success: true,
        data: area,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await areaService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
