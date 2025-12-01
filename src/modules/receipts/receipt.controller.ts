import { Request, Response, NextFunction } from 'express';
import { ReceiptService } from './receipt.service.js';
import {
  createReceiptSchema,
  generateFromPaymentSchema,
  voidReceiptSchema,
  receiptQuerySchema,
} from './receipt.schema.js';

const receiptService = new ReceiptService();

export class ReceiptController {
  // Create receipt
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createReceiptSchema.parse(req.body);
      const userId = (req as any).user.id;

      const receipt = await receiptService.create(data, userId);

      res.status(201).json({
        success: true,
        message: 'Receipt created successfully',
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate receipt from payment
  async generateFromPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateFromPaymentSchema.parse(req.body);
      const userId = (req as any).user.id;

      const receipt = await receiptService.generateFromPayment(data.paymentId, userId);

      res.status(201).json({
        success: true,
        message: 'Receipt generated successfully',
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all receipts
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = receiptQuerySchema.parse(req.query);
      const result = await receiptService.getAll(query);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get receipt by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const receipt = await receiptService.getById(id);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found',
        });
      }

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get receipt by number
  async getByReceiptNo(req: Request, res: Response, next: NextFunction) {
    try {
      const { receiptNo } = req.params;
      const receipt = await receiptService.getByReceiptNo(receiptNo);

      if (!receipt) {
        return res.status(404).json({
          success: false,
          message: 'Receipt not found',
        });
      }

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  // Void receipt
  async void(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = voidReceiptSchema.parse(req.body);
      const userId = (req as any).user.id;

      const receipt = await receiptService.void(id, data, userId);

      res.json({
        success: true,
        message: 'Receipt voided successfully',
        data: receipt,
      });
    } catch (error) {
      next(error);
    }
  }

  // Record print
  async recordPrint(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await receiptService.recordPrint(id);

      res.json({
        success: true,
        message: 'Print recorded',
      });
    } catch (error) {
      next(error);
    }
  }

  // Record email
  async recordEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await receiptService.recordEmail(id);

      res.json({
        success: true,
        message: 'Email sent',
      });
    } catch (error) {
      next(error);
    }
  }

  // Get receipts by invoice
  async getByInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { invoiceId } = req.params;
      const receipts = await receiptService.getByInvoice(invoiceId);

      res.json({
        success: true,
        data: receipts,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get receipts by customer
  async getByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const receipts = await receiptService.getByCustomer(customerId);

      res.json({
        success: true,
        data: receipts,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await receiptService.getStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
