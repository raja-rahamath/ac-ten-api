import { Request, Response, NextFunction } from 'express';
import { AssetTypeService } from './asset-type.service.js';
import { CreateAssetTypeInput, UpdateAssetTypeInput, ListAssetTypesQuery } from './asset-type.schema.js';

const assetTypeService = new AssetTypeService();

export class AssetTypeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const assetType = await assetTypeService.create(req.body as CreateAssetTypeInput);
      res.status(201).json({
        success: true,
        data: assetType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const assetType = await assetTypeService.findById(req.params.id);
      res.json({
        success: true,
        data: assetType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetTypeService.findAll(req.query as unknown as ListAssetTypesQuery);
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
      const assetType = await assetTypeService.update(req.params.id, req.body as UpdateAssetTypeInput);
      res.json({
        success: true,
        data: assetType,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await assetTypeService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
