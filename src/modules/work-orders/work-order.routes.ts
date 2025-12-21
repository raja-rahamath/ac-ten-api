import { Router } from 'express';
import { WorkOrderController } from './work-order.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireMinimumSetup } from '../../middleware/requireOnboarding.js';
import { uploadAttachment } from '../../middleware/upload.js';

const router = Router();
const workOrderController = new WorkOrderController();

/**
 * @swagger
 * tags:
 *   name: Work Orders
 *   description: Work order management for executing approved quotes/estimates
 */

/**
 * @swagger
 * /work-orders:
 *   get:
 *     summary: Get all work orders
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SCHEDULED, CONFIRMED, EN_ROUTE, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED, REQUIRES_FOLLOWUP]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: serviceRequestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of work orders
 */
router.get('/', authenticate, workOrderController.getAll.bind(workOrderController));

/**
 * @swagger
 * /work-orders/stats:
 *   get:
 *     summary: Get work order statistics
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Work order statistics
 */
router.get('/stats', authenticate, workOrderController.getStats.bind(workOrderController));

/**
 * @swagger
 * /work-orders/service-request/{serviceRequestId}:
 *   get:
 *     summary: Get work orders for a service request
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of work orders for the service request
 */
router.get('/service-request/:serviceRequestId', authenticate, workOrderController.getByServiceRequest.bind(workOrderController));

/**
 * @swagger
 * /work-orders/customer/{customerId}:
 *   get:
 *     summary: Get work orders for a customer
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of work orders for the customer
 */
router.get('/customer/:customerId', authenticate, workOrderController.getByCustomer.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}:
 *   get:
 *     summary: Get work order by ID
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order details
 *       404:
 *         description: Work order not found
 */
router.get('/:id', authenticate, workOrderController.getById.bind(workOrderController));

/**
 * @swagger
 * /work-orders:
 *   post:
 *     summary: Create a new work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceRequestId
 *               - customerId
 *               - title
 *               - scheduledDate
 *             properties:
 *               serviceRequestId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               title:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Work order created
 */
router.post('/', authenticate, requireMinimumSetup, workOrderController.create.bind(workOrderController));

/**
 * @swagger
 * /work-orders/from-quote:
 *   post:
 *     summary: Create work order from approved quote
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quoteId
 *               - scheduledDate
 *             properties:
 *               quoteId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Work order created from quote
 */
router.post('/from-quote', authenticate, requireMinimumSetup, workOrderController.createFromQuote.bind(workOrderController));

/**
 * @swagger
 * /work-orders/from-estimate:
 *   post:
 *     summary: Create work order from approved estimate
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estimateId
 *               - scheduledDate
 *             properties:
 *               estimateId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Work order created from estimate
 */
router.post('/from-estimate', authenticate, requireMinimumSetup, workOrderController.createFromEstimate.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}:
 *   put:
 *     summary: Update a work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order updated
 */
router.put('/:id', authenticate, workOrderController.update.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/assign-team:
 *   post:
 *     summary: Assign team to work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team assigned
 */
router.post('/:id/assign-team', authenticate, workOrderController.assignTeam.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/schedule:
 *   post:
 *     summary: Schedule work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order scheduled
 */
router.post('/:id/schedule', authenticate, workOrderController.schedule.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/confirm:
 *   post:
 *     summary: Confirm work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order confirmed
 */
router.post('/:id/confirm', authenticate, workOrderController.confirm.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/en-route:
 *   post:
 *     summary: Start en route to work site
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: En route started
 */
router.post('/:id/en-route', authenticate, workOrderController.startEnRoute.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/arrive:
 *   post:
 *     summary: Mark arrival at work site
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arrival marked
 */
router.post('/:id/arrive', authenticate, workOrderController.arriveAtSite.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/start:
 *   post:
 *     summary: Start work
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work started
 */
router.post('/:id/start', authenticate, workOrderController.startWork.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/clock-in:
 *   post:
 *     summary: Clock in employee
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee clocked in
 */
router.post('/:id/clock-in', authenticate, workOrderController.clockIn.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/clock-out:
 *   post:
 *     summary: Clock out employee
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee clocked out
 */
router.post('/:id/clock-out', authenticate, workOrderController.clockOut.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/checklist:
 *   post:
 *     summary: Update checklist item
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Checklist item updated
 */
router.post('/:id/checklist', authenticate, workOrderController.completeChecklist.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/items:
 *   post:
 *     summary: Add item/material to work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item added
 */
router.post('/:id/items', authenticate, workOrderController.addItem.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/photos:
 *   post:
 *     summary: Add photo to work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Photo added
 */
router.post('/:id/photos', authenticate, uploadAttachment, workOrderController.addPhoto.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/photos:
 *   get:
 *     summary: Get photos for work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of photos
 */
router.get('/:id/photos', authenticate, workOrderController.getPhotos.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/complete:
 *   post:
 *     summary: Complete work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order completed
 */
router.post('/:id/complete', authenticate, workOrderController.complete.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/hold:
 *   post:
 *     summary: Put work order on hold
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order put on hold
 */
router.post('/:id/hold', authenticate, workOrderController.putOnHold.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/resume:
 *   post:
 *     summary: Resume work order from hold
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order resumed
 */
router.post('/:id/resume', authenticate, workOrderController.resumeFromHold.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/follow-up:
 *   post:
 *     summary: Mark work order as requires follow-up
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order marked for follow-up
 */
router.post('/:id/follow-up', authenticate, workOrderController.requiresFollowUp.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/cancel:
 *   post:
 *     summary: Cancel work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order cancelled
 */
router.post('/:id/cancel', authenticate, workOrderController.cancel.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}/reschedule:
 *   post:
 *     summary: Reschedule work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Work order rescheduled
 */
router.post('/:id/reschedule', authenticate, workOrderController.reschedule.bind(workOrderController));

/**
 * @swagger
 * /work-orders/{id}:
 *   delete:
 *     summary: Delete work order (only pending/scheduled)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Work order deleted
 */
router.delete('/:id', authenticate, workOrderController.delete.bind(workOrderController));

export default router;
