import { Router } from 'express';
import { InventoryItemController } from './inventory-item.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  getInventoryItemSchema,
  listInventoryItemsSchema,
} from './inventory-item.schema.js';
import { z } from 'zod';

const router = Router();
const controller = new InventoryItemController();

router.use(authenticate);

// Get low stock items
router.get(
  '/low-stock',
  authorize('inventory-items:read'),
  controller.getLowStockItems.bind(controller)
);

router.post(
  '/',
  authorize('inventory-items:write'),
  validate(createInventoryItemSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('inventory-items:read'),
  validate(listInventoryItemsSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('inventory-items:read'),
  validate(getInventoryItemSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('inventory-items:write'),
  validate(updateInventoryItemSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('inventory-items:delete'),
  validate(getInventoryItemSchema),
  controller.delete.bind(controller)
);

// Update stock quantity
const updateStockSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    quantity: z.number().int().positive(),
    type: z.enum(['add', 'subtract']),
  }),
});

router.post(
  '/:id/stock',
  authorize('inventory-items:write'),
  validate(updateStockSchema),
  controller.updateStock.bind(controller)
);

export default router;
