import { Request, Response, NextFunction } from 'express';
import { ActionTemplateService } from './action-template.service.js';
import { CreateActionTemplateInput, UpdateActionTemplateInput, ListActionTemplatesQuery } from './action-template.schema.js';

const actionTemplateService = new ActionTemplateService();

export class ActionTemplateController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const actionTemplate = await actionTemplateService.create(req.body as CreateActionTemplateInput);
      res.status(201).json({
        success: true,
        data: actionTemplate,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const actionTemplate = await actionTemplateService.findById(req.params.id);
      res.json({
        success: true,
        data: actionTemplate,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await actionTemplateService.findAll(req.query as unknown as ListActionTemplatesQuery);
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
      const actionTemplate = await actionTemplateService.update(req.params.id, req.body as UpdateActionTemplateInput);
      res.json({
        success: true,
        data: actionTemplate,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await actionTemplateService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
