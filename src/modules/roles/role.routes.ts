import { Router } from 'express';
import { RoleController } from './role.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createRoleSchema,
  updateRoleSchema,
  getRoleSchema,
  listRolesSchema,
  updateRolePermissionsSchema,
  DASHBOARD_WIDGETS,
} from './role.schema.js';

const router = Router();
const controller = new RoleController();

router.use(authenticate);

router.post(
  '/',
  authorize('roles:write'),
  validate(createRoleSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('roles:read'),
  validate(listRolesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/permissions',
  authorize('roles:read'),
  controller.getPermissions.bind(controller)
);

// Get available dashboard widgets
router.get(
  '/dashboard-widgets',
  authorize('roles:read'),
  (_req, res) => {
    res.json({ success: true, data: DASHBOARD_WIDGETS });
  }
);

router.get(
  '/:id',
  authorize('roles:read'),
  validate(getRoleSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('roles:write'),
  validate(updateRoleSchema),
  controller.update.bind(controller)
);

router.put(
  '/:id/permissions',
  authorize('roles:write'),
  validate(updateRolePermissionsSchema),
  controller.updatePermissions.bind(controller)
);

router.delete(
  '/:id',
  authorize('roles:delete'),
  validate(getRoleSchema),
  controller.delete.bind(controller)
);

export default router;
