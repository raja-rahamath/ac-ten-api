import { Router } from 'express';
import { AmcController } from './amc.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { requireMinimumSetup } from '../../middleware/requireOnboarding.js';

const router = Router();
const controller = new AmcController();

// All routes require authentication
router.use(authenticate);

// Dashboard Stats
router.get('/stats', controller.getDashboardStats.bind(controller));

// Schedules (global - not tied to specific contract)
router.get('/schedules', controller.getSchedules.bind(controller));
router.get('/schedules/calendar', controller.getSchedulesCalendar.bind(controller));
router.patch('/schedules/:scheduleId/status', controller.updateScheduleStatus.bind(controller));
router.post('/schedules/:scheduleId/reschedule', controller.rescheduleVisit.bind(controller));
router.post('/schedules/:scheduleId/convert', controller.convertToServiceRequest.bind(controller));

// Payments (global - not tied to specific contract)
router.get('/payments', controller.getPayments.bind(controller));
router.post('/payments/:paymentId/record', controller.recordPayment.bind(controller));

// Contract CRUD
router.post('/', requireMinimumSetup, controller.create.bind(controller));
router.get('/', controller.getAll.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.patch('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

// Contract Status
router.patch('/:id/status', controller.updateStatus.bind(controller));

// Contract Properties
router.post('/:id/properties', controller.addProperty.bind(controller));
router.delete('/:id/properties/:propertyId', controller.removeProperty.bind(controller));

// Contract Services
router.post('/:id/services', controller.addService.bind(controller));
router.delete('/:id/services/:serviceId', controller.removeService.bind(controller));

// Contract Schedule Generation
router.post('/:id/schedules/generate', controller.generateSchedules.bind(controller));

// Contract Payment Schedule Generation
router.post('/:id/payments/generate', controller.generatePaymentSchedule.bind(controller));

// Contract Renewal
router.post('/:id/renew', controller.renewContract.bind(controller));

// Bulk convert upcoming schedules to service requests
router.post('/:id/schedules/convert-upcoming', controller.convertUpcomingSchedules.bind(controller));

export default router;
