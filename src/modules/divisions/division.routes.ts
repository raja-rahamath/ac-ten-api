import { Router } from 'express';
import { DivisionController } from './division.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createDivisionSchema,
  updateDivisionSchema,
  getDivisionSchema,
  listDivisionsSchema,
} from './division.schema.js';

const router = Router();
const controller = new DivisionController();

router.use(authenticate);

router.post(
  '/',
  authorize('divisions:write'),
  validate(createDivisionSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('divisions:read'),
  validate(listDivisionsSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('divisions:read'),
  validate(getDivisionSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('divisions:write'),
  validate(updateDivisionSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('divisions:delete'),
  validate(getDivisionSchema),
  controller.delete.bind(controller)
);

export default router;
