import { Request, Response, NextFunction } from 'express';
import { CustomerService } from './customer.service.js';
import { CreateCustomerInput, UpdateCustomerInput, ListCustomersQuery } from './customer.schema.js';

const customerService = new CustomerService();

export class CustomerController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.create(req.body as CreateCustomerInput);
      res.status(201).json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.findById(req.params.id);
      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.findAll(req.query as unknown as ListCustomersQuery);
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
      const customer = await customerService.update(req.params.id, req.body as UpdateCustomerInput);
      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
