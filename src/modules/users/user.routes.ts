import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  listUsersSchema,
} from './user.schema.js';

const router = Router();
const controller = new UserController();

router.use(authenticate);

router.post(
  '/',
  authorize('users:write'),
  validate(createUserSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('users:read'),
  validate(listUsersSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('users:read'),
  validate(getUserSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('users:write'),
  validate(updateUserSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('users:delete'),
  validate(getUserSchema),
  controller.delete.bind(controller)
);

export default router;
