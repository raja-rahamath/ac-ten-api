import { Request, Response, NextFunction } from 'express';
import { InventoryItemService } from './inventory-item.service.js';
import { CreateInventoryItemInput, UpdateInventoryItemInput, ListInventoryItemsQuery } from './inventory-item.schema.js';

const inventoryItemService = new InventoryItemService();

export class InventoryItemController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryItemService.create(req.body as CreateInventoryItemInput);
      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await inventoryItemService.findById(req.params.id);
      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryItemService.findAll(req.query as unknown as ListInventoryItemsQuery);
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
      const item = await inventoryItemService.update(req.params.id, req.body as UpdateInventoryItemInput);
      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await inventoryItemService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { quantity, type } = req.body;
      const item = await inventoryItemService.updateStock(req.params.id, quantity, type);
      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLowStockItems(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await inventoryItemService.getLowStockItems();
      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  }
}
