import { Request, Response, NextFunction } from 'express';
import { QuoteService } from './quote.service.js';
import {
  createQuoteSchema,
  updateQuoteSchema,
  sendQuoteSchema,
  customerResponseSchema,
  createRevisionSchema,
  convertToInvoiceSchema,
  quoteQuerySchema,
} from './quote.schema.js';

const quoteService = new QuoteService();

export class QuoteController {
  // Create quote
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createQuoteSchema.parse(req.body);
      const userId = (req as any).user.id;

      const quote = await quoteService.create(data, userId);

      res.status(201).json({
        success: true,
        message: 'Quote created successfully',
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all quotes
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = quoteQuerySchema.parse(req.query);
      const result = await quoteService.getAll(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get quote by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const quote = await quoteService.getById(id);

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Quote not found',
        });
      }

      res.json({
        success: true,
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update quote
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateQuoteSchema.parse(req.body);
      const userId = (req as any).user.id;

      const quote = await quoteService.update(id, data, userId);

      res.json({
        success: true,
        message: 'Quote updated successfully',
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete quote
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await quoteService.delete(id);

      res.json({
        success: true,
        message: 'Quote deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Send quote to customer
  async send(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const quote = await quoteService.send(id, userId);

      res.json({
        success: true,
        message: 'Quote sent successfully',
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark quote as viewed
  async markAsViewed(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await quoteService.markAsViewed(id);

      res.json({
        success: true,
        message: 'Quote marked as viewed',
      });
    } catch (error) {
      next(error);
    }
  }

  // Record customer response
  async recordResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = customerResponseSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const quote = await quoteService.recordCustomerResponse(id, data, userId);

      res.json({
        success: true,
        message: 'Response recorded successfully',
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create revision
  async createRevision(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = createRevisionSchema.parse(req.body);
      const userId = (req as any).user.id;

      const revision = await quoteService.createRevision(id, data, userId);

      res.status(201).json({
        success: true,
        message: 'Revision created successfully',
        data: revision,
      });
    } catch (error) {
      next(error);
    }
  }

  // Convert to invoice
  async convertToInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = convertToInvoiceSchema.parse(req.body);
      const userId = (req as any).user.id;

      const invoice = await quoteService.convertToInvoice(id, data, userId);

      res.status(201).json({
        success: true,
        message: 'Quote converted to invoice successfully',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel quote
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user.id;

      const quote = await quoteService.cancel(id, userId, reason);

      res.json({
        success: true,
        message: 'Quote cancelled successfully',
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await quoteService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get version history
  async getVersionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { quoteNo } = req.params;
      const versions = await quoteService.getVersionHistory(quoteNo);

      res.json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  // Expire overdue quotes (cron job endpoint)
  async expireOverdueQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await quoteService.expireOverdueQuotes();

      res.json({
        success: true,
        message: `Expired ${count} quotes`,
        data: { expiredCount: count },
      });
    } catch (error) {
      next(error);
    }
  }
}
