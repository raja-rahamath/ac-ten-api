import { Router } from 'express';
import { JobTitleController } from './job-title.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createJobTitleSchema,
  updateJobTitleSchema,
  getJobTitleSchema,
  listJobTitlesSchema,
} from './job-title.schema.js';

const router = Router();
const controller = new JobTitleController();

router.use(authenticate);

router.post(
  '/',
  authorize('job-titles:write'),
  validate(createJobTitleSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('job-titles:read'),
  validate(listJobTitlesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('job-titles:read'),
  validate(getJobTitleSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('job-titles:write'),
  validate(updateJobTitleSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('job-titles:delete'),
  validate(getJobTitleSchema),
  controller.delete.bind(controller)
);

export default router;
