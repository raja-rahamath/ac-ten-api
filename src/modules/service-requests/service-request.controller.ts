import { Request, Response, NextFunction } from 'express';
import { ServiceRequestService } from './service-request.service.js';
import {
  CreateServiceRequestInput,
  UpdateServiceRequestInput,
  AssignServiceRequestInput,
  ListServiceRequestsQuery,
} from './service-request.schema.js';

const serviceRequestService = new ServiceRequestService();

export class ServiceRequestController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequest = await serviceRequestService.create(
        req.body as CreateServiceRequestInput
      );
      res.status(201).json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequest = await serviceRequestService.findById(req.params.id);
      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serviceRequestService.findAll(
        req.query as unknown as ListServiceRequestsQuery
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequest = await serviceRequestService.update(
        req.params.id,
        req.body as UpdateServiceRequestInput,
        req.user?.id
      );
      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async assign(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequest = await serviceRequestService.assign(
        req.params.id,
        req.body as AssignServiceRequestInput,
        req.user?.id
      );
      res.json({
        success: true,
        data: serviceRequest,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serviceRequestService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await serviceRequestService.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
