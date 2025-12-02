import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import { sanitize } from './middleware/sanitize.js';
import { auditMiddleware } from './middleware/auditMiddleware.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import healthRoutes from './modules/health/health.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import employeeRoutes from './modules/employees/employee.routes.js';
import serviceRequestRoutes from './modules/service-requests/service-request.routes.js';
import invoiceRoutes from './modules/invoices/invoice.routes.js';
import propertyRoutes from './modules/properties/property.routes.js';
import companyRoutes from './modules/companies/company.routes.js';
import divisionRoutes from './modules/divisions/division.routes.js';
import departmentRoutes from './modules/departments/department.routes.js';
import sectionRoutes from './modules/sections/section.routes.js';
import zoneRoutes from './modules/zones/zone.routes.js';
import countryRoutes from './modules/countries/country.routes.js';
import stateRoutes from './modules/states/state.routes.js';
import districtRoutes from './modules/districts/district.routes.js';
import governorateRoutes from './modules/governorates/governorate.routes.js';
import jobTitleRoutes from './modules/job-titles/job-title.routes.js';
import propertyTypeRoutes from './modules/property-types/property-type.routes.js';
import assetTypeRoutes from './modules/asset-types/asset-type.routes.js';
import complaintTypeRoutes from './modules/complaint-types/complaint-type.routes.js';
import inventoryCategoryRoutes from './modules/inventory-categories/inventory-category.routes.js';
import userRoutes from './modules/users/user.routes.js';
import roleRoutes from './modules/roles/role.routes.js';
import blockRoutes from './modules/blocks/block.routes.js';
import roadRoutes from './modules/roads/road.routes.js';
import buildingTypeRoutes from './modules/building-types/building-type.routes.js';
import unitTypeRoutes from './modules/unit-types/unit-type.routes.js';
import buildingRoutes from './modules/buildings/building.routes.js';
import unitRoutes from './modules/units/unit.routes.js';
import roomTypeRoutes from './modules/room-types/room-type.routes.js';
import roomRoutes from './modules/rooms/room.routes.js';
import assetRoutes from './modules/assets/asset.routes.js';
import leaveRoutes from './modules/leaves/leave.routes.js';
import menuRoutes from './modules/menus/menu.routes.js';
import amcRoutes from './modules/amc/amc.routes.js';
import quoteRoutes from './modules/quotes/quote.routes.js';
import receiptRoutes from './modules/receipts/receipt.routes.js';
import collectionRoutes from './modules/collections/collection.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import actionTemplateRoutes from './modules/action-templates/action-template.routes.js';
import estimateRoutes from './modules/estimates/estimate.routes.js';
import siteVisitRoutes from './modules/site-visits/site-visit.routes.js';
import workOrderRoutes from './modules/work-orders/work-order.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import membershipRoutes from './modules/memberships/membership.routes.js';

export function createApp(): Express {
  const app = express();

  // Security middleware with enhanced options
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for some frontend frameworks
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  }));

  // Apply general rate limiting to all API routes
  app.use('/api', apiLimiter);

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // XSS sanitization - sanitize all incoming request data
  app.use(sanitize);

  // Request logging
  app.use(pinoHttp({ logger }));

  // Audit context middleware - initializes audit context for tracking user who creates/updates records
  app.use(auditMiddleware);

  // Health check (no auth required)
  app.use('/health', healthRoutes);

  // API Documentation (no auth required)
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'AgentCare API Documentation',
  }));

  // JSON OpenAPI spec endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API routes
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/customers', customerRoutes);
  apiRouter.use('/employees', employeeRoutes);
  apiRouter.use('/service-requests', serviceRequestRoutes);
  apiRouter.use('/invoices', invoiceRoutes);
  apiRouter.use('/properties', propertyRoutes);
  apiRouter.use('/companies', companyRoutes);
  apiRouter.use('/divisions', divisionRoutes);
  apiRouter.use('/departments', departmentRoutes);
  apiRouter.use('/sections', sectionRoutes);
  apiRouter.use('/zones', zoneRoutes);
  apiRouter.use('/countries', countryRoutes);
  apiRouter.use('/states', stateRoutes);
  apiRouter.use('/districts', districtRoutes);
  apiRouter.use('/governorates', governorateRoutes);
  apiRouter.use('/job-titles', jobTitleRoutes);
  apiRouter.use('/property-types', propertyTypeRoutes);
  apiRouter.use('/asset-types', assetTypeRoutes);
  apiRouter.use('/complaint-types', complaintTypeRoutes);
  apiRouter.use('/inventory-categories', inventoryCategoryRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/roles', roleRoutes);
  apiRouter.use('/blocks', blockRoutes);
  apiRouter.use('/roads', roadRoutes);
  apiRouter.use('/building-types', buildingTypeRoutes);
  apiRouter.use('/unit-types', unitTypeRoutes);
  apiRouter.use('/buildings', buildingRoutes);
  apiRouter.use('/units', unitRoutes);
  apiRouter.use('/room-types', roomTypeRoutes);
  apiRouter.use('/rooms', roomRoutes);
  apiRouter.use('/assets', assetRoutes);
  apiRouter.use('/leaves', leaveRoutes);
  apiRouter.use('/menus', menuRoutes);
  apiRouter.use('/amc', amcRoutes);
  apiRouter.use('/quotes', quoteRoutes);
  apiRouter.use('/receipts', receiptRoutes);
  apiRouter.use('/collections', collectionRoutes);
  apiRouter.use('/reports', reportRoutes);
  apiRouter.use('/action-templates', actionTemplateRoutes);
  apiRouter.use('/estimates', estimateRoutes);
  apiRouter.use('/site-visits', siteVisitRoutes);
  apiRouter.use('/work-orders', workOrderRoutes);
  apiRouter.use('/notifications', notificationRoutes);
  apiRouter.use('/memberships', membershipRoutes);

  app.use(`/api/${config.apiVersion}`, apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
