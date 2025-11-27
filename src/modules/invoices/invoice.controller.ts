import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from './invoice.service.js';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ListInvoicesQuery,
  RecordPaymentInput,
} from './invoice.schema.js';

const invoiceService = new InvoiceService();

export class InvoiceController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.create(req.body as CreateInvoiceInput, req.user!.id);
      res.status(201).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.findById(req.params.id);
      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.findAll(req.query as unknown as ListInvoicesQuery);
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
      const invoice = await invoiceService.update(req.params.id, req.body as UpdateInvoiceInput);
      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const payment = await invoiceService.recordPayment(
        req.params.id,
        req.body as RecordPaymentInput,
        req.user!.id
      );
      res.status(201).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.delete(req.params.id);
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
      const stats = await invoiceService.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
