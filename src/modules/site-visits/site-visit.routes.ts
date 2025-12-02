import { Router } from 'express';
import { SiteVisitController } from './site-visit.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const siteVisitController = new SiteVisitController();

/**
 * @swagger
 * tags:
 *   name: Site Visits
 *   description: Site visit management for service requests
 */

/**
 * @swagger
 * /site-visits:
 *   get:
 *     summary: Get all site visits
 *     tags: [Site Visits]
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
 *           enum: [SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_ACCESS, RESCHEDULED]
 *       - in: query
 *         name: serviceRequestId
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedToId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of site visits
 */
router.get('/', authenticate, siteVisitController.getAll.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/stats:
 *   get:
 *     summary: Get site visit statistics
 *     tags: [Site Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Site visit statistics
 */
router.get('/stats', authenticate, siteVisitController.getStats.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/service-request/{serviceRequestId}:
 *   get:
 *     summary: Get site visits for a service request
 *     tags: [Site Visits]
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
 *         description: List of site visits for the service request
 */
router.get('/service-request/:serviceRequestId', authenticate, siteVisitController.getByServiceRequest.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/{id}:
 *   get:
 *     summary: Get site visit by ID
 *     tags: [Site Visits]
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
 *         description: Site visit details
 *       404:
 *         description: Site visit not found
 */
router.get('/:id', authenticate, siteVisitController.getById.bind(siteVisitController));

/**
 * @swagger
 * /site-visits:
 *   post:
 *     summary: Create a new site visit
 *     tags: [Site Visits]
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
 *               - scheduledDate
 *             properties:
 *               serviceRequestId:
 *                 type: string
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               scheduledTime:
 *                 type: string
 *               assignedToId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Site visit created
 */
router.post('/', authenticate, siteVisitController.create.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/{id}:
 *   put:
 *     summary: Update a site visit
 *     tags: [Site Visits]
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
 *         description: Site visit updated
 */
router.put('/:id', authenticate, siteVisitController.update.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/{id}/start:
 *   post:
 *     summary: Start a site visit
 *     tags: [Site Visits]
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
 *         description: Site visit started
 */
router.post('/:id/start', authenticate, siteVisitController.start.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/{id}/complete:
 *   post:
 *     summary: Complete a site visit
 *     tags: [Site Visits]
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
 *               - findings
 *             properties:
 *               findings:
 *                 type: string
 *               recommendations:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *               customerPresent:
 *                 type: boolean
 *               customerSignature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Site visit completed
 */
router.post('/:id/complete', authenticate, siteVisitController.complete.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/{id}/reschedule:
 *   post:
 *     summary: Reschedule a site visit
 *     tags: [Site Visits]
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
 *               - scheduledDate
 *               - reason
 *             properties:
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               scheduledTime:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Site visit rescheduled
 */
router.post('/:id/reschedule', authenticate, siteVisitController.reschedule.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/{id}/no-access:
 *   post:
 *     summary: Mark site visit as no access
 *     tags: [Site Visits]
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
 *         description: Site visit marked as no access
 */
router.post('/:id/no-access', authenticate, siteVisitController.markNoAccess.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/{id}/cancel:
 *   post:
 *     summary: Cancel a site visit
 *     tags: [Site Visits]
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
 *         description: Site visit cancelled
 */
router.post('/:id/cancel', authenticate, siteVisitController.cancel.bind(siteVisitController));

/**
 * @swagger
 * /site-visits/{id}:
 *   delete:
 *     summary: Delete a site visit (only scheduled)
 *     tags: [Site Visits]
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
 *         description: Site visit deleted
 */
router.delete('/:id', authenticate, siteVisitController.delete.bind(siteVisitController));

export default router;
