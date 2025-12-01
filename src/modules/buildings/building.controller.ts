import { Request, Response, NextFunction } from 'express';
import { BuildingService } from './building.service.js';
import { CreateBuildingInput, UpdateBuildingInput, ListBuildingsQuery, BulkCreateUnitsInput, ListPropertiesQuery } from './building.schema.js';

const buildingService = new BuildingService();

export class BuildingController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const building = await buildingService.create(req.body as CreateBuildingInput);
      res.status(201).json({
        success: true,
        data: building,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const building = await buildingService.findById(req.params.id);
      res.json({
        success: true,
        data: building,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await buildingService.findAll(req.query as unknown as ListBuildingsQuery);
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
      const building = await buildingService.update(req.params.id, req.body as UpdateBuildingInput);
      res.json({
        success: true,
        data: building,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await buildingService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkCreateUnits(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await buildingService.bulkCreateUnits(
        req.params.id,
        req.body as BulkCreateUnitsInput
      );
      res.status(201).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAllProperties(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await buildingService.findAllProperties(req.query as unknown as ListPropertiesQuery);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
