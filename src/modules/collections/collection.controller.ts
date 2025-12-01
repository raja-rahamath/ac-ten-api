import { Request, Response, NextFunction } from 'express';
import { CollectionService } from './collection.service.js';
import {
  ListCollectionsQuery,
  UpdateCollectionInput,
  VoidCollectionInput,
  CollectionDailyReportQuery,
} from './collection.schema.js';

const collectionService = new CollectionService();

export class CollectionController {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await collectionService.findAll(req.query as unknown as ListCollectionsQuery);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await collectionService.findById(req.params.id);
      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await collectionService.update(req.params.id, req.body as UpdateCollectionInput);
      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async void(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await collectionService.void(
        req.params.id,
        req.body as VoidCollectionInput,
        req.user!.id
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { fromDate, toDate } = req.query as { fromDate?: string; toDate?: string };
      const stats = await collectionService.getStats(fromDate, toDate);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDailyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await collectionService.getDailyReport(req.query as unknown as CollectionDailyReportQuery);
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCollectors(req: Request, res: Response, next: NextFunction) {
    try {
      const collectors = await collectionService.getCollectors();
      res.json({
        success: true,
        data: collectors,
      });
    } catch (error) {
      next(error);
    }
  }
}
