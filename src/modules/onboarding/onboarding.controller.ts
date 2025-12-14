import { Request, Response, NextFunction } from 'express';
import { OnboardingService } from './onboarding.service.js';
import { SelectModeInput, SaveStepInput, UpdateBusinessSettingsInput } from './onboarding.schema.js';

const onboardingService = new OnboardingService();

/**
 * Get onboarding status
 */
export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const status = await onboardingService.getStatus(companyId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Select setup mode (quick or detailed)
 */
export const selectMode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const input: SelectModeInput = req.body;
    const status = await onboardingService.selectMode(companyId, input);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get step details
 */
export const getStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;
    const stepNum = parseInt(req.params.stepNum, 10);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const status = await onboardingService.getStatus(companyId);
    const step = status.steps.find((s) => s.stepNumber === stepNum);

    if (!step) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Step ${stepNum} not found` },
      });
    }

    res.json({
      success: true,
      data: {
        step,
        currentStep: status.currentStep,
        totalSteps: status.totalSteps,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save step data and mark complete
 */
export const saveStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;
    const stepNum = parseInt(req.params.stepNum, 10);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const status = await onboardingService.saveStep(companyId, stepNum);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Skip an optional step
 */
export const skipStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;
    const stepNum = parseInt(req.params.stepNum, 10);

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const status = await onboardingService.skipStep(companyId, stepNum);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get validation status
 */
export const getValidation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const validation = await onboardingService.validateMinimumRequirements(companyId);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete onboarding
 */
export const complete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const status = await onboardingService.complete(companyId);

    res.json({
      success: true,
      data: status,
      message: 'Onboarding completed successfully! You can now access all features.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset onboarding (admin only)
 */
export const reset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const status = await onboardingService.reset(companyId);

    res.json({
      success: true,
      data: status,
      message: 'Onboarding has been reset',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get business settings
 */
export const getBusinessSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const settings = await onboardingService.getBusinessSettings(companyId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update business settings
 */
export const updateBusinessSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_COMPANY', message: 'User is not associated with a company' },
      });
    }

    const input: UpdateBusinessSettingsInput = req.body;
    const settings = await onboardingService.updateBusinessSettings(companyId, input);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};
