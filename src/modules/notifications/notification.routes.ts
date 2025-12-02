import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new NotificationController();

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationTemplate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [REQUEST_CREATED, REQUEST_ASSIGNED, REQUEST_SCHEDULED, REQUEST_STARTED, REQUEST_COMPLETED, QUOTATION_SENT, QUOTATION_APPROVED, INVOICE_SENT, PAYMENT_RECEIVED, SLA_WARNING, SLA_BREACH, APPOINTMENT_REMINDER, APPOINTMENT_CONFIRMATION, APPOINTMENT_RESCHEDULED, APPOINTMENT_CANCELLED, TECHNICIAN_ASSIGNED, TECHNICIAN_EN_ROUTE, TECHNICIAN_ARRIVED, WORK_STARTED, WORK_COMPLETED, QUOTE_SENT, PAYMENT_REMINDER, REVIEW_REQUEST]
 *         channel:
 *           type: string
 *           enum: [EMAIL, SMS, PUSH, IN_APP, WHATSAPP]
 *         title:
 *           type: string
 *         titleAr:
 *           type: string
 *         subject:
 *           type: string
 *         subjectAr:
 *           type: string
 *         body:
 *           type: string
 *         bodyAr:
 *           type: string
 *         isActive:
 *           type: boolean
 *         isDefault:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         recipientType:
 *           type: string
 *           enum: [CUSTOMER, EMPLOYEE, USER]
 *         customerId:
 *           type: string
 *         employeeId:
 *           type: string
 *         channel:
 *           type: string
 *           enum: [EMAIL, SMS, PUSH, IN_APP, WHATSAPP]
 *         type:
 *           type: string
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, SCHEDULED, SENT, DELIVERED, READ, FAILED, CANCELLED]
 *         scheduledFor:
 *           type: string
 *           format: date-time
 *         sentAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateTemplateInput:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - channel
 *         - body
 *       properties:
 *         name:
 *           type: string
 *         type:
 *           type: string
 *           enum: [REQUEST_CREATED, REQUEST_ASSIGNED, REQUEST_SCHEDULED, REQUEST_STARTED, REQUEST_COMPLETED, QUOTATION_SENT, QUOTATION_APPROVED, INVOICE_SENT, PAYMENT_RECEIVED, SLA_WARNING, SLA_BREACH, APPOINTMENT_REMINDER, APPOINTMENT_CONFIRMATION, APPOINTMENT_RESCHEDULED, APPOINTMENT_CANCELLED, TECHNICIAN_ASSIGNED, TECHNICIAN_EN_ROUTE, TECHNICIAN_ARRIVED, WORK_STARTED, WORK_COMPLETED, QUOTE_SENT, PAYMENT_REMINDER, REVIEW_REQUEST]
 *         channel:
 *           type: string
 *           enum: [EMAIL, SMS, PUSH, IN_APP, WHATSAPP]
 *         title:
 *           type: string
 *         titleAr:
 *           type: string
 *         subject:
 *           type: string
 *         subjectAr:
 *           type: string
 *         body:
 *           type: string
 *         bodyAr:
 *           type: string
 *         isActive:
 *           type: boolean
 *           default: true
 *         isDefault:
 *           type: boolean
 *           default: false
 *     SendNotificationInput:
 *       type: object
 *       required:
 *         - recipientType
 *         - channel
 *         - type
 *         - title
 *         - message
 *       properties:
 *         recipientType:
 *           type: string
 *           enum: [CUSTOMER, EMPLOYEE, USER]
 *         customerId:
 *           type: string
 *         employeeId:
 *           type: string
 *         channel:
 *           type: string
 *           enum: [EMAIL, SMS, PUSH, IN_APP, WHATSAPP]
 *         type:
 *           type: string
 *         title:
 *           type: string
 *         message:
 *           type: string
 *         templateId:
 *           type: string
 *         scheduledFor:
 *           type: string
 *           format: date-time
 *         phoneNumber:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         subject:
 *           type: string
 */

// ==================== TEMPLATES ====================

/**
 * @swagger
 * /api/v1/notifications/templates:
 *   get:
 *     summary: Get all notification templates
 *     tags: [Notification Templates]
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [EMAIL, SMS, PUSH, IN_APP, WHATSAPP]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of templates
 */
router.get('/templates', authenticate, controller.getTemplates.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/templates/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Notification Templates]
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
 *         description: Template details
 *       404:
 *         description: Template not found
 */
router.get('/templates/:id', authenticate, controller.getTemplateById.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/templates:
 *   post:
 *     summary: Create a notification template
 *     tags: [Notification Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplateInput'
 *     responses:
 *       201:
 *         description: Template created successfully
 */
router.post('/templates', authenticate, controller.createTemplate.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/templates/{id}:
 *   put:
 *     summary: Update a notification template
 *     tags: [Notification Templates]
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
 *               title:
 *                 type: string
 *               body:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Template updated successfully
 */
router.put('/templates/:id', authenticate, controller.updateTemplate.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/templates/{id}:
 *   delete:
 *     summary: Delete a notification template
 *     tags: [Notification Templates]
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
 *         description: Template deleted successfully
 */
router.delete('/templates/:id', authenticate, controller.deleteTemplate.bind(controller));

// ==================== NOTIFICATIONS ====================

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Notifications]
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
 *         name: recipientType
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, EMPLOYEE, USER]
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [EMAIL, SMS, PUSH, IN_APP, WHATSAPP]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SCHEDULED, SENT, DELIVERED, READ, FAILED, CANCELLED]
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', authenticate, controller.getAll.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 pending:
 *                   type: integer
 *                 scheduled:
 *                   type: integer
 *                 sent:
 *                   type: integer
 *                 delivered:
 *                   type: integer
 *                 failed:
 *                   type: integer
 *                 todaySent:
 *                   type: integer
 *                 deliveryRate:
 *                   type: string
 */
router.get('/stats', authenticate, controller.getStats.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/customer/{customerId}:
 *   get:
 *     summary: Get notifications for a customer
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of customer notifications
 */
router.get('/customer/:customerId', authenticate, controller.getByCustomer.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     summary: Get notification by ID
 *     tags: [Notifications]
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
 *         description: Notification details
 *       404:
 *         description: Notification not found
 */
router.get('/:id', authenticate, controller.getById.bind(controller));

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Send a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendNotificationInput'
 *     responses:
 *       201:
 *         description: Notification sent/scheduled successfully
 */
router.post('/', authenticate, controller.send.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/send-template:
 *   post:
 *     summary: Send notification using a template
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - templateId
 *               - recipientType
 *             properties:
 *               templateId:
 *                 type: string
 *               recipientType:
 *                 type: string
 *                 enum: [CUSTOMER, EMPLOYEE, USER]
 *               customerId:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               variables:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Notification sent successfully
 */
router.post('/send-template', authenticate, controller.sendFromTemplate.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/schedule-reminder:
 *   post:
 *     summary: Schedule an appointment reminder
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - appointmentDate
 *             properties:
 *               serviceRequestId:
 *                 type: string
 *               workOrderId:
 *                 type: string
 *               customerId:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               reminderMinutesBefore:
 *                 type: integer
 *                 default: 60
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, SMS, PUSH, IN_APP, WHATSAPP]
 *                 default: SMS
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reminder scheduled successfully
 */
router.post('/schedule-reminder', authenticate, controller.scheduleAppointmentReminder.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/bulk:
 *   post:
 *     summary: Send bulk notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientType
 *               - recipientIds
 *               - channel
 *               - type
 *               - title
 *               - message
 *             properties:
 *               recipientType:
 *                 type: string
 *                 enum: [CUSTOMER, EMPLOYEE, USER]
 *               recipientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               channel:
 *                 type: string
 *                 enum: [EMAIL, SMS, PUSH, IN_APP, WHATSAPP]
 *               type:
 *                 type: string
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               templateId:
 *                 type: string
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Bulk notifications sent
 */
router.post('/bulk', authenticate, controller.sendBulk.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/mark-read:
 *   post:
 *     summary: Mark notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIds
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Notifications marked as read
 */
router.post('/mark-read', authenticate, controller.markAsRead.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/retry:
 *   post:
 *     summary: Retry a failed notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationId
 *             properties:
 *               notificationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification retry initiated
 */
router.post('/retry', authenticate, controller.retry.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/{id}/cancel:
 *   post:
 *     summary: Cancel a scheduled notification
 *     tags: [Notifications]
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
 *         description: Notification cancelled
 */
router.post('/:id/cancel', authenticate, controller.cancel.bind(controller));

/**
 * @swagger
 * /api/v1/notifications/process-scheduled:
 *   post:
 *     summary: Process scheduled notifications (internal/cron)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processing results
 */
router.post('/process-scheduled', authenticate, controller.processScheduled.bind(controller));

export default router;
