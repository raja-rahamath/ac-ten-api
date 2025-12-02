import { Router } from 'express';
import { ReviewController } from './review.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new ReviewController();

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomerReview:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customerId:
 *           type: string
 *         serviceRequestId:
 *           type: string
 *         workOrderId:
 *           type: string
 *         overallRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         qualityRating:
 *           type: integer
 *         timelinessRating:
 *           type: integer
 *         professionalismRating:
 *           type: integer
 *         valueRating:
 *           type: integer
 *         comment:
 *           type: string
 *         wouldRecommend:
 *           type: boolean
 *         responseText:
 *           type: string
 *         respondedAt:
 *           type: string
 *           format: date-time
 *         isPublic:
 *           type: boolean
 *         isVerified:
 *           type: boolean
 *         source:
 *           type: string
 *           enum: [PORTAL, EMAIL_LINK, SMS_LINK, MANUAL, GOOGLE]
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateReviewInput:
 *       type: object
 *       required:
 *         - customerId
 *         - overallRating
 *       properties:
 *         customerId:
 *           type: string
 *         serviceRequestId:
 *           type: string
 *         workOrderId:
 *           type: string
 *         overallRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         qualityRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         timelinessRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         professionalismRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         valueRating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         wouldRecommend:
 *           type: boolean
 *         isPublic:
 *           type: boolean
 *           default: true
 *         source:
 *           type: string
 *           enum: [PORTAL, EMAIL_LINK, SMS_LINK, MANUAL, GOOGLE]
 *           default: PORTAL
 *     RespondToReviewInput:
 *       type: object
 *       required:
 *         - responseText
 *       properties:
 *         responseText:
 *           type: string
 *     RequestReviewInput:
 *       type: object
 *       required:
 *         - customerId
 *       properties:
 *         customerId:
 *           type: string
 *         serviceRequestId:
 *           type: string
 *         workOrderId:
 *           type: string
 *         channel:
 *           type: string
 *           enum: [EMAIL, SMS, BOTH]
 *           default: EMAIL
 *     ReviewStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         public:
 *           type: integer
 *         withResponse:
 *           type: integer
 *         responseRate:
 *           type: number
 *         averages:
 *           type: object
 *           properties:
 *             overall:
 *               type: number
 *             quality:
 *               type: number
 *             timeliness:
 *               type: number
 *             professionalism:
 *               type: number
 *             value:
 *               type: number
 *         recommendation:
 *           type: object
 *           properties:
 *             wouldRecommend:
 *               type: integer
 *             wouldNotRecommend:
 *               type: integer
 *             npsScore:
 *               type: integer
 *         ratingDistribution:
 *           type: object
 */

// ==================== PUBLIC ROUTES (no auth) ====================

/**
 * @swagger
 * /api/v1/reviews/public:
 *   get:
 *     summary: Get public reviews (for website display)
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of public reviews
 */
router.get('/public', controller.getPublicReviews.bind(controller));

// ==================== PROTECTED ROUTES ====================

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Get all reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: serviceRequestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: maxRating
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: hasResponse
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [PORTAL, EMAIL_LINK, SMS_LINK, MANUAL, GOOGLE]
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get('/', authenticate, controller.getAll.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/stats:
 *   get:
 *     summary: Get review statistics
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Review statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewStats'
 */
router.get('/stats', authenticate, controller.getStats.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/pending-response:
 *   get:
 *     summary: Get reviews pending response
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of reviews without responses
 */
router.get('/pending-response', authenticate, controller.getPendingResponse.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/recent-negative:
 *   get:
 *     summary: Get recent negative reviews
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 2
 *         description: Maximum rating to include (reviews with rating <= threshold)
 *     responses:
 *       200:
 *         description: List of negative reviews
 */
router.get('/recent-negative', authenticate, controller.getRecentNegative.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/customer/{customerId}:
 *   get:
 *     summary: Get reviews by customer
 *     tags: [Reviews]
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
 *         description: List of customer's reviews
 */
router.get('/customer/:customerId', authenticate, controller.getByCustomerId.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags: [Reviews]
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
 *         description: Review details
 *       404:
 *         description: Review not found
 */
router.get('/:id', authenticate, controller.getById.bind(controller));

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Create a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully
 */
router.post('/', authenticate, controller.create.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/request:
 *   post:
 *     summary: Request a review from customer
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestReviewInput'
 *     responses:
 *       200:
 *         description: Review request sent
 */
router.post('/request', authenticate, controller.requestReview.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
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
 *             properties:
 *               overallRating:
 *                 type: integer
 *               comment:
 *                 type: string
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Review updated successfully
 */
router.put('/:id', authenticate, controller.update.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/{id}/respond:
 *   post:
 *     summary: Respond to a review
 *     tags: [Reviews]
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
 *             $ref: '#/components/schemas/RespondToReviewInput'
 *     responses:
 *       200:
 *         description: Response added successfully
 */
router.post('/:id/respond', authenticate, controller.respond.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/{id}/toggle-public:
 *   post:
 *     summary: Toggle review public visibility
 *     tags: [Reviews]
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
 *         description: Visibility toggled
 */
router.post('/:id/toggle-public', authenticate, controller.togglePublic.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/{id}/verify:
 *   post:
 *     summary: Mark review as verified
 *     tags: [Reviews]
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
 *         description: Review verified
 */
router.post('/:id/verify', authenticate, controller.verify.bind(controller));

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 */
router.delete('/:id', authenticate, controller.delete.bind(controller));

export default router;
