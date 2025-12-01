import { Router } from 'express';
import { UnitTypeController } from './unit-type.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createUnitTypeSchema,
  updateUnitTypeSchema,
  getUnitTypeSchema,
  listUnitTypesSchema,
} from './unit-type.schema.js';

const router = Router();
const controller = new UnitTypeController();

router.use(authenticate);

router.post(
  '/',
  authorize('unit-types:write'),
  validate(createUnitTypeSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('unit-types:read'),
  validate(listUnitTypesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('unit-types:read'),
  validate(getUnitTypeSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('unit-types:write'),
  validate(updateUnitTypeSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('unit-types:delete'),
  validate(getUnitTypeSchema),
  controller.delete.bind(controller)
);

export default router;
