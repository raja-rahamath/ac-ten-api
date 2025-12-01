import { Router } from 'express';
import { MenuController } from './menu.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
  getMenuItemSchema,
  assignMenusToRoleSchema,
  getRoleMenusSchema,
} from './menu.schema.js';

const router = Router();
const controller = new MenuController();

router.use(authenticate);

// Current user's menus and zones
router.get('/me', controller.getMyMenus.bind(controller));
router.get('/me/zones', controller.getMyZones.bind(controller));

// Menu Items CRUD (admin only)
router.post(
  '/items',
  authorize('settings:write'),
  validate(createMenuItemSchema),
  controller.createMenuItem.bind(controller)
);

router.get(
  '/items',
  authorize('settings:read'),
  controller.getAllMenuItems.bind(controller)
);

router.get(
  '/items/:id',
  authorize('settings:read'),
  validate(getMenuItemSchema),
  controller.getMenuItemById.bind(controller)
);

router.put(
  '/items/:id',
  authorize('settings:write'),
  validate(updateMenuItemSchema),
  controller.updateMenuItem.bind(controller)
);

router.delete(
  '/items/:id',
  authorize('settings:write'),
  validate(getMenuItemSchema),
  controller.deleteMenuItem.bind(controller)
);

// Role Menu Permissions
router.get(
  '/roles',
  authorize('settings:read'),
  controller.getAllRolesWithMenus.bind(controller)
);

router.get(
  '/roles/:roleId',
  authorize('settings:read'),
  validate(getRoleMenusSchema),
  controller.getMenusForRole.bind(controller)
);

router.put(
  '/roles/:roleId',
  authorize('settings:write'),
  validate(assignMenusToRoleSchema),
  controller.assignMenusToRole.bind(controller)
);

export default router;
