import { Request, Response, NextFunction } from 'express';
import { MembershipService } from './membership.service.js';
import {
  createPlanSchema,
  updatePlanSchema,
  subscribeSchema,
  renewSchema,
  changePlanSchema,
  cancelSchema,
  suspendSchema,
  reactivateSchema,
  useFreeVisitSchema,
  planQuerySchema,
  membershipQuerySchema,
} from './membership.schema.js';

export class MembershipController {
  private membershipService: MembershipService;

  constructor() {
    this.membershipService = new MembershipService();
  }

  // ==================== PLANS ====================

  // Create plan
  async createPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createPlanSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const plan = await this.membershipService.createPlan(data, userId);
      res.status(201).json(plan);
    } catch (error) {
      next(error);
    }
  }

  // Update plan
  async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = updatePlanSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const plan = await this.membershipService.updatePlan(id, data, userId);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  // Get all plans
  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const query = planQuerySchema.parse(req.query);
      const result = await this.membershipService.getPlans(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get plan by ID
  async getPlanById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const plan = await this.membershipService.getPlanById(id);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  // Get plan by code
  async getPlanByCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.params;
      const plan = await this.membershipService.getPlanByCode(code);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  }

  // Delete plan
  async deletePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.membershipService.deletePlan(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ==================== SUBSCRIPTIONS ====================

  // Subscribe customer
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = subscribeSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const membership = await this.membershipService.subscribe(data, userId);
      res.status(201).json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Renew membership
  async renew(req: Request, res: Response, next: NextFunction) {
    try {
      const data = renewSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const membership = await this.membershipService.renew(data.membershipId, userId);
      res.json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Change plan
  async changePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const data = changePlanSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const membership = await this.membershipService.changePlan(data, userId);
      res.json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Cancel membership
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const data = cancelSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const membership = await this.membershipService.cancel(data, userId);
      res.json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Suspend membership
  async suspend(req: Request, res: Response, next: NextFunction) {
    try {
      const data = suspendSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const membership = await this.membershipService.suspend(data.membershipId, data.reason, userId);
      res.json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Reactivate membership
  async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = reactivateSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const membership = await this.membershipService.reactivate(data.membershipId, userId);
      res.json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Get all memberships
  async getMemberships(req: Request, res: Response, next: NextFunction) {
    try {
      const query = membershipQuerySchema.parse(req.query);
      const result = await this.membershipService.getMemberships(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get membership by ID
  async getMembershipById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const membership = await this.membershipService.getMembershipById(id);
      res.json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Get customer's active membership
  async getCustomerMembership(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const membership = await this.membershipService.getCustomerMembership(customerId);
      res.json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Use free visit
  async useFreeVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = useFreeVisitSchema.parse(req.body);
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const membership = await this.membershipService.useFreeVisit(data.membershipId, userId);
      res.json(membership);
    } catch (error) {
      next(error);
    }
  }

  // Get statistics
  async getStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await this.membershipService.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Process expired memberships (cron endpoint)
  async processExpired(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.membershipService.processExpiredMemberships();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
