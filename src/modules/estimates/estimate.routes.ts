import { Router } from 'express';
import { EstimateController } from './estimate.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const estimateController = new EstimateController();

/**
 * @swagger
 * tags:
 *   name: Estimates
 *   description: Internal estimate management (detailed costing before customer quote)
 */

/**
 * @swagger
 * /estimates:
 *   get:
 *     summary: Get all estimates
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by estimate number or title
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SUBMITTED, PENDING_MANAGER_APPROVAL, REVISION_REQUESTED, APPROVED, REJECTED, CONVERTED, CANCELLED]
 *         description: Filter by status
 *       - in: query
 *         name: serviceRequestId
 *         schema:
 *           type: string
 *         description: Filter by service request
 *     responses:
 *       200:
 *         description: List of estimates
 */
router.get('/', authenticate, estimateController.getAll.bind(estimateController));

/**
 * @swagger
 * /estimates/stats:
 *   get:
 *     summary: Get estimate statistics
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estimate statistics
 */
router.get('/stats', authenticate, estimateController.getStats.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}:
 *   get:
 *     summary: Get estimate by ID
 *     tags: [Estimates]
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
 *         description: Estimate details
 *       404:
 *         description: Estimate not found
 */
router.get('/:id', authenticate, estimateController.getById.bind(estimateController));

/**
 * @swagger
 * /estimates:
 *   post:
 *     summary: Create a new estimate
 *     tags: [Estimates]
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
 *               - title
 *             properties:
 *               serviceRequestId:
 *                 type: string
 *               siteVisitId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               scope:
 *                 type: string
 *               profitMarginType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               profitMarginValue:
 *                 type: number
 *               vatRate:
 *                 type: number
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unitCost:
 *                       type: number
 *               laborItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     hours:
 *                       type: number
 *                     hourlyRate:
 *                       type: number
 *     responses:
 *       201:
 *         description: Estimate created
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, estimateController.create.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}:
 *   put:
 *     summary: Update an estimate
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Estimate updated
 *       400:
 *         description: Can only edit draft estimates
 *       404:
 *         description: Estimate not found
 */
router.put('/:id', authenticate, estimateController.update.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}/submit:
 *   post:
 *     summary: Submit estimate for manager approval
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estimate submitted for approval
 */
router.post('/:id/submit', authenticate, estimateController.submitForApproval.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}/approve:
 *   post:
 *     summary: Approve estimate (manager action)
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estimate approved
 */
router.post('/:id/approve', authenticate, estimateController.approve.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}/reject:
 *   post:
 *     summary: Reject estimate (manager action)
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estimate rejected
 */
router.post('/:id/reject', authenticate, estimateController.reject.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}/request-revision:
 *   post:
 *     summary: Request revision on estimate (manager action)
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Revision requested
 */
router.post('/:id/request-revision', authenticate, estimateController.requestRevision.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}/convert-to-quote:
 *   post:
 *     summary: Convert approved estimate to customer quote
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - validUntil
 *             properties:
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               terms:
 *                 type: string
 *               adjustPricing:
 *                 type: boolean
 *               customerDiscount:
 *                 type: number
 *               customerDiscountType:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *     responses:
 *       200:
 *         description: Quote created from estimate
 */
router.post('/:id/convert-to-quote', authenticate, estimateController.convertToQuote.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}/cancel:
 *   post:
 *     summary: Cancel estimate
 *     tags: [Estimates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estimate cancelled
 */
router.post('/:id/cancel', authenticate, estimateController.cancel.bind(estimateController));

/**
 * @swagger
 * /estimates/{id}:
 *   delete:
 *     summary: Delete estimate (only drafts)
 *     tags: [Estimates]
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
 *         description: Estimate deleted
 *       400:
 *         description: Only draft estimates can be deleted
 */
router.delete('/:id', authenticate, estimateController.delete.bind(estimateController));

export default router;
