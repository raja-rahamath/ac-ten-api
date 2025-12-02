import { Router } from 'express';
import { CommentController } from './comment.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new CommentController();

/**
 * @swagger
 * components:
 *   schemas:
 *     ServiceRequestComment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         serviceRequestId:
 *           type: string
 *         content:
 *           type: string
 *         commentType:
 *           type: string
 *           enum: [INTERNAL_NOTE, CUSTOMER_CALL, CUSTOMER_CALLED, EMAIL_SENT, EMAIL_RECEIVED, SMS_SENT, SMS_RECEIVED, WHATSAPP, CUSTOMER_MESSAGE, SITE_VISIT_NOTE, SCHEDULING_NOTE]
 *         isInternal:
 *           type: boolean
 *         isCustomerAuthor:
 *           type: boolean
 *         contactMethod:
 *           type: string
 *           enum: [PHONE, EMAIL, IN_PERSON, WHATSAPP]
 *         contactNumber:
 *           type: string
 *         contactDuration:
 *           type: integer
 *           description: Duration in seconds
 *         contactedAt:
 *           type: string
 *           format: date-time
 *         preferredDate:
 *           type: string
 *           description: Customer's preferred date (YYYY-MM-DD)
 *         preferredTime:
 *           type: string
 *           description: Customer's preferred time (e.g., "10:30 AM" or "16:00")
 *         createdAt:
 *           type: string
 *           format: date-time
 *         createdBy:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *     CreateCommentInput:
 *       type: object
 *       required:
 *         - serviceRequestId
 *         - content
 *       properties:
 *         serviceRequestId:
 *           type: string
 *         content:
 *           type: string
 *         commentType:
 *           type: string
 *           enum: [INTERNAL_NOTE, CUSTOMER_CALL, CUSTOMER_CALLED, EMAIL_SENT, EMAIL_RECEIVED, SMS_SENT, SMS_RECEIVED, WHATSAPP, CUSTOMER_MESSAGE, SITE_VISIT_NOTE, SCHEDULING_NOTE]
 *           default: INTERNAL_NOTE
 *         isInternal:
 *           type: boolean
 *           default: true
 *         isCustomerAuthor:
 *           type: boolean
 *           default: false
 *         contactMethod:
 *           type: string
 *           enum: [PHONE, EMAIL, IN_PERSON, WHATSAPP]
 *         contactNumber:
 *           type: string
 *         contactDuration:
 *           type: integer
 *         contactedAt:
 *           type: string
 *           format: date-time
 *         preferredDate:
 *           type: string
 *         preferredTime:
 *           type: string
 *     AddCallCommentInput:
 *       type: object
 *       required:
 *         - serviceRequestId
 *         - content
 *       properties:
 *         serviceRequestId:
 *           type: string
 *         content:
 *           type: string
 *           description: Notes from the call
 *         direction:
 *           type: string
 *           enum: [OUTBOUND, INBOUND]
 *           default: OUTBOUND
 *           description: OUTBOUND = we called customer, INBOUND = customer called us
 *         contactNumber:
 *           type: string
 *         contactDuration:
 *           type: integer
 *           description: Call duration in seconds
 *         contactedAt:
 *           type: string
 *           format: date-time
 *         preferredDate:
 *           type: string
 *           description: Customer's preferred appointment date
 *         preferredTime:
 *           type: string
 *           description: Customer's preferred appointment time
 *     CommentStats:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *         internal:
 *           type: integer
 *         customerComments:
 *           type: integer
 *         callLogs:
 *           type: integer
 *         withSchedulingPreference:
 *           type: integer
 *         byType:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               count:
 *                 type: integer
 */

// ==================== PROTECTED ROUTES ====================

/**
 * @swagger
 * /api/v1/comments:
 *   get:
 *     summary: Get all comments
 *     tags: [Comments]
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
 *           default: 50
 *       - in: query
 *         name: serviceRequestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: commentType
 *         schema:
 *           type: string
 *           enum: [INTERNAL_NOTE, CUSTOMER_CALL, CUSTOMER_CALLED, EMAIL_SENT, EMAIL_RECEIVED, SMS_SENT, SMS_RECEIVED, WHATSAPP, CUSTOMER_MESSAGE, SITE_VISIT_NOTE, SCHEDULING_NOTE]
 *       - in: query
 *         name: isInternal
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of comments
 */
router.get('/', authenticate, controller.getAll.bind(controller));

/**
 * @swagger
 * /api/v1/comments/service-request/{serviceRequestId}:
 *   get:
 *     summary: Get comments by service request
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: includeInternal
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of comments for the service request
 */
router.get(
  '/service-request/:serviceRequestId',
  authenticate,
  controller.getByServiceRequestId.bind(controller)
);

/**
 * @swagger
 * /api/v1/comments/service-request/{serviceRequestId}/scheduling:
 *   get:
 *     summary: Get comments with scheduling preferences
 *     description: Returns comments that have customer's preferred date/time for appointments
 *     tags: [Comments]
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
 *         description: List of comments with scheduling preferences
 */
router.get(
  '/service-request/:serviceRequestId/scheduling',
  authenticate,
  controller.getWithSchedulingPreferences.bind(controller)
);

/**
 * @swagger
 * /api/v1/comments/service-request/{serviceRequestId}/call-logs:
 *   get:
 *     summary: Get call logs for a service request
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of call logs
 */
router.get(
  '/service-request/:serviceRequestId/call-logs',
  authenticate,
  controller.getCallLogs.bind(controller)
);

/**
 * @swagger
 * /api/v1/comments/service-request/{serviceRequestId}/customer-visible:
 *   get:
 *     summary: Get customer-visible comments (for customer portal)
 *     tags: [Comments]
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
 *         description: List of customer-visible comments
 */
router.get(
  '/service-request/:serviceRequestId/customer-visible',
  authenticate,
  controller.getCustomerVisibleComments.bind(controller)
);

/**
 * @swagger
 * /api/v1/comments/service-request/{serviceRequestId}/stats:
 *   get:
 *     summary: Get comment statistics for a service request
 *     tags: [Comments]
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
 *         description: Comment statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentStats'
 */
router.get(
  '/service-request/:serviceRequestId/stats',
  authenticate,
  controller.getStats.bind(controller)
);

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   get:
 *     summary: Get comment by ID
 *     tags: [Comments]
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
 *         description: Comment details
 *       404:
 *         description: Comment not found
 */
router.get('/:id', authenticate, controller.getById.bind(controller));

/**
 * @swagger
 * /api/v1/comments:
 *   post:
 *     summary: Create a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentInput'
 *     responses:
 *       201:
 *         description: Comment created successfully
 */
router.post('/', authenticate, controller.create.bind(controller));

/**
 * @swagger
 * /api/v1/comments/call:
 *   post:
 *     summary: Add a call comment (convenience endpoint for phone calls)
 *     description: Use this when zone head calls customer or customer calls. Automatically sets comment type based on direction.
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCallCommentInput'
 *           example:
 *             serviceRequestId: "sr_123"
 *             content: "Customer requested appointment for tomorrow at 10:30 AM. Will confirm availability."
 *             direction: "OUTBOUND"
 *             contactNumber: "+973-12345678"
 *             contactDuration: 180
 *             preferredDate: "2024-12-04"
 *             preferredTime: "10:30 AM"
 *     responses:
 *       201:
 *         description: Call comment created successfully
 */
router.post('/call', authenticate, controller.addCallComment.bind(controller));

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
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
 *               content:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *               preferredDate:
 *                 type: string
 *               preferredTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 */
router.put('/:id', authenticate, controller.update.bind(controller));

/**
 * @swagger
 * /api/v1/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
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
 *         description: Comment deleted successfully
 */
router.delete('/:id', authenticate, controller.delete.bind(controller));

// ==================== SCHEDULING & NOTIFICATIONS ====================

/**
 * @swagger
 * /api/v1/comments/scheduling/upcoming:
 *   get:
 *     summary: Get upcoming scheduled appointments
 *     description: Returns comments with scheduling preferences for today and/or tomorrow
 *     tags: [Comments, Scheduling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeToday
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: includeTomorrow
 *         schema:
 *           type: boolean
 *           default: true
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Include next N days (overrides includeToday/includeTomorrow)
 *     responses:
 *       200:
 *         description: List of upcoming scheduled appointments
 */
router.get(
  '/scheduling/upcoming',
  authenticate,
  controller.getUpcomingAppointments.bind(controller)
);

/**
 * @swagger
 * /api/v1/comments/scheduling/by-zone:
 *   get:
 *     summary: Get scheduled appointments grouped by zone
 *     description: Returns appointments for a specific date grouped by zone with zone head info
 *     tags: [Comments, Scheduling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Date in YYYY-MM-DD format (defaults to today)
 *     responses:
 *       200:
 *         description: Appointments grouped by zone
 */
router.get(
  '/scheduling/by-zone',
  authenticate,
  controller.getScheduledByZone.bind(controller)
);

/**
 * @swagger
 * /api/v1/comments/scheduling/notify-zone-heads:
 *   post:
 *     summary: Send email notifications to zone heads
 *     description: Sends email notifications to zone heads about scheduled appointments for today and/or tomorrow
 *     tags: [Comments, Scheduling, Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               forToday:
 *                 type: boolean
 *                 default: true
 *                 description: Include appointments for today
 *               forTomorrow:
 *                 type: boolean
 *                 default: true
 *                 description: Include appointments for tomorrow
 *               forDate:
 *                 type: string
 *                 description: Specific date in YYYY-MM-DD format (overrides forToday/forTomorrow)
 *           example:
 *             forToday: true
 *             forTomorrow: true
 *     responses:
 *       200:
 *         description: Notification results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 totalNotifications:
 *                   type: integer
 *                 sent:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       zoneName:
 *                         type: string
 *                       zoneHeadEmail:
 *                         type: string
 *                       appointmentCount:
 *                         type: integer
 *                       emailSent:
 *                         type: boolean
 *                       error:
 *                         type: string
 */
router.post(
  '/scheduling/notify-zone-heads',
  authenticate,
  controller.sendZoneHeadNotifications.bind(controller)
);

export default router;
