import { Router } from 'express';
import { RoadController } from './road.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createRoadSchema,
  updateRoadSchema,
  getRoadSchema,
  listRoadsSchema,
} from './road.schema.js';

const router = Router();
const controller = new RoadController();

router.use(authenticate);

router.post(
  '/',
  authorize('roads:write'),
  validate(createRoadSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('roads:read'),
  validate(listRoadsSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('roads:read'),
  validate(getRoadSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('roads:write'),
  validate(updateRoadSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('roads:delete'),
  validate(getRoadSchema),
  controller.delete.bind(controller)
);

export default router;
