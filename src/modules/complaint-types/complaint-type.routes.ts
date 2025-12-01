import { Router } from 'express';
import { ComplaintTypeController } from './complaint-type.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createComplaintTypeSchema,
  updateComplaintTypeSchema,
  getComplaintTypeSchema,
  listComplaintTypesSchema,
} from './complaint-type.schema.js';

const router = Router();
const controller = new ComplaintTypeController();

router.use(authenticate);

router.post(
  '/',
  authorize('complaint-types:write'),
  validate(createComplaintTypeSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('complaint-types:read'),
  validate(listComplaintTypesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('complaint-types:read'),
  validate(getComplaintTypeSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('complaint-types:write'),
  validate(updateComplaintTypeSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('complaint-types:delete'),
  validate(getComplaintTypeSchema),
  controller.delete.bind(controller)
);

export default router;
