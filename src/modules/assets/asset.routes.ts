import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import {
  createAsset,
  getAsset,
  listAssets,
  getAssetsByUnit,
  getAssetsByRoom,
  updateAsset,
  deleteAsset,
  updateAssetCondition,
  updateAssetStatus,
} from './asset.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List assets (with filtering)
router.get('/', listAssets);

// Get assets by unit
router.get('/unit/:unitId', getAssetsByUnit);

// Get assets by room
router.get('/room/:roomId', getAssetsByRoom);

// Get single asset
router.get('/:id', getAsset);

// Create asset
router.post('/', createAsset);

// Update asset
router.put('/:id', updateAsset);
router.patch('/:id', updateAsset);

// Update condition only
router.patch('/:id/condition', updateAssetCondition);

// Update status only
router.patch('/:id/status', updateAssetStatus);

// Delete asset (soft delete)
router.delete('/:id', deleteAsset);

export default router;
