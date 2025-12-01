import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service.js';
import { CreateDepartmentInput, UpdateDepartmentInput, ListDepartmentsQuery } from './department.schema.js';

const departmentService = new DepartmentService();

export class DepartmentController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.create(req.body as CreateDepartmentInput);
      res.status(201).json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const department = await departmentService.findById(req.params.id);
      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await departmentService.findAll(req.query as unknown as ListDepartmentsQuery);
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
      const department = await departmentService.update(req.params.id, req.body as UpdateDepartmentInput);
      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await departmentService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
