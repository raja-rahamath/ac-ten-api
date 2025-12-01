import { Router } from 'express';
import { StateController } from './state.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createStateSchema,
  updateStateSchema,
  getStateSchema,
  listStatesSchema,
} from './state.schema.js';

const router = Router();
const controller = new StateController();

router.use(authenticate);

router.post(
  '/',
  authorize('states:write'),
  validate(createStateSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('states:read'),
  validate(listStatesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('states:read'),
  validate(getStateSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('states:write'),
  validate(updateStateSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('states:delete'),
  validate(getStateSchema),
  controller.delete.bind(controller)
);

export default router;
