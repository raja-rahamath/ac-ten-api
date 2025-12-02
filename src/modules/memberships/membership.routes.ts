import { Router } from 'express';
import { MembershipController } from './membership.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new MembershipController();

/**
 * @swagger
 * components:
 *   schemas:
 *     MembershipPlan:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         nameAr:
 *           type: string
 *         code:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         billingCycle:
 *           type: string
 *           enum: [MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL]
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         serviceDiscount:
 *           type: number
 *         partsDiscount:
 *           type: number
 *         priorityService:
 *           type: boolean
 *         freeVisitsPerYear:
 *           type: integer
 *         isActive:
 *           type: boolean
 *         sortOrder:
 *           type: integer
 *     CustomerMembership:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customerId:
 *           type: string
 *         planId:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, CANCELLED, SUSPENDED, PENDING_PAYMENT]
 *         autoRenew:
 *           type: boolean
 *         freeVisitsUsed:
 *           type: integer
 *     CreatePlanInput:
 *       type: object
 *       required:
 *         - name
 *         - code
 *         - price
 *         - billingCycle
 *       properties:
 *         name:
 *           type: string
 *         nameAr:
 *           type: string
 *         code:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         billingCycle:
 *           type: string
 *           enum: [MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL]
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         serviceDiscount:
 *           type: number
 *           default: 0
 *         partsDiscount:
 *           type: number
 *           default: 0
 *         priorityService:
 *           type: boolean
 *           default: false
 *         freeVisitsPerYear:
 *           type: integer
 *           default: 0
 *         isActive:
 *           type: boolean
 *           default: true
 *     SubscribeInput:
 *       type: object
 *       required:
 *         - customerId
 *         - planId
 *       properties:
 *         customerId:
 *           type: string
 *         planId:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         paymentMethod:
 *           type: string
 *         autoRenew:
 *           type: boolean
 *           default: true
 */

// ==================== PLANS ====================

/**
 * @swagger
 * /api/v1/memberships/plans:
 *   get:
 *     summary: Get all membership plans
 *     tags: [Membership Plans]
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
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: billingCycle
 *         schema:
 *           type: string
 *           enum: [MONTHLY, QUARTERLY, SEMI_ANNUAL, ANNUAL]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of membership plans
 */
router.get('/plans', authenticate, controller.getPlans.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/plans/{id}:
 *   get:
 *     summary: Get plan by ID
 *     tags: [Membership Plans]
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
 *         description: Plan details
 *       404:
 *         description: Plan not found
 */
router.get('/plans/:id', authenticate, controller.getPlanById.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/plans/code/{code}:
 *   get:
 *     summary: Get plan by code
 *     tags: [Membership Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan details
 *       404:
 *         description: Plan not found
 */
router.get('/plans/code/:code', authenticate, controller.getPlanByCode.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/plans:
 *   post:
 *     summary: Create a membership plan
 *     tags: [Membership Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlanInput'
 *     responses:
 *       201:
 *         description: Plan created successfully
 */
router.post('/plans', authenticate, controller.createPlan.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/plans/{id}:
 *   put:
 *     summary: Update a membership plan
 *     tags: [Membership Plans]
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
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Plan updated successfully
 */
router.put('/plans/:id', authenticate, controller.updatePlan.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/plans/{id}:
 *   delete:
 *     summary: Delete a membership plan
 *     tags: [Membership Plans]
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
 *         description: Plan deleted successfully
 */
router.delete('/plans/:id', authenticate, controller.deletePlan.bind(controller));

// ==================== SUBSCRIPTIONS ====================

/**
 * @swagger
 * /api/v1/memberships:
 *   get:
 *     summary: Get all customer memberships
 *     tags: [Customer Memberships]
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
 *         name: planId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, CANCELLED, SUSPENDED, PENDING_PAYMENT]
 *     responses:
 *       200:
 *         description: List of memberships
 */
router.get('/', authenticate, controller.getMemberships.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/stats:
 *   get:
 *     summary: Get membership statistics
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Membership statistics
 */
router.get('/stats', authenticate, controller.getStats.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/customer/{customerId}:
 *   get:
 *     summary: Get customer's active membership
 *     tags: [Customer Memberships]
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
 *         description: Customer's active membership (null if none)
 */
router.get('/customer/:customerId', authenticate, controller.getCustomerMembership.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/{id}:
 *   get:
 *     summary: Get membership by ID
 *     tags: [Customer Memberships]
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
 *         description: Membership details
 *       404:
 *         description: Membership not found
 */
router.get('/:id', authenticate, controller.getMembershipById.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/subscribe:
 *   post:
 *     summary: Subscribe a customer to a plan
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscribeInput'
 *     responses:
 *       201:
 *         description: Subscription created successfully
 */
router.post('/subscribe', authenticate, controller.subscribe.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/renew:
 *   post:
 *     summary: Renew a membership
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - membershipId
 *             properties:
 *               membershipId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Membership renewed successfully
 */
router.post('/renew', authenticate, controller.renew.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/change-plan:
 *   post:
 *     summary: Change membership plan
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - membershipId
 *               - newPlanId
 *             properties:
 *               membershipId:
 *                 type: string
 *               newPlanId:
 *                 type: string
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Plan changed successfully
 */
router.post('/change-plan', authenticate, controller.changePlan.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/cancel:
 *   post:
 *     summary: Cancel a membership
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - membershipId
 *               - reason
 *             properties:
 *               membershipId:
 *                 type: string
 *               reason:
 *                 type: string
 *               immediate:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Membership cancelled
 */
router.post('/cancel', authenticate, controller.cancel.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/suspend:
 *   post:
 *     summary: Suspend a membership
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - membershipId
 *               - reason
 *             properties:
 *               membershipId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Membership suspended
 */
router.post('/suspend', authenticate, controller.suspend.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/reactivate:
 *   post:
 *     summary: Reactivate a suspended membership
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - membershipId
 *             properties:
 *               membershipId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Membership reactivated
 */
router.post('/reactivate', authenticate, controller.reactivate.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/use-free-visit:
 *   post:
 *     summary: Use a free visit from membership
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - membershipId
 *             properties:
 *               membershipId:
 *                 type: string
 *               serviceRequestId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Free visit used
 */
router.post('/use-free-visit', authenticate, controller.useFreeVisit.bind(controller));

/**
 * @swagger
 * /api/v1/memberships/process-expired:
 *   post:
 *     summary: Process expired memberships (cron endpoint)
 *     tags: [Customer Memberships]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processing results
 */
router.post('/process-expired', authenticate, controller.processExpired.bind(controller));

export default router;
