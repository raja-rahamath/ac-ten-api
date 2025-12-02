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

// Attachment routes
router.post(
  '/:id/attachments',
  authorize('service_requests:write'),
  controller.addAttachment.bind(controller)
);

router.get(
  '/:id/attachments',
  authorize('service_requests:read'),
  controller.getAttachments.bind(controller)
);

router.delete(
  '/:id/attachments/:attachmentId',
  authorize('service_requests:write'),
  controller.deleteAttachment.bind(controller)
);

// Asset linking routes
router.post(
  '/:id/asset',
  authorize('service_requests:write'),
  controller.linkAsset.bind(controller)
);

router.delete(
  '/:id/asset',
  authorize('service_requests:write'),
  controller.unlinkAsset.bind(controller)
);

export default router;
