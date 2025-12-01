import { Request, Response, NextFunction } from 'express';
import { ReportService } from './report.service.js';
import {
  DateRangeQuery,
  ServiceRequestReportQuery,
  RevenueReportQuery,
  EmployeeReportQuery,
} from './report.schema.js';

const reportService = new ReportService();

export class ReportController {
  async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getDashboardSummary(req.query as unknown as DateRangeQuery);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceRequestReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getServiceRequestReport(
        req.query as unknown as ServiceRequestReportQuery
      );
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getRevenueReport(req.query as unknown as RevenueReportQuery);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAmcReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getAmcReport(req.query as unknown as DateRangeQuery);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getEmployeeReport(req.query as unknown as EmployeeReportQuery);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerReport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportService.getCustomerReport(req.query as unknown as DateRangeQuery);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
