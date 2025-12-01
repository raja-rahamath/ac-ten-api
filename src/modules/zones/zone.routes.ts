import { Router } from 'express';
import { ZoneController } from './zone.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createZoneSchema,
  updateZoneSchema,
  getZoneSchema,
  listZonesSchema,
  getZoneTeamSchema,
  assignEmployeeToZoneSchema,
  removeEmployeeFromZoneSchema,
  updateZoneHeadsSchema,
} from './zone.schema.js';

const router = Router();
const controller = new ZoneController();

router.use(authenticate);

router.post(
  '/',
  authorize('zones:write'),
  validate(createZoneSchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('zones:read'),
  validate(listZonesSchema),
  controller.findAll.bind(controller)
);

// GET /zones/coverage - Get all zones coverage status summary (must be before /:id)
router.get(
  '/coverage',
  authorize('zones:read'),
  controller.getAllZonesCoverageStatus.bind(controller)
);

router.get(
  '/:id',
  authorize('zones:read'),
  validate(getZoneSchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('zones:write'),
  validate(updateZoneSchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('zones:delete'),
  validate(getZoneSchema),
  controller.delete.bind(controller)
);

// Zone Team Management Routes

// GET /zones/:id/team - Get zone team (heads, technicians, helpers)
router.get(
  '/:id/team',
  authorize('zones:read'),
  validate(getZoneTeamSchema),
  controller.getZoneTeam.bind(controller)
);

// POST /zones/:id/team - Assign employee to zone
router.post(
  '/:id/team',
  authorize('zones:write'),
  validate(assignEmployeeToZoneSchema),
  controller.assignEmployeeToZone.bind(controller)
);

// DELETE /zones/:id/team/:employeeId - Remove employee from zone
router.delete(
  '/:id/team/:employeeId',
  authorize('zones:write'),
  validate(removeEmployeeFromZoneSchema),
  controller.removeEmployeeFromZone.bind(controller)
);

// PUT /zones/:id/heads - Update zone heads (primary and/or secondary)
router.put(
  '/:id/heads',
  authorize('zones:write'),
  validate(updateZoneHeadsSchema),
  controller.updateZoneHeads.bind(controller)
);

// Zone Coverage Routes

// GET /zones/:id/active-head - Get currently active zone head (considers leave)
router.get(
  '/:id/active-head',
  authorize('zones:read'),
  validate(getZoneTeamSchema),
  controller.getActiveZoneHead.bind(controller)
);

// GET /zones/:id/coverage - Get zone coverage status for date range
router.get(
  '/:id/coverage',
  authorize('zones:read'),
  validate(getZoneTeamSchema),
  controller.getZoneCoverageStatus.bind(controller)
);

export default router;
