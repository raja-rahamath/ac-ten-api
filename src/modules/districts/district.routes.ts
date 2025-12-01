import { Router } from 'express';
import { DistrictController } from './district.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createDistrictSchema,
  updateDistrictSchema,
  getDistrictSchema,
  listDistrictsSchema,
} from './district.schema.js';

const router = Router();
const controller = new DistrictController();

router.use(authenticate);

router.post(
  '/',
  authorize('districts:write'),
  validate(createDistrictSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('districts:read'),
  validate(listDistrictsSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('districts:read'),
  validate(getDistrictSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('districts:write'),
  validate(updateDistrictSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('districts:delete'),
  validate(getDistrictSchema),
  controller.delete.bind(controller)
);

export default router;
