import { Request, Response, NextFunction } from 'express';
import { InventoryCategoryService } from './inventory-category.service.js';
import { CreateInventoryCategoryInput, UpdateInventoryCategoryInput, ListInventoryCategoriesQuery } from './inventory-category.schema.js';

const inventoryCategoryService = new InventoryCategoryService();

export class InventoryCategoryController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await inventoryCategoryService.create(req.body as CreateInventoryCategoryInput);
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await inventoryCategoryService.findById(req.params.id);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryCategoryService.findAll(req.query as unknown as ListInventoryCategoriesQuery);
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
      const category = await inventoryCategoryService.update(req.params.id, req.body as UpdateInventoryCategoryInput);
      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryCategoryService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
