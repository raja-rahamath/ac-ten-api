import { Router } from 'express';
import { ServiceRequestController } from './service-request.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { uploadAttachment } from '../../middleware/upload.js';
import { requireMinimumSetup } from '../../middleware/requireOnboarding.js';
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
  requireMinimumSetup,
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

// Attachment routes (with file upload)
router.post(
  '/:id/attachments',
  authorize('service_requests:write'),
  uploadAttachment,
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

// Technician workflow routes
router.post(
  '/:id/start-route',
  authorize('service_requests:write'),
  controller.startRoute.bind(controller)
);

router.post(
  '/:id/arrive',
  authorize('service_requests:write'),
  controller.markArrived.bind(controller)
);

router.post(
  '/:id/start-work',
  authorize('service_requests:write'),
  controller.startWork.bind(controller)
);

router.post(
  '/:id/complete',
  authorize('service_requests:write'),
  controller.complete.bind(controller)
);

router.post(
  '/:id/clock-in',
  authorize('service_requests:write'),
  controller.clockIn.bind(controller)
);

router.post(
  '/:id/clock-out',
  authorize('service_requests:write'),
  controller.clockOut.bind(controller)
);

export default router;
