import { Request, Response, NextFunction } from 'express';
import { ComplaintTypeService } from './complaint-type.service.js';
import { CreateComplaintTypeInput, UpdateComplaintTypeInput, ListComplaintTypesQuery } from './complaint-type.schema.js';

const complaintTypeService = new ComplaintTypeService();

export class ComplaintTypeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const complaintType = await complaintTypeService.create(req.body as CreateComplaintTypeInput);
      res.status(201).json({
        success: true,
        data: complaintType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const complaintType = await complaintTypeService.findById(req.params.id);
      res.json({
        success: true,
        data: complaintType,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await complaintTypeService.findAll(req.query as unknown as ListComplaintTypesQuery);
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
      const complaintType = await complaintTypeService.update(req.params.id, req.body as UpdateComplaintTypeInput);
      res.json({
        success: true,
        data: complaintType,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await complaintTypeService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
