import { Router } from 'express';
import { PropertyController } from './property.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createPropertySchema,
  updatePropertySchema,
  getPropertySchema,
  listPropertiesSchema,
} from './property.schema.js';

const router = Router();
const controller = new PropertyController();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  authorize('properties:write'),
  validate(createPropertySchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('properties:read'),
  validate(listPropertiesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('properties:read'),
  validate(getPropertySchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('properties:write'),
  validate(updatePropertySchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('properties:delete'),
  validate(getPropertySchema),
  controller.delete.bind(controller)
);

router.post(
  '/:id/link-customer',
  authorize('properties:write'),
  controller.linkToCustomer.bind(controller)
);

export default router;
