import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';

import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import serviceRequestRoutes from './modules/service-requests/service-request.routes.js';
import invoiceRoutes from './modules/invoices/invoice.routes.js';
import propertyRoutes from './modules/properties/property.routes.js';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
  }));

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(pinoHttp({ logger }));

  // Health check (no auth required)
  app.use('/health', healthRoutes);

  // API routes
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/customers', customerRoutes);
  apiRouter.use('/employees', employeeRoutes);
  apiRouter.use('/service-requests', serviceRequestRoutes);
  apiRouter.use('/invoices', invoiceRoutes);
  apiRouter.use('/properties', propertyRoutes);

  app.use(`/api/${config.apiVersion}`, apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
