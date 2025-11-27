import { Router } from 'express';
import { InvoiceController } from './invoice.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  getInvoiceSchema,
  listInvoicesSchema,
  recordPaymentSchema,
} from './invoice.schema.js';

const router = Router();
const controller = new InvoiceController();

router.use(authenticate);

router.post(
  '/',
  authorize('invoices:write'),
  validate(createInvoiceSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('invoices:read'),
  validate(listInvoicesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/stats',
  authorize('invoices:read'),
  controller.getStats.bind(controller)
);

router.get(
  '/:id',
  authorize('invoices:read'),
  validate(getInvoiceSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('invoices:write'),
  validate(updateInvoiceSchema),
  controller.update.bind(controller)
);

router.post(
  '/:id/payments',
  authorize('invoices:write'),
  validate(recordPaymentSchema),
  controller.recordPayment.bind(controller)
);

router.delete(
  '/:id',
  authorize('invoices:delete'),
  validate(getInvoiceSchema),
  controller.delete.bind(controller)
);

export default router;
