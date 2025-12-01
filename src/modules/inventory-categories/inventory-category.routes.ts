import { Router } from 'express';
import { InventoryCategoryController } from './inventory-category.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createInventoryCategorySchema,
  updateInventoryCategorySchema,
  getInventoryCategorySchema,
  listInventoryCategoriesSchema,
} from './inventory-category.schema.js';

const router = Router();
const controller = new InventoryCategoryController();

router.use(authenticate);

router.post(
  '/',
  authorize('inventory:write'),
  validate(createInventoryCategorySchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('inventory:read'),
  validate(listInventoryCategoriesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('inventory:read'),
  validate(getInventoryCategorySchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('inventory:write'),
  validate(updateInventoryCategorySchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('inventory:delete'),
  validate(getInventoryCategorySchema),
  controller.delete.bind(controller)
);

export default router;
