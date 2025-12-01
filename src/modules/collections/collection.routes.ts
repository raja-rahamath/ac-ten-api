import { Router } from 'express';
import { CollectionController } from './collection.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  listCollectionsSchema,
  getCollectionSchema,
  updateCollectionSchema,
  voidCollectionSchema,
  collectionDailyReportSchema,
} from './collection.schema.js';

const router = Router();
const controller = new CollectionController();

router.use(authenticate);

// Get collection stats
router.get(
  '/stats',
  authorize('collections:read'),
  controller.getStats.bind(controller)
);

// Get daily collection report
router.get(
  '/daily-report',
  authorize('collections:read'),
  validate(collectionDailyReportSchema),
  controller.getDailyReport.bind(controller)
);

// Get collectors list
router.get(
  '/collectors',
  authorize('collections:read'),
  controller.getCollectors.bind(controller)
);

// List all collections
router.get(
  '/',
  authorize('collections:read'),
  validate(listCollectionsSchema),
  controller.findAll.bind(controller)
);

// Get single collection
router.get(
  '/:id',
  authorize('collections:read'),
  validate(getCollectionSchema),
  controller.findById.bind(controller)
);

// Update collection
router.put(
  '/:id',
  authorize('collections:write'),
  validate(updateCollectionSchema),
  controller.update.bind(controller)
);

// Void collection
router.delete(
  '/:id',
  authorize('collections:delete'),
  validate(voidCollectionSchema),
  controller.void.bind(controller)
);

export default router;
