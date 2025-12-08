import { Request, Response, NextFunction } from 'express';
import { CustomerPropertyService } from './customer-property.service.js';
import {
  CreateCustomerPropertyInput,
  UpdateCustomerPropertyInput,
  ListCustomerPropertiesQuery,
  GetCustomerPropertiesByCustomerQuery,
  TransferPropertyInput,
} from './customer-property.schema.js';

const customerPropertyService = new CustomerPropertyService();

export class CustomerPropertyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const customerProperty = await customerPropertyService.create(
        req.body as CreateCustomerPropertyInput,
        userId
      );
      res.status(201).json({
        success: true,
        data: customerProperty,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const customerProperty = await customerPropertyService.findById(req.params.id);
      res.json({
        success: true,
        data: customerProperty,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerPropertyService.findAll(
        req.query as unknown as ListCustomerPropertiesQuery
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customerProperties = await customerPropertyService.findByCustomer(
        req.params.customerId,
        req.query as unknown as GetCustomerPropertiesByCustomerQuery
      );
      res.json({
        success: true,
        data: customerProperties,
      });
    } catch (error) {
      next(error);
    }
  }

  async findByProperty(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await customerPropertyService.findByProperty(
        req.params.propertyId,
        req.query as unknown as GetCustomerPropertiesByCustomerQuery
      );
      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const customerProperty = await customerPropertyService.update(
        req.params.id,
        req.body as UpdateCustomerPropertyInput,
        userId
      );
      res.json({
        success: true,
        data: customerProperty,
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const customerProperty = await customerPropertyService.deactivate(req.params.id, userId);
      res.json({
        success: true,
        data: customerProperty,
      });
    } catch (error) {
      next(error);
    }
  }

  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const result = await customerPropertyService.transfer(
        req.params.id,
        req.body as TransferPropertyInput,
        userId
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerPropertyService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const serviceRequests = await customerPropertyService.getServiceHistory(req.params.id);
      res.json({
        success: true,
        data: serviceRequests,
      });
    } catch (error) {
      next(error);
    }
  }
}
