import { Router } from 'express';
import { ReceiptController } from './receipt.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new ReceiptController();

// All routes require authentication
router.use(authenticate);

// Dashboard Stats
router.get('/stats', controller.getStats.bind(controller));

// Generate receipt from payment
router.post('/from-payment', controller.generateFromPayment.bind(controller));

// Get receipts by invoice
router.get('/invoice/:invoiceId', controller.getByInvoice.bind(controller));

// Get receipts by customer
router.get('/customer/:customerId', controller.getByCustomer.bind(controller));

// Get by receipt number
router.get('/number/:receiptNo', controller.getByReceiptNo.bind(controller));

// CRUD routes
router.post('/', controller.create.bind(controller));
router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getById.bind(controller));

// Receipt actions
router.post('/:id/void', controller.void.bind(controller));
router.post('/:id/print', controller.recordPrint.bind(controller));
router.post('/:id/email', controller.recordEmail.bind(controller));

export default router;
