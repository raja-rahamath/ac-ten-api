import { Router } from 'express';
import { CustomerAuthController } from './customer-auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import {
  registerIndividualSchema,
  registerCompanySchema,
  customerLoginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  registerPropertySchema,
  getCustomerPropertiesSchema,
  setPrimaryPropertySchema,
  listAreasSchema,
} from './customer-auth.schema.js';

const router = Router();
const controller = new CustomerAuthController();

/**
 * @swagger
 * /customer/auth/check-email:
 *   get:
 *     summary: Check email availability
 *     description: Check if an email is already registered
 *     tags: [Customer Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Email address to check
 *     responses:
 *       200:
 *         description: Email availability status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
router.get('/check-email', controller.checkEmailAvailability);

/**
 * @swagger
 * /customer/auth/register/individual:
 *   post:
 *     summary: Register individual customer
 *     description: Create a new individual customer account
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName, phone]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address (used as user ID)
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *                 description: Mobile phone number (mandatory)
 *     responses:
 *       201:
 *         description: Registration successful, verification email sent
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post(
  '/register/individual',
  authLimiter,
  validate(registerIndividualSchema),
  controller.registerIndividual
);

/**
 * @swagger
 * /customer/auth/register/company:
 *   post:
 *     summary: Register company customer
 *     description: Create a new company/organization customer account
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, companyName, contactFirstName, contactLastName, contactPhone]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Company email (used as user ID)
 *               password:
 *                 type: string
 *                 minLength: 8
 *               companyName:
 *                 type: string
 *                 description: Full company name
 *               contactFirstName:
 *                 type: string
 *                 description: Contact person first name
 *               contactLastName:
 *                 type: string
 *                 description: Contact person last name
 *               contactPhone:
 *                 type: string
 *                 description: Contact phone number (mandatory)
 *     responses:
 *       201:
 *         description: Registration successful, verification email sent
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post(
  '/register/company',
  authLimiter,
  validate(registerCompanySchema),
  controller.registerCompany
);

/**
 * @swagger
 * /customer/auth/verify:
 *   get:
 *     summary: Verify email address
 *     description: Verify customer email using token from email link
 *     tags: [Customer Auth]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token from email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify', validate(verifyEmailSchema), controller.verifyEmail);

/**
 * @swagger
 * /customer/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Send a new verification email to the customer
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *       404:
 *         description: User not found
 */
router.post(
  '/resend-verification',
  authLimiter,
  validate(resendVerificationSchema),
  controller.resendVerification
);

/**
 * @swagger
 * /customer/auth/login:
 *   post:
 *     summary: Customer login
 *     description: Authenticate customer and receive access tokens
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *       401:
 *         description: Invalid credentials or email not verified
 */
router.post(
  '/login',
  authLimiter,
  validate(customerLoginSchema),
  controller.login
);

/**
 * @swagger
 * /customer/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send password reset email to customer
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: If email exists, reset link will be sent
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  controller.forgotPassword
);

/**
 * @swagger
 * /customer/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Set new password using reset token
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: Reset token from email
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  controller.resetPassword
);

/**
 * @swagger
 * /customer/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Get new access token using refresh token
 *     tags: [Customer Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens generated
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), controller.refreshToken);

/**
 * @swagger
 * /customer/auth/logout:
 *   post:
 *     summary: Logout customer
 *     description: Invalidate current session (client should discard tokens)
 *     tags: [Customer Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', controller.logout);

/**
 * @swagger
 * /customer/auth/me:
 *   get:
 *     summary: Get customer profile
 *     description: Get authenticated customer's profile information
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Customer profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, controller.getProfile);

/**
 * @swagger
 * /customer/auth/properties:
 *   post:
 *     summary: Register a property
 *     description: Register a new property for the authenticated customer
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyAddress:
 *                 type: string
 *                 description: Combined format Flat-Building-Road-Block-Area (e.g., 1-1458-3435-334-Mahooz)
 *               flat:
 *                 type: string
 *               building:
 *                 type: string
 *               road:
 *                 type: string
 *               block:
 *                 type: string
 *               areaName:
 *                 type: string
 *               isPrimary:
 *                 type: boolean
 *                 default: false
 *               ownershipType:
 *                 type: string
 *                 enum: [OWNER, TENANT, AGENT]
 *                 default: TENANT
 *     responses:
 *       201:
 *         description: Property registered successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/properties',
  authenticate,
  validate(registerPropertySchema),
  controller.registerProperty.bind(controller)
);

/**
 * @swagger
 * /customer/auth/properties:
 *   get:
 *     summary: Get customer properties
 *     description: Get all properties for the authenticated customer
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, TRANSFERRED]
 *         description: Filter by status (default ACTIVE)
 *     responses:
 *       200:
 *         description: List of customer properties
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/properties',
  authenticate,
  validate(getCustomerPropertiesSchema),
  controller.getProperties.bind(controller)
);

/**
 * @swagger
 * /customer/auth/properties/{propertyId}/primary:
 *   post:
 *     summary: Set primary property
 *     description: Set a property as the primary/home property
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID to set as primary
 *     responses:
 *       200:
 *         description: Property set as primary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 */
router.post(
  '/properties/:propertyId/primary',
  authenticate,
  validate(setPrimaryPropertySchema),
  controller.setPrimaryProperty.bind(controller)
);

/**
 * @swagger
 * /customer/auth/areas:
 *   get:
 *     summary: List areas
 *     description: Get list of areas for property registration autocomplete
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering areas
 *     responses:
 *       200:
 *         description: List of areas
 */
router.get(
  '/areas',
  authenticate,
  validate(listAreasSchema),
  controller.listAreas.bind(controller)
);

/**
 * @swagger
 * /customer/auth/service-requests:
 *   post:
 *     summary: Create service request
 *     description: Create a new service request for the authenticated customer
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [propertyId, title, description]
 *             properties:
 *               propertyId:
 *                 type: string
 *                 description: ID of the property where service is needed
 *               category:
 *                 type: string
 *                 description: Service category (electrical, plumbing, ac_hvac, pest_control, general_maintenance)
 *               serviceType:
 *                 type: string
 *                 description: Alternative to category
 *               title:
 *                 type: string
 *                 description: Short title describing the issue
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *     responses:
 *       201:
 *         description: Service request created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/service-requests',
  authenticate,
  controller.createServiceRequest.bind(controller)
);

/**
 * @swagger
 * /customer/auth/service-requests:
 *   get:
 *     summary: Get customer's service requests
 *     description: Get all service requests for the authenticated customer
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (NEW, IN_PROGRESS, COMPLETED, etc.)
 *     responses:
 *       200:
 *         description: List of service requests
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/service-requests',
  authenticate,
  controller.getServiceRequests.bind(controller)
);

/**
 * @swagger
 * /customer/auth/service-requests/{id}:
 *   get:
 *     summary: Get service request details
 *     description: Get details of a specific service request by ID
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service request ID
 *     responses:
 *       200:
 *         description: Service request details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service request not found
 */
router.get(
  '/service-requests/:id',
  authenticate,
  controller.getServiceRequestById.bind(controller)
);

/**
 * @swagger
 * /customer/auth/service-requests/{id}/cancel:
 *   post:
 *     summary: Cancel service request
 *     description: Cancel a service request (only allowed when status is NEW)
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service request ID
 *     responses:
 *       200:
 *         description: Service request cancelled successfully
 *       400:
 *         description: Cannot cancel - request is not in NEW status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service request not found
 */
router.post(
  '/service-requests/:id/cancel',
  authenticate,
  controller.cancelServiceRequest.bind(controller)
);

/**
 * @swagger
 * /customer/auth/service-types:
 *   get:
 *     summary: Get available service types
 *     description: Get list of available service types for creating service requests
 *     tags: [Customer Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of service types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       nameAr:
 *                         type: string
 *                       description:
 *                         type: string
 *                       icon:
 *                         type: string
 *                       color:
 *                         type: string
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/service-types',
  authenticate,
  controller.getServiceTypes.bind(controller)
);

export default router;
