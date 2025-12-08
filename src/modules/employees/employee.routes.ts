import { Router } from 'express';
import multer from 'multer';
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

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

router.use(authenticate);

// Export/Import routes (must come before /:id routes)
router.get(
  '/export/excel',
  authorize('employees:read'),
  controller.exportExcel.bind(controller)
);

router.get(
  '/import/template',
  authorize('employees:read'),
  controller.getImportTemplate.bind(controller)
);

router.post(
  '/import/excel',
  authorize('employees:write'),
  upload.single('file'),
  controller.importExcel.bind(controller)
);

// Current user's employee record (no special permission needed - just authentication)
router.get(
  '/me',
  controller.findMe.bind(controller)
);

// CRUD routes
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
