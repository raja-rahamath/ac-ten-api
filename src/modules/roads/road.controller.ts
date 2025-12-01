import { Request, Response, NextFunction } from 'express';
import { RoadService } from './road.service.js';
import { CreateRoadInput, UpdateRoadInput, ListRoadsQuery } from './road.schema.js';

const roadService = new RoadService();

export class RoadController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const road = await roadService.create(req.body as CreateRoadInput);
      res.status(201).json({
        success: true,
        data: road,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const road = await roadService.findById(req.params.id);
      res.json({
        success: true,
        data: road,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roadService.findAll(req.query as unknown as ListRoadsQuery);
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
      const road = await roadService.update(req.params.id, req.body as UpdateRoadInput);
      res.json({
        success: true,
        data: road,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await roadService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
