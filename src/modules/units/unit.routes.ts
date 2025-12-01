import { Router } from 'express';
import { UnitController } from './unit.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createUnitSchema,
  updateUnitSchema,
  getUnitSchema,
  listUnitsSchema,
} from './unit.schema.js';

const router = Router();
const controller = new UnitController();

router.use(authenticate);

router.post(
  '/',
  authorize('units:write'),
  validate(createUnitSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('units:read'),
  validate(listUnitsSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('units:read'),
  validate(getUnitSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('units:write'),
  validate(updateUnitSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('units:delete'),
  validate(getUnitSchema),
  controller.delete.bind(controller)
);

export default router;
