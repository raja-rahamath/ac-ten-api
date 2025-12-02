import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter, passwordResetLimiter } from '../../middleware/rateLimiter.js';
import { loginSchema, registerSchema, refreshTokenSchema } from './auth.schema.js';

const router = Router();
const controller = new AuthController();

// Apply stricter rate limiting to authentication endpoints
router.post('/login', authLimiter, validate(loginSchema), controller.login);
router.post('/register', authLimiter, validate(registerSchema), controller.register);
router.post('/refresh', validate(refreshTokenSchema), controller.refreshToken);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

export default router;
