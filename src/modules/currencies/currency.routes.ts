import { Router } from 'express';
import { CurrencyController } from './currency.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createCurrencySchema,
  updateCurrencySchema,
  getCurrencySchema,
  listCurrenciesSchema,
} from './currency.schema.js';

const router = Router();
const controller = new CurrencyController();

router.use(authenticate);

// Get default currency
router.get(
  '/default',
  authorize('currencies:read'),
  controller.getDefault.bind(controller)
);

// Get currency by code (e.g., /currencies/code/BHD)
router.get(
  '/code/:code',
  authorize('currencies:read'),
  controller.findByCode.bind(controller)
);

router.post(
  '/',
  authorize('currencies:write'),
  validate(createCurrencySchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('currencies:read'),
  validate(listCurrenciesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('currencies:read'),
  validate(getCurrencySchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('currencies:write'),
  validate(updateCurrencySchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('currencies:delete'),
  validate(getCurrencySchema),
  controller.delete.bind(controller)
);

// Set currency as default
router.post(
  '/:id/set-default',
  authorize('currencies:write'),
  validate(getCurrencySchema),
  controller.setDefault.bind(controller)
);

export default router;
