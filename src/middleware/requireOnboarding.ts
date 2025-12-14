import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';

/**
 * Middleware to check if onboarding is complete before allowing access
 * to business features (service requests, invoices, quotes, etc.)
 */
export const requireOnboardingComplete = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_COMPANY',
          message: 'User is not associated with a company',
        },
      });
    }

    // Check onboarding progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { companyId },
    });

    // If no progress record exists or onboarding is not complete
    if (!progress || !progress.isCompleted) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ONBOARDING_INCOMPLETE',
          message: 'Please complete the setup wizard before accessing this feature',
          redirectTo: '/onboarding',
          minimumMet: progress?.minimumMet || false,
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if minimum requirements are met
 * (less strict than requireOnboardingComplete - allows access if minimumMet is true)
 */
export const requireMinimumSetup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_COMPANY',
          message: 'User is not associated with a company',
        },
      });
    }

    // Check onboarding progress
    const progress = await prisma.onboardingProgress.findUnique({
      where: { companyId },
    });

    // If no progress record exists or minimum requirements not met
    if (!progress || !progress.minimumMet) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'MINIMUM_SETUP_REQUIRED',
          message: 'Please complete the minimum setup requirements before using this feature',
          redirectTo: '/onboarding',
          isCompleted: progress?.isCompleted || false,
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
