import { Router } from 'express';
import { ReportController } from './report.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  dateRangeSchema,
  serviceRequestReportSchema,
  revenueReportSchema,
  employeeReportSchema,
} from './report.schema.js';

const router = Router();
const controller = new ReportController();

router.use(authenticate);

// Dashboard summary
router.get(
  '/dashboard',
  authorize('reports:read'),
  validate(dateRangeSchema),
  controller.getDashboardSummary.bind(controller)
);

// Service request report
router.get(
  '/service-requests',
  authorize('reports:read'),
  validate(serviceRequestReportSchema),
  controller.getServiceRequestReport.bind(controller)
);

// Revenue report
router.get(
  '/revenue',
  authorize('reports:read'),
  validate(revenueReportSchema),
  controller.getRevenueReport.bind(controller)
);

// AMC report
router.get(
  '/amc',
  authorize('reports:read'),
  validate(dateRangeSchema),
  controller.getAmcReport.bind(controller)
);

// Employee performance report
router.get(
  '/employees',
  authorize('reports:read'),
  validate(employeeReportSchema),
  controller.getEmployeeReport.bind(controller)
);

// Customer report
router.get(
  '/customers',
  authorize('reports:read'),
  validate(dateRangeSchema),
  controller.getCustomerReport.bind(controller)
);

export default router;
