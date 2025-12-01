import { Router } from 'express';
import { GovernorateController } from './governorate.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createGovernorateSchema,
  updateGovernorateSchema,
  getGovernorateSchema,
  listGovernoratesSchema,
} from './governorate.schema.js';

const router = Router();
const controller = new GovernorateController();

router.use(authenticate);

router.post(
  '/',
  authorize('governorates:write'),
  validate(createGovernorateSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('governorates:read'),
  validate(listGovernoratesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('governorates:read'),
  validate(getGovernorateSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('governorates:write'),
  validate(updateGovernorateSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('governorates:delete'),
  validate(getGovernorateSchema),
  controller.delete.bind(controller)
);

export default router;
