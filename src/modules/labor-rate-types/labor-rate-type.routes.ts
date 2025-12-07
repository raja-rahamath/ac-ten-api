import { Router } from 'express';
import { LaborRateTypeController } from './labor-rate-type.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createLaborRateTypeSchema,
  updateLaborRateTypeSchema,
  getLaborRateTypeSchema,
  listLaborRateTypesSchema,
} from './labor-rate-type.schema.js';

const router = Router();
const controller = new LaborRateTypeController();

router.use(authenticate);

router.post(
  '/',
  authorize('labor-rate-types:write'),
  validate(createLaborRateTypeSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('labor-rate-types:read'),
  validate(listLaborRateTypesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('labor-rate-types:read'),
  validate(getLaborRateTypeSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('labor-rate-types:write'),
  validate(updateLaborRateTypeSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('labor-rate-types:delete'),
  validate(getLaborRateTypeSchema),
  controller.delete.bind(controller)
);

export default router;
