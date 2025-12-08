import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();

// Request type enum values from Prisma schema
const REQUEST_TYPES = [
  { id: 'ON_CALL', name: 'On Call', nameAr: 'عند الطلب', description: 'Standard on-call service request' },
  { id: 'EMERGENCY', name: 'Emergency', nameAr: 'طوارئ', description: 'Emergency service request requiring immediate attention' },
  { id: 'AMC', name: 'AMC', nameAr: 'عقد صيانة سنوي', description: 'Annual Maintenance Contract service' },
  { id: 'WARRANTY', name: 'Warranty', nameAr: 'ضمان', description: 'Warranty covered service request' },
];

router.use(authenticate);

router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: REQUEST_TYPES,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const requestType = REQUEST_TYPES.find(rt => rt.id === req.params.id);
  if (!requestType) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Request type not found' },
    });
  }
  res.json({
    success: true,
    data: requestType,
  });
});

export default router;
