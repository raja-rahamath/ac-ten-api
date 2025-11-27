import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from './employee.service.js';
import { CreateEmployeeInput, UpdateEmployeeInput, ListEmployeesQuery } from './employee.schema.js';

const employeeService = new EmployeeService();

export class EmployeeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.create(req.body as CreateEmployeeInput);
      res.status(201).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const employee = await employeeService.findById(req.params.id);
      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.findAll(req.query as unknown as ListEmployeesQuery);
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
      const employee = await employeeService.update(req.params.id, req.body as UpdateEmployeeInput);
      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
