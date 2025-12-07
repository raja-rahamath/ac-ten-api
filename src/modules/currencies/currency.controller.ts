import { Request, Response, NextFunction } from 'express';
import { CurrencyService } from './currency.service.js';
import { CreateCurrencyInput, UpdateCurrencyInput, ListCurrenciesQuery } from './currency.schema.js';

const currencyService = new CurrencyService();

export class CurrencyController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const currency = await currencyService.create(req.body as CreateCurrencyInput);
      res.status(201).json({
        success: true,
        data: currency,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const currency = await currencyService.findById(req.params.id);
      res.json({
        success: true,
        data: currency,
      });
    } catch (error) {
      next(error);
    }
  }

  async findByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const currency = await currencyService.findByCode(req.params.code);
      res.json({
        success: true,
        data: currency,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const currency = await currencyService.getDefault();
      res.json({
        success: true,
        data: currency,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await currencyService.findAll(req.query as unknown as ListCurrenciesQuery);
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
      const currency = await currencyService.update(req.params.id, req.body as UpdateCurrencyInput);
      res.json({
        success: true,
        data: currency,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await currencyService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      const currency = await currencyService.setDefault(req.params.id);
      res.json({
        success: true,
        data: currency,
      });
    } catch (error) {
      next(error);
    }
  }
}
