import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.schema.js';

const router = Router();
const controller = new AuthController();

router.post('/login', validate(loginSchema), controller.login);
router.post('/register', validate(registerSchema), controller.register);
router.post('/refresh', validate(refreshTokenSchema), controller.refreshToken);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

export default router;
