import { Router } from 'express';
import { PropertyTypeController } from './property-type.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createPropertyTypeSchema,
  updatePropertyTypeSchema,
  getPropertyTypeSchema,
  listPropertyTypesSchema,
} from './property-type.schema.js';

const router = Router();
const controller = new PropertyTypeController();

router.use(authenticate);

router.post(
  '/',
  authorize('property-types:write'),
  validate(createPropertyTypeSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('property-types:read'),
  validate(listPropertyTypesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/tree',
  authorize('property-types:read'),
  controller.getTree.bind(controller)
);

router.get(
  '/:id',
  authorize('property-types:read'),
  validate(getPropertyTypeSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('property-types:write'),
  validate(updatePropertyTypeSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('property-types:delete'),
  validate(getPropertyTypeSchema),
  controller.delete.bind(controller)
);

export default router;
