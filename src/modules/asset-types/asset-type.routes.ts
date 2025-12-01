import { Router } from 'express';
import { AssetTypeController } from './asset-type.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createAssetTypeSchema,
  updateAssetTypeSchema,
  getAssetTypeSchema,
  listAssetTypesSchema,
} from './asset-type.schema.js';

const router = Router();
const controller = new AssetTypeController();

router.use(authenticate);

router.post(
  '/',
  authorize('asset-types:write'),
  validate(createAssetTypeSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('asset-types:read'),
  validate(listAssetTypesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('asset-types:read'),
  validate(getAssetTypeSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('asset-types:write'),
  validate(updateAssetTypeSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('asset-types:delete'),
  validate(getAssetTypeSchema),
  controller.delete.bind(controller)
);

export default router;
