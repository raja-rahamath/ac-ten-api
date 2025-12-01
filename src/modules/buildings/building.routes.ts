import { Router } from 'express';
import { BuildingController } from './building.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createBuildingSchema,
  updateBuildingSchema,
  getBuildingSchema,
  listBuildingsSchema,
  bulkCreateUnitsSchema,
  listPropertiesSchema,
} from './building.schema.js';

const router = Router();
const controller = new BuildingController();

router.use(authenticate);

router.post(
  '/',
  authorize('buildings:write'),
  validate(createBuildingSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('buildings:read'),
  validate(listBuildingsSchema),
  controller.findAll.bind(controller)
);

// Flattened properties list (buildings + units combined)
router.get(
  '/properties',
  authorize('buildings:read'),
  validate(listPropertiesSchema),
  controller.findAllProperties.bind(controller)
);

router.get(
  '/:id',
  authorize('buildings:read'),
  validate(getBuildingSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('buildings:write'),
  validate(updateBuildingSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('buildings:delete'),
  validate(getBuildingSchema),
  controller.delete.bind(controller)
);

// Bulk create units for a building
router.post(
  '/:id/units/bulk',
  authorize('units:write'),
  validate(bulkCreateUnitsSchema),
  controller.bulkCreateUnits.bind(controller)
);

export default router;
