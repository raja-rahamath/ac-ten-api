import { Request, Response, NextFunction } from 'express';
import { AssetService } from './asset.service.js';
import {
  createAssetSchema,
  updateAssetSchema,
  getAssetSchema,
  listAssetsSchema,
  getAssetsByUnitSchema,
  getAssetsByRoomSchema,
} from './asset.schema.js';

const assetService = new AssetService();

export async function createAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = createAssetSchema.parse({ body: req.body });
    const asset = await assetService.create(validated.body);
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
}

export async function getAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = getAssetSchema.parse({ params: req.params });
    const asset = await assetService.findById(validated.params.id);
    res.json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
}

export async function listAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = listAssetsSchema.parse({ query: req.query });
    const result = await assetService.findAll(validated.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getAssetsByUnit(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = getAssetsByUnitSchema.parse({ params: req.params, query: req.query });
    const assets = await assetService.findByUnitId(validated.params.unitId, validated.query.roomId);
    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
}

export async function getAssetsByRoom(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = getAssetsByRoomSchema.parse({ params: req.params });
    const assets = await assetService.findByRoomId(validated.params.roomId);
    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
}

export async function updateAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = updateAssetSchema.parse({ params: req.params, body: req.body });
    const asset = await assetService.update(validated.params.id, validated.body);
    res.json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
}

export async function deleteAsset(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = getAssetSchema.parse({ params: req.params });
    const result = await assetService.delete(validated.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function updateAssetCondition(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { condition } = req.body;
    const asset = await assetService.updateCondition(id, condition);
    res.json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
}

export async function updateAssetStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const asset = await assetService.updateStatus(id, status);
    res.json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
}
