import { Request, Response, NextFunction } from 'express';
import { BlockService } from './block.service.js';
import { CreateBlockInput, UpdateBlockInput, ListBlocksQuery } from './block.schema.js';

const blockService = new BlockService();

export class BlockController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await blockService.create(req.body as CreateBlockInput);
      res.status(201).json({
        success: true,
        data: block,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await blockService.findById(req.params.id);
      res.json({
        success: true,
        data: block,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blockService.findAll(req.query as unknown as ListBlocksQuery);
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
      const block = await blockService.update(req.params.id, req.body as UpdateBlockInput);
      res.json({
        success: true,
        data: block,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blockService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
