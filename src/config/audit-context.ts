import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  userId: string | null;
}

// AsyncLocalStorage to track the current user across async operations
export const auditContext = new AsyncLocalStorage<AuditContext>();

/**
 * Get the current user ID from the audit context
 * Returns null if no user is in context (e.g., system operations, seeding)
 */
export function getCurrentUserId(): string | null {
  const context = auditContext.getStore();
  return context?.userId ?? null;
}

/**
 * Run a function within an audit context
 * Used by the authenticate middleware to set user context
 */
export function runWithAuditContext<T>(userId: string | null, fn: () => T): T {
  return auditContext.run({ userId }, fn);
}
