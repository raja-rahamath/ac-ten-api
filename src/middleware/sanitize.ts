import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * Options for XSS sanitization
 */
const xssOptions = {
  whiteList: {}, // No HTML tags allowed
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Recursively sanitize all string values in an object
 */
function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return xss(value, xssOptions);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Middleware to sanitize request body, query, and params against XSS attacks
 */
export function sanitize(req: Request, _res: Response, next: NextFunction) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query) as typeof req.query;
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params) as typeof req.params;
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Sanitize a single string value - useful for manual sanitization
 */
export function sanitizeString(value: string): string {
  return xss(value, xssOptions);
}
