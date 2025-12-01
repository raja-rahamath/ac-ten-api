import { Router } from 'express';
import { QuoteController } from './quote.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new QuoteController();

// All routes require authentication
router.use(authenticate);

// Dashboard Stats
router.get('/stats', controller.getStats.bind(controller));

// Cron job endpoint for expiring quotes
router.post('/expire-overdue', controller.expireOverdueQuotes.bind(controller));

// Version history
router.get('/versions/:quoteNo', controller.getVersionHistory.bind(controller));

// CRUD routes
router.post('/', controller.create.bind(controller));
router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

// Quote workflow
router.post('/:id/send', controller.send.bind(controller));
router.post('/:id/viewed', controller.markAsViewed.bind(controller));
router.post('/:id/response', controller.recordResponse.bind(controller));
router.post('/:id/revision', controller.createRevision.bind(controller));
router.post('/:id/convert-to-invoice', controller.convertToInvoice.bind(controller));
router.post('/:id/cancel', controller.cancel.bind(controller));

export default router;
