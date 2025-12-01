import { Request, Response, NextFunction } from 'express';
import { DistrictService } from './district.service.js';
import { CreateDistrictInput, UpdateDistrictInput, ListDistrictsQuery } from './district.schema.js';

const districtService = new DistrictService();

export class DistrictController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const district = await districtService.create(req.body as CreateDistrictInput);
      res.status(201).json({
        success: true,
        data: district,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const district = await districtService.findById(req.params.id);
      res.json({
        success: true,
        data: district,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await districtService.findAll(req.query as unknown as ListDistrictsQuery);
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
      const district = await districtService.update(req.params.id, req.body as UpdateDistrictInput);
      res.json({
        success: true,
        data: district,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await districtService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
