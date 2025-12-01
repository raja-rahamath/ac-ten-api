import { Router } from 'express';
import { SectionController } from './section.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createSectionSchema,
  updateSectionSchema,
  getSectionSchema,
  listSectionsSchema,
} from './section.schema.js';

const router = Router();
const controller = new SectionController();

router.use(authenticate);

router.post(
  '/',
  authorize('sections:write'),
  validate(createSectionSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('sections:read'),
  validate(listSectionsSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('sections:read'),
  validate(getSectionSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('sections:write'),
  validate(updateSectionSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('sections:delete'),
  validate(getSectionSchema),
  controller.delete.bind(controller)
);

export default router;
