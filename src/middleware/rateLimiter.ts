import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiter - 100 requests per minute per IP
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use X-Forwarded-For header if behind a proxy, otherwise use IP
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           req.ip ||
           'unknown';
  },
});

// Stricter rate limiter for authentication endpoints - 5 requests per minute
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           req.ip ||
           'unknown';
  },
  skipSuccessfulRequests: true, // Don't count successful logins
});

// Rate limiter for password reset - 3 requests per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT',
      message: 'Too many password reset attempts. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for file uploads - 10 uploads per minute
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT',
      message: 'Too many file uploads. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
