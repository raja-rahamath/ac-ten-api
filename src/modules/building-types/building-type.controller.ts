import { Request, Response, NextFunction } from 'express';
import { BuildingTypeService } from './building-type.service.js';
import { CreateBuildingTypeInput, UpdateBuildingTypeInput, ListBuildingTypesQuery } from './building-type.schema.js';

const buildingTypeService = new BuildingTypeService();

export class BuildingTypeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const buildingType = await buildingTypeService.create(req.body as CreateBuildingTypeInput);
      res.status(201).json({
        success: true,
        data: buildingType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const buildingType = await buildingTypeService.findById(req.params.id);
      res.json({
        success: true,
        data: buildingType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await buildingTypeService.findAll(req.query as unknown as ListBuildingTypesQuery);
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
      const buildingType = await buildingTypeService.update(req.params.id, req.body as UpdateBuildingTypeInput);
      res.json({
        success: true,
        data: buildingType,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await buildingTypeService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
