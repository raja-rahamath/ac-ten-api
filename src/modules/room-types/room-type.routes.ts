import { Router } from 'express';
import { RoomTypeController } from './room-type.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createRoomTypeSchema,
  updateRoomTypeSchema,
  getRoomTypeSchema,
  listRoomTypesSchema,
} from './room-type.schema.js';

const router = Router();
const controller = new RoomTypeController();

router.use(authenticate);

router.post(
  '/',
  authorize('room-types:write'),
  validate(createRoomTypeSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('room-types:read'),
  validate(listRoomTypesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('room-types:read'),
  validate(getRoomTypeSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('room-types:write'),
  validate(updateRoomTypeSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('room-types:delete'),
  validate(getRoomTypeSchema),
  controller.delete.bind(controller)
);

export default router;
