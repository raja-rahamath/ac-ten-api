import { Request, Response, NextFunction } from 'express';
import { JobTitleService } from './job-title.service.js';
import { CreateJobTitleInput, UpdateJobTitleInput, ListJobTitlesQuery } from './job-title.schema.js';

const jobTitleService = new JobTitleService();

export class JobTitleController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const jobTitle = await jobTitleService.create(req.body as CreateJobTitleInput);
      res.status(201).json({
        success: true,
        data: jobTitle,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const jobTitle = await jobTitleService.findById(req.params.id);
      res.json({
        success: true,
        data: jobTitle,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobTitleService.findAll(req.query as unknown as ListJobTitlesQuery);
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
      const jobTitle = await jobTitleService.update(req.params.id, req.body as UpdateJobTitleInput);
      res.json({
        success: true,
        data: jobTitle,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobTitleService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
