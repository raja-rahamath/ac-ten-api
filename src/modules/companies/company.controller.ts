import { Request, Response, NextFunction } from 'express';
import { CompanyService } from './company.service.js';
import { CreateCompanyInput, UpdateCompanyInput, ListCompaniesQuery } from './company.schema.js';

const companyService = new CompanyService();

export class CompanyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.create(req.body as CreateCompanyInput);
      res.status(201).json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.findById(req.params.id);
      res.json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.findAll(req.query as unknown as ListCompaniesQuery);
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
      const company = await companyService.update(req.params.id, req.body as UpdateCompanyInput);
      res.json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await companyService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPrimary(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.getPrimary();
      res.json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }

  async setPrimary(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await companyService.setPrimary(req.params.id);
      res.json({
        success: true,
        data: company,
      });
    } catch (error) {
      next(error);
    }
  }
}
