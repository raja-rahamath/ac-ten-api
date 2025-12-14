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

  async findMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: { message: 'User not authenticated' },
        });
      }
      const employee = await employeeService.findByUserId(userId);
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
      const userContext = req.user ? {
        role: req.user.role,
        departmentId: req.user.departmentId,
      } : undefined;

      const result = await employeeService.findAll(
        req.query as unknown as ListEmployeesQuery,
        userContext
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

  async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = await employeeService.exportToExcel();
      const filename = `employees_${new Date().toISOString().split('T')[0]}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buffer));
    } catch (error) {
      next(error);
    }
  }

  async getImportTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = await employeeService.getImportTemplate();
      const filename = 'employee_import_template.xlsx';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(Buffer.from(buffer));
    } catch (error) {
      next(error);
    }
  }

  async importExcel(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { message: 'No file uploaded' },
        });
      }

      const result = await employeeService.importFromExcel(req.file.buffer);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
