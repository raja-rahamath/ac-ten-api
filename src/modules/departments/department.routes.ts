import { Router } from 'express';
import { DepartmentController } from './department.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentSchema,
  listDepartmentsSchema,
} from './department.schema.js';

const router = Router();
const controller = new DepartmentController();

router.use(authenticate);

router.post(
  '/',
  authorize('departments:write'),
  validate(createDepartmentSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('departments:read'),
  validate(listDepartmentsSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('departments:read'),
  validate(getDepartmentSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('departments:write'),
  validate(updateDepartmentSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('departments:delete'),
  validate(getDepartmentSchema),
  controller.delete.bind(controller)
);

export default router;
