import { Router } from 'express';
import { EmployeeController } from './employee.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  getEmployeeSchema,
  listEmployeesSchema,
} from './employee.schema.js';

const router = Router();
const controller = new EmployeeController();

router.use(authenticate);

router.post(
  '/',
  authorize('employees:write'),
  validate(createEmployeeSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('employees:read'),
  validate(listEmployeesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('employees:read'),
  validate(getEmployeeSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('employees:write'),
  validate(updateEmployeeSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('employees:delete'),
  validate(getEmployeeSchema),
  controller.delete.bind(controller)
);

export default router;
