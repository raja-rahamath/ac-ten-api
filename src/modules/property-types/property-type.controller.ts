import { Request, Response, NextFunction } from 'express';
import { PropertyTypeService } from './property-type.service.js';
import { CreatePropertyTypeInput, UpdatePropertyTypeInput, ListPropertyTypesQuery } from './property-type.schema.js';

const propertyTypeService = new PropertyTypeService();

export class PropertyTypeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyType = await propertyTypeService.create(req.body as CreatePropertyTypeInput);
      res.status(201).json({
        success: true,
        data: propertyType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyType = await propertyTypeService.findById(req.params.id);
      res.json({
        success: true,
        data: propertyType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await propertyTypeService.findAll(req.query as unknown as ListPropertyTypesQuery);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTree(req: Request, res: Response, next: NextFunction) {
    try {
      const tree = await propertyTypeService.getTree();
      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const propertyType = await propertyTypeService.update(req.params.id, req.body as UpdatePropertyTypeInput);
      res.json({
        success: true,
        data: propertyType,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await propertyTypeService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
