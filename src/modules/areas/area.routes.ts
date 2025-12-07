import { Router } from 'express';
import { AreaController } from './area.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createAreaSchema,
  updateAreaSchema,
  getAreaSchema,
  listAreasSchema,
} from './area.schema.js';

const router = Router();
const controller = new AreaController();

router.use(authenticate);

router.post(
  '/',
  authorize('zones:write'),
  validate(createAreaSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('zones:read'),
  validate(listAreasSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('zones:read'),
  validate(getAreaSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('zones:write'),
  validate(updateAreaSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('zones:delete'),
  validate(getAreaSchema),
  controller.delete.bind(controller)
);

export default router;
