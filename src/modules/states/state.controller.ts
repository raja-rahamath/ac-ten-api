import { Request, Response, NextFunction } from 'express';
import { StateService } from './state.service.js';
import { CreateStateInput, UpdateStateInput, ListStatesQuery } from './state.schema.js';

const stateService = new StateService();

export class StateController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const state = await stateService.create(req.body as CreateStateInput);
      res.status(201).json({
        success: true,
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const state = await stateService.findById(req.params.id);
      res.json({
        success: true,
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stateService.findAll(req.query as unknown as ListStatesQuery);
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
      const state = await stateService.update(req.params.id, req.body as UpdateStateInput);
      res.json({
        success: true,
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await stateService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
