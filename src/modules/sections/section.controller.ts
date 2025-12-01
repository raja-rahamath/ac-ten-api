import { Request, Response, NextFunction } from 'express';
import { SectionService } from './section.service.js';
import { CreateSectionInput, UpdateSectionInput, ListSectionsQuery } from './section.schema.js';

const sectionService = new SectionService();

export class SectionController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const section = await sectionService.create(req.body as CreateSectionInput);
      res.status(201).json({
        success: true,
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const section = await sectionService.findById(req.params.id);
      res.json({
        success: true,
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sectionService.findAll(req.query as unknown as ListSectionsQuery);
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
      const section = await sectionService.update(req.params.id, req.body as UpdateSectionInput);
      res.json({
        success: true,
        data: section,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await sectionService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
