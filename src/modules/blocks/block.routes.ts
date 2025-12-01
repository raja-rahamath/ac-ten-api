import { Router } from 'express';
import { BlockController } from './block.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createBlockSchema,
  updateBlockSchema,
  getBlockSchema,
  listBlocksSchema,
} from './block.schema.js';

const router = Router();
const controller = new BlockController();

router.use(authenticate);

router.post(
  '/',
  authorize('blocks:write'),
  validate(createBlockSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('blocks:read'),
  validate(listBlocksSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('blocks:read'),
  validate(getBlockSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('blocks:write'),
  validate(updateBlockSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('blocks:delete'),
  validate(getBlockSchema),
  controller.delete.bind(controller)
);

export default router;
