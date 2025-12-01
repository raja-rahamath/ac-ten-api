import { Router } from 'express';
import { BuildingTypeController } from './building-type.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createBuildingTypeSchema,
  updateBuildingTypeSchema,
  getBuildingTypeSchema,
  listBuildingTypesSchema,
} from './building-type.schema.js';

const router = Router();
const controller = new BuildingTypeController();

router.use(authenticate);

router.post(
  '/',
  authorize('building-types:write'),
  validate(createBuildingTypeSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('building-types:read'),
  validate(listBuildingTypesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('building-types:read'),
  validate(getBuildingTypeSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('building-types:write'),
  validate(updateBuildingTypeSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('building-types:delete'),
  validate(getBuildingTypeSchema),
  controller.delete.bind(controller)
);

export default router;
