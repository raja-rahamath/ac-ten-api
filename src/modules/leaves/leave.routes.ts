import { Router } from 'express';
import { LeaveController } from './leave.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createLeaveTypeSchema,
  updateLeaveTypeSchema,
  getLeaveTypeSchema,
  listLeaveTypesSchema,
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  approveLeaveRequestSchema,
  rejectLeaveRequestSchema,
  getLeaveRequestSchema,
  listLeaveRequestsSchema,
  getLeaveBalanceSchema,
  initializeLeaveBalanceSchema,
  adjustLeaveBalanceSchema,
} from './leave.schema.js';

const router = Router();
const controller = new LeaveController();

router.use(authenticate);

// ==================== LEAVE TYPE ROUTES ====================

router.post(
  '/types',
  authorize('leaves:write'),
  validate(createLeaveTypeSchema),
  controller.createLeaveType.bind(controller)
);

router.get(
  '/types',
  authorize('leaves:read'),
  validate(listLeaveTypesSchema),
  controller.findAllLeaveTypes.bind(controller)
);

router.get(
  '/types/:id',
  authorize('leaves:read'),
  validate(getLeaveTypeSchema),
  controller.findLeaveTypeById.bind(controller)
);

router.put(
  '/types/:id',
  authorize('leaves:write'),
  validate(updateLeaveTypeSchema),
  controller.updateLeaveType.bind(controller)
);

router.delete(
  '/types/:id',
  authorize('leaves:delete'),
  validate(getLeaveTypeSchema),
  controller.deleteLeaveType.bind(controller)
);

// ==================== LEAVE REQUEST ROUTES ====================

router.post(
  '/requests',
  authorize('leaves:write'),
  validate(createLeaveRequestSchema),
  controller.createLeaveRequest.bind(controller)
);

router.get(
  '/requests',
  authorize('leaves:read'),
  validate(listLeaveRequestsSchema),
  controller.findAllLeaveRequests.bind(controller)
);

router.get(
  '/requests/:id',
  authorize('leaves:read'),
  validate(getLeaveRequestSchema),
  controller.findLeaveRequestById.bind(controller)
);

router.put(
  '/requests/:id',
  authorize('leaves:write'),
  validate(updateLeaveRequestSchema),
  controller.updateLeaveRequest.bind(controller)
);

router.post(
  '/requests/:id/approve',
  authorize('leaves:approve'),
  validate(approveLeaveRequestSchema),
  controller.approveLeaveRequest.bind(controller)
);

router.post(
  '/requests/:id/reject',
  authorize('leaves:approve'),
  validate(rejectLeaveRequestSchema),
  controller.rejectLeaveRequest.bind(controller)
);

router.post(
  '/requests/:id/cancel',
  authorize('leaves:write'),
  validate(getLeaveRequestSchema),
  controller.cancelLeaveRequest.bind(controller)
);

// ==================== LEAVE BALANCE ROUTES ====================

router.get(
  '/balances/:employeeId',
  authorize('leaves:read'),
  validate(getLeaveBalanceSchema),
  controller.getLeaveBalance.bind(controller)
);

router.post(
  '/balances/initialize',
  authorize('leaves:write'),
  validate(initializeLeaveBalanceSchema),
  controller.initializeLeaveBalance.bind(controller)
);

router.put(
  '/balances/:employeeId/:leaveTypeId',
  authorize('leaves:write'),
  validate(adjustLeaveBalanceSchema),
  controller.adjustLeaveBalance.bind(controller)
);

// ==================== UTILITY ROUTES ====================

// Get employees on leave for a date range (useful for zone coverage)
router.get(
  '/on-leave',
  authorize('leaves:read'),
  controller.getEmployeesOnLeave.bind(controller)
);

export default router;
