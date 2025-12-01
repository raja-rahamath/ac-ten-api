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

  app.use(`/api/${config.apiVersion}`, apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
