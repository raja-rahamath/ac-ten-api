import { Router } from 'express';
import { CustomerPropertyController } from './customer-property.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createCustomerPropertySchema,
  updateCustomerPropertySchema,
  getCustomerPropertySchema,
  listCustomerPropertiesSchema,
  getCustomerPropertiesByCustomerSchema,
  getPropertyCustomersSchema,
  transferPropertySchema,
} from './customer-property.schema.js';

const router = Router();
const controller = new CustomerPropertyController();

// All routes require authentication
router.use(authenticate);

// Create new customer-property relationship
router.post(
  '/',
  authorize('customer-properties:write'),
  validate(createCustomerPropertySchema),
  controller.create.bind(controller)
);

// List all customer-property relationships (with filters)
router.get(
  '/',
  authorize('customer-properties:read'),
  validate(listCustomerPropertiesSchema),
  controller.findAll.bind(controller)
);

// Get properties for a specific customer
router.get(
  '/by-customer/:customerId',
  authorize('customer-properties:read'),
  validate(getCustomerPropertiesByCustomerSchema),
  controller.findByCustomer.bind(controller)
);

// Get customers for a specific property
router.get(
  '/by-property/:propertyId',
  authorize('customer-properties:read'),
  validate(getPropertyCustomersSchema),
  controller.findByProperty.bind(controller)
);

// Get a specific customer-property relationship
router.get(
  '/:id',
  authorize('customer-properties:read'),
  validate(getCustomerPropertySchema),
  controller.findById.bind(controller)
);

// Update a customer-property relationship
router.put(
  '/:id',
  authorize('customer-properties:write'),
  validate(updateCustomerPropertySchema),
  controller.update.bind(controller)
);

// Deactivate a customer-property relationship (soft delete)
router.post(
  '/:id/deactivate',
  authorize('customer-properties:write'),
  validate(getCustomerPropertySchema),
  controller.deactivate.bind(controller)
);

// Transfer property to a new customer
router.post(
  '/:id/transfer',
  authorize('customer-properties:write'),
  validate(transferPropertySchema),
  controller.transfer.bind(controller)
);

// Get service request history for a customer-property relationship
router.get(
  '/:id/service-history',
  authorize('customer-properties:read'),
  validate(getCustomerPropertySchema),
  controller.getServiceHistory.bind(controller)
);

// Hard delete (only if no linked service requests)
router.delete(
  '/:id',
  authorize('customer-properties:delete'),
  validate(getCustomerPropertySchema),
  controller.delete.bind(controller)
);

export default router;
