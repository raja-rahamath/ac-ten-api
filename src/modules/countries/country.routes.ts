import { Router } from 'express';
import { CountryController } from './country.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import {
  createCountrySchema,
  updateCountrySchema,
  getCountrySchema,
  listCountriesSchema,
} from './country.schema.js';

const router = Router();
const controller = new CountryController();

router.use(authenticate);

router.post(
  '/',
  authorize('countries:write'),
  validate(createCountrySchema),
  controller.create.bind(controller)
);

router.get(
  '/',
  authorize('countries:read'),
  validate(listCountriesSchema),
  controller.findAll.bind(controller)
);

router.get(
  '/:id',
  authorize('countries:read'),
  validate(getCountrySchema),
  controller.findById.bind(controller)
);

router.put(
  '/:id',
  authorize('countries:write'),
  validate(updateCountrySchema),
  controller.update.bind(controller)
);

router.delete(
  '/:id',
  authorize('countries:delete'),
  validate(getCountrySchema),
  controller.delete.bind(controller)
);

export default router;
