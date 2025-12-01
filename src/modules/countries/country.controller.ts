import { Request, Response, NextFunction } from 'express';
import { CountryService } from './country.service.js';
import { CreateCountryInput, UpdateCountryInput, ListCountriesQuery } from './country.schema.js';

const countryService = new CountryService();

export class CountryController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const country = await countryService.create(req.body as CreateCountryInput);
      res.status(201).json({
        success: true,
        data: country,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const country = await countryService.findById(req.params.id);
      res.json({
        success: true,
        data: country,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await countryService.findAll(req.query as unknown as ListCountriesQuery);
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
      const country = await countryService.update(req.params.id, req.body as UpdateCountryInput);
      res.json({
        success: true,
        data: country,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await countryService.delete(req.params.id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
