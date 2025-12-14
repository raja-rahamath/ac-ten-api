import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { prisma } from '../config/database.js';
import { setAuditUser } from './auditMiddleware.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  type: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
        employeeId?: string;
        departmentId?: string;
        companyId?: string;
        customerId?: string;
      };
    }
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    // Check for internal API key first (service-to-service communication)
    const internalApiKey = req.headers['x-internal-api-key'] as string;
    if (internalApiKey && internalApiKey === config.internalApiKey) {
      // Internal service authenticated - set system user context
      req.user = {
        id: 'system',
        email: 'system@agentcare.internal',
        role: 'admin',
        permissions: ['*:*'], // Full access for internal services
      };
      // Set the audit context for system operations
      setAuditUser(req, 'system');
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;

    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Get user with role, permissions, employee, and customer info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        employee: {
          select: {
            id: true,
            departmentId: true,
            companyId: true,
          },
        },
        customer: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    const permissions = user.role?.permissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`
    ) || [];

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role?.name || 'user',
      permissions,
      employeeId: user.employee?.id,
      departmentId: user.employee?.departmentId || undefined,
      companyId: user.employee?.companyId || undefined,
      customerId: user.customer?.id,
    };

    // Set the audit context for this request
    setAuditUser(req, user.id);

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else {
      next(error);
    }
  }
}

export function authorize(...requiredPermissions: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user has at least one of the required permissions
    const hasPermission = requiredPermissions.some((permission) =>
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}
