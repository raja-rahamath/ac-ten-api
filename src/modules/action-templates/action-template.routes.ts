import { Router } from 'express';
import { ActionTemplateController } from './action-template.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createActionTemplateSchema,
  updateActionTemplateSchema,
  getActionTemplateSchema,
  listActionTemplatesSchema,
} from './action-template.schema.js';

const router = Router();
const controller = new ActionTemplateController();

router.use(authenticate);

router.post(
  '/',
  authorize('action-templates:write'),
  validate(createActionTemplateSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('action-templates:read'),
  validate(listActionTemplatesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('action-templates:read'),
  validate(getActionTemplateSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('action-templates:write'),
  validate(updateActionTemplateSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('action-templates:delete'),
  validate(getActionTemplateSchema),
  controller.delete.bind(controller)
);

export default router;
