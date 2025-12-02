import { Request, Response, NextFunction } from 'express';
import { auditContext, AuditContext } from '../config/audit-context.js';

/**
 * Middleware that initializes the audit context for each request.
 * This should be applied globally BEFORE any routes.
 *
 * It creates an empty audit context, which will be populated
 * when the authenticate middleware runs and sets req.user.
 *
 * The Prisma extension will read from this context to set
 * createdById and updatedById fields.
 */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Initialize with null - will be updated by authenticate middleware
  const context: AuditContext = { userId: null };

  // Store context reference on request for later update
  (req as any).__auditContext = context;

  // Run the request within this audit context
  auditContext.run(context, () => {
    next();
  });
}

/**
 * Updates the audit context with the authenticated user ID.
 * Called from authenticate middleware after user is verified.
 */
export function setAuditUser(req: Request, userId: string) {
  const context = (req as any).__auditContext as AuditContext | undefined;
  if (context) {
    context.userId = userId;
  }
}
