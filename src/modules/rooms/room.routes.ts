import { Router } from 'express';
import { RoomController } from './room.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createRoomSchema,
  updateRoomSchema,
  getRoomSchema,
  listRoomsSchema,
  bulkCreateRoomsSchema,
} from './room.schema.js';

const router = Router();
const controller = new RoomController();

router.use(authenticate);

// Create a room
router.post(
  '/',
  authorize('rooms:write'),
  validate(createRoomSchema),
  controller.create.bind(controller)
);

// List all rooms (with filters)
router.get(
  '/',
  authorize('rooms:read'),
  validate(listRoomsSchema),
  controller.findAll.bind(controller)
);

// Get rooms by unit ID
router.get(
  '/unit/:unitId',
  authorize('rooms:read'),
  controller.findByUnitId.bind(controller)
);

// Bulk create rooms for a unit
router.post(
  '/unit/:unitId/bulk',
  authorize('rooms:write'),
  validate(bulkCreateRoomsSchema),
  controller.bulkCreate.bind(controller)
);

// Get a single room
router.get(
  '/:id',
  authorize('rooms:read'),
  validate(getRoomSchema),
  controller.findById.bind(controller)
);

// Update a room
router.put(
  '/:id',
  authorize('rooms:write'),
  validate(updateRoomSchema),
  controller.update.bind(controller)
);

// Delete a room (soft delete)
router.delete(
  '/:id',
  authorize('rooms:delete'),
  validate(getRoomSchema),
  controller.delete.bind(controller)
);

export default router;
