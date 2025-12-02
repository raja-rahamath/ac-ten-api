import { Request, Response, NextFunction } from 'express';
import { ReviewService } from './review.service.js';
import {
  createReviewSchema,
  updateReviewSchema,
  respondToReviewSchema,
  reviewQuerySchema,
  requestReviewSchema,
} from './review.schema.js';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  // Create review
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createReviewSchema.parse(req.body);
      const userId = req.user?.id;
      const review = await this.reviewService.create(data, userId);
      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  }

  // Update review
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updateReviewSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const review = await this.reviewService.update(id, data, userId);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  // Respond to review
  async respond(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = respondToReviewSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const review = await this.reviewService.respond(id, data, userId);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  // Delete review
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.reviewService.delete(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // Get review by ID
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const review = await this.reviewService.getById(id);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  // Get all reviews
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = reviewQuerySchema.parse(req.query);
      const result = await this.reviewService.getAll(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get reviews by customer
  async getByCustomerId(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const reviews = await this.reviewService.getByCustomerId(customerId);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }

  // Get public reviews (no auth required)
  async getPublicReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const reviews = await this.reviewService.getPublicReviews(limit);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.reviewService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Toggle public visibility
  async togglePublic(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const review = await this.reviewService.togglePublic(id, userId);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  // Verify review
  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const review = await this.reviewService.verify(id, userId);
      res.json(review);
    } catch (error) {
      next(error);
    }
  }

  // Request review from customer
  async requestReview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = requestReviewSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await this.reviewService.requestReview(data, userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get reviews pending response
  async getPendingResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const reviews = await this.reviewService.getPendingResponse(limit);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }

  // Get recent negative reviews
  async getRecentNegative(req: Request, res: Response, next: NextFunction) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 2;
      const reviews = await this.reviewService.getRecentNegative(days, threshold);
      res.json(reviews);
    } catch (error) {
      next(error);
    }
  }
}
