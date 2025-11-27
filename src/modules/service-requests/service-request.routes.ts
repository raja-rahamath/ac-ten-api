import { Router } from 'express';
import { ServiceRequestController } from './service-request.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createServiceRequestSchema,
  updateServiceRequestSchema,
  assignServiceRequestSchema,
  getServiceRequestSchema,
  listServiceRequestsSchema,
} from './service-request.schema.js';

const router = Router();
const controller = new ServiceRequestController();

router.use(authenticate);

router.post(
  '/',
  authorize('service_requests:write'),
  validate(createServiceRequestSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('service_requests:read'),
  validate(listServiceRequestsSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/stats',
  authorize('service_requests:read'),
  controller.getStats.bind(controller)
);

router.get(
  '/:id',
  authorize('service_requests:read'),
  validate(getServiceRequestSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('service_requests:write'),
  validate(updateServiceRequestSchema),
  controller.update.bind(controller)
);

router.post(
  '/:id/assign',
  authorize('service_requests:assign'),
  validate(assignServiceRequestSchema),
  controller.assign.bind(controller)
);

router.delete(
  '/:id',
  authorize('service_requests:delete'),
  validate(getServiceRequestSchema),
  controller.delete.bind(controller)
);

export default router;
