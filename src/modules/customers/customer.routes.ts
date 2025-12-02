import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  getCustomerSchema,
  listCustomersSchema,
  linkUnitSchema,
  unlinkUnitSchema,
} from './customer.schema.js';

const router = Router();
const controller = new CustomerController();

// All routes require authentication
router.use(authenticate);

router.post(
  '/',
  authorize('customers:write'),
  validate(createCustomerSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('customers:read'),
  validate(listCustomersSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('customers:read'),
  validate(getCustomerSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('customers:write'),
  validate(updateCustomerSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('customers:delete'),
  validate(getCustomerSchema),
  controller.delete.bind(controller)
);

// Link/unlink units (properties) to customer
router.post(
  '/:id/units',
  authorize('customers:write'),
  validate(linkUnitSchema),
  controller.linkUnit.bind(controller)
);

router.delete(
  '/:id/units/:unitId',
  authorize('customers:write'),
  validate(unlinkUnitSchema),
  controller.unlinkUnit.bind(controller)
);

export default router;
