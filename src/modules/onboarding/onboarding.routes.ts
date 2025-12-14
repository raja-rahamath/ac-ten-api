import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  selectModeSchema,
  stepParamSchema,
  saveStepSchema,
  updateBusinessSettingsSchema,
} from './onboarding.schema.js';
import * as controller from './onboarding.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get onboarding status
router.get('/status', controller.getStatus);

// Select setup mode (quick or detailed)
router.post('/mode', validate(selectModeSchema), controller.selectMode);

// Get step details
router.get('/step/:stepNum', validate(stepParamSchema), controller.getStep);

// Save step data and mark complete
router.post('/step/:stepNum', validate(saveStepSchema), controller.saveStep);

// Skip an optional step
router.post('/step/:stepNum/skip', validate(stepParamSchema), controller.skipStep);

// Get validation status
router.get('/validation', controller.getValidation);

// Complete onboarding
router.post('/complete', controller.complete);

// Reset onboarding (admin only)
router.post('/reset', authorize('settings:write'), controller.reset);

// Business settings routes
router.get('/business-settings', controller.getBusinessSettings);
router.put(
  '/business-settings',
  validate(updateBusinessSettingsSchema),
  controller.updateBusinessSettings
);

export default router;
