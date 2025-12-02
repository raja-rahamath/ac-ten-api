import { Router } from 'express';
import { CompanyController } from './company.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createCompanySchema,
  updateCompanySchema,
  getCompanySchema,
  listCompaniesSchema,
} from './company.schema.js';

const router = Router();
const controller = new CompanyController();

router.use(authenticate);

// Get primary company for header display (must be before /:id routes)
router.get(
  '/primary',
  authorize('companies:read'),
  controller.getPrimary.bind(controller)
);

router.post(
  '/',
  authorize('companies:write'),
  validate(createCompanySchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('companies:read'),
  validate(listCompaniesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('companies:read'),
  validate(getCompanySchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('companies:write'),
  validate(updateCompanySchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('companies:delete'),
  validate(getCompanySchema),
  controller.delete.bind(controller)
);

// Set a company as primary
router.post(
  '/:id/set-primary',
  authorize('companies:write'),
  validate(getCompanySchema),
  controller.setPrimary.bind(controller)
);

export default router;
