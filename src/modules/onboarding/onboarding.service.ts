import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import {
  OnboardingStatus,
  OnboardingStep,
  OnboardingValidation,
  QUICK_STEPS,
  DETAILED_STEPS,
  SelectModeInput,
  UpdateBusinessSettingsInput,
} from './onboarding.schema.js';

export class OnboardingService {
  /**
   * Get or create onboarding progress for a company
   */
  async getOrCreateProgress(companyId: string) {
    let progress = await prisma.onboardingProgress.findUnique({
      where: { companyId },
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: { companyId },
      });
    }

    return progress;
  }

  /**
   * Get complete onboarding status including validation
   */
  async getStatus(companyId: string): Promise<OnboardingStatus> {
    const progress = await this.getOrCreateProgress(companyId);
    const validation = await this.validateMinimumRequirements(companyId);

    // Get step definitions based on mode
    const stepDefs = progress.setupMode === 'quick' ? QUICK_STEPS : DETAILED_STEPS;
    const stepsCompleted = (progress.stepsCompleted as string[]) || [];

    // Build step status with validation errors
    const steps: OnboardingStep[] = await Promise.all(
      stepDefs.map(async (step) => {
        const errors = await this.getStepValidationErrors(companyId, step.key, progress.setupMode);
        return {
          ...step,
          isComplete: stepsCompleted.includes(step.key),
          validationErrors: errors,
        };
      })
    );

    const completedCount = steps.filter((s) => s.isComplete).length;
    const totalSteps = steps.length;
    const completionPercentage = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

    return {
      setupMode: progress.setupMode as 'none' | 'quick' | 'detailed',
      currentStep: progress.currentStep,
      totalSteps,
      completionPercentage,
      isCompleted: progress.isCompleted,
      minimumMet: validation.allRequirementsMet,
      steps,
      validation,
    };
  }

  /**
   * Select setup mode (quick or detailed)
   */
  async selectMode(companyId: string, input: SelectModeInput) {
    const progress = await this.getOrCreateProgress(companyId);

    if (progress.setupMode !== 'none' && progress.currentStep > 0) {
      throw new BadRequestError('Setup mode already selected. Use reset to start over.');
    }

    const totalSteps = input.mode === 'quick' ? QUICK_STEPS.length : DETAILED_STEPS.length;

    const updated = await prisma.onboardingProgress.update({
      where: { companyId },
      data: {
        setupMode: input.mode,
        totalSteps,
        currentStep: 1,
      },
    });

    return this.getStatus(companyId);
  }

  /**
   * Save step data and mark step as complete if validation passes
   */
  async saveStep(companyId: string, stepNum: number) {
    const progress = await this.getOrCreateProgress(companyId);

    if (progress.setupMode === 'none') {
      throw new BadRequestError('Please select a setup mode first');
    }

    const stepDefs = progress.setupMode === 'quick' ? QUICK_STEPS : DETAILED_STEPS;
    const step = stepDefs.find((s) => s.stepNumber === stepNum);

    if (!step) {
      throw new BadRequestError(`Invalid step number: ${stepNum}`);
    }

    // Validate step requirements
    const errors = await this.getStepValidationErrors(companyId, step.key, progress.setupMode);

    if (errors.length > 0 && step.isRequired) {
      throw new BadRequestError(`Step validation failed: ${errors.join(', ')}`);
    }

    // Mark step as complete
    const stepsCompleted = (progress.stepsCompleted as string[]) || [];
    if (!stepsCompleted.includes(step.key)) {
      stepsCompleted.push(step.key);
    }

    // Update validation flags
    const validation = await this.validateMinimumRequirements(companyId);

    // Move to next step
    const nextStep = Math.min(stepNum + 1, stepDefs.length);

    await prisma.onboardingProgress.update({
      where: { companyId },
      data: {
        stepsCompleted,
        currentStep: nextStep,
        hasCompanyProfile: validation.hasCompanyProfile,
        hasServiceType: validation.hasServiceType,
        hasArea: validation.hasArea,
        hasZone: validation.hasZone,
        hasEmployee: validation.hasEmployee,
        minimumMet: validation.allRequirementsMet,
      },
    });

    return this.getStatus(companyId);
  }

  /**
   * Skip an optional step
   */
  async skipStep(companyId: string, stepNum: number) {
    const progress = await this.getOrCreateProgress(companyId);

    if (progress.setupMode === 'none') {
      throw new BadRequestError('Please select a setup mode first');
    }

    const stepDefs = progress.setupMode === 'quick' ? QUICK_STEPS : DETAILED_STEPS;
    const step = stepDefs.find((s) => s.stepNumber === stepNum);

    if (!step) {
      throw new BadRequestError(`Invalid step number: ${stepNum}`);
    }

    if (!step.canSkip) {
      throw new BadRequestError('This step cannot be skipped');
    }

    // Mark step as complete (skipped)
    const stepsCompleted = (progress.stepsCompleted as string[]) || [];
    if (!stepsCompleted.includes(step.key)) {
      stepsCompleted.push(step.key);
    }

    // Move to next step
    const nextStep = Math.min(stepNum + 1, stepDefs.length);

    await prisma.onboardingProgress.update({
      where: { companyId },
      data: {
        stepsCompleted,
        currentStep: nextStep,
      },
    });

    return this.getStatus(companyId);
  }

  /**
   * Complete onboarding
   */
  async complete(companyId: string) {
    const validation = await this.validateMinimumRequirements(companyId);

    if (!validation.allRequirementsMet) {
      throw new BadRequestError(
        `Cannot complete setup. Missing: ${validation.missingItems.join(', ')}`
      );
    }

    await prisma.onboardingProgress.update({
      where: { companyId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        minimumMet: true,
      },
    });

    // Create default business settings if not exists
    const existingSettings = await prisma.businessSettings.findUnique({
      where: { companyId },
    });

    if (!existingSettings) {
      await prisma.businessSettings.create({
        data: { companyId },
      });
    }

    return this.getStatus(companyId);
  }

  /**
   * Reset onboarding (admin only)
   */
  async reset(companyId: string) {
    await prisma.onboardingProgress.update({
      where: { companyId },
      data: {
        setupMode: 'none',
        totalSteps: 0,
        currentStep: 0,
        isCompleted: false,
        completedAt: null,
        stepsCompleted: [],
        minimumMet: false,
        hasCompanyProfile: false,
        hasServiceType: false,
        hasArea: false,
        hasZone: false,
        hasEmployee: false,
      },
    });

    return this.getStatus(companyId);
  }

  /**
   * Validate minimum requirements for creating service requests
   */
  async validateMinimumRequirements(companyId: string): Promise<OnboardingValidation> {
    const missingItems: string[] = [];

    // Check company profile
    const company = await prisma.company.findFirst({
      where: { id: companyId, isActive: true },
    });
    const hasCompanyProfile = !!(company?.name && company?.phone);
    if (!hasCompanyProfile) missingItems.push('Company profile (name and phone)');

    // Check service types (complaint types)
    const serviceTypeCount = await prisma.complaintType.count({
      where: { isActive: true },
    });
    const hasServiceType = serviceTypeCount > 0;
    if (!hasServiceType) missingItems.push('At least one service type');

    // Check areas
    const areaCount = await prisma.area.count({
      where: { isActive: true },
    });
    const hasArea = areaCount > 0;
    if (!hasArea) missingItems.push('At least one area');

    // Check zones
    const zoneCount = await prisma.zone.count({
      where: { isActive: true },
    });
    const hasZone = zoneCount > 0;
    if (!hasZone) missingItems.push('At least one zone');

    // Check employees with system access
    const employeeCount = await prisma.employee.count({
      where: {
        isActive: true,
        hasSystemAccess: true,
      },
    });
    const hasEmployee = employeeCount > 0;
    if (!hasEmployee) missingItems.push('At least one employee with system access');

    return {
      hasCompanyProfile,
      hasServiceType,
      hasArea,
      hasZone,
      hasEmployee,
      allRequirementsMet: missingItems.length === 0,
      missingItems,
    };
  }

  /**
   * Get validation errors for a specific step
   */
  async getStepValidationErrors(
    companyId: string,
    stepKey: string,
    mode: string
  ): Promise<string[]> {
    const errors: string[] = [];

    switch (stepKey) {
      case 'company':
        const company = await prisma.company.findFirst({
          where: { isActive: true },
        });
        if (!company?.name) errors.push('Company name is required');
        if (!company?.phone) errors.push('Company phone is required');
        if (!company?.email) errors.push('Company email is required');
        break;

      case 'service-location':
      case 'locations':
        const areaCount = await prisma.area.count({ where: { isActive: true } });
        if (areaCount === 0) errors.push('At least one area is required');

        const zoneCount = await prisma.zone.count({ where: { isActive: true } });
        if (zoneCount === 0) errors.push('At least one zone is required');
        break;

      case 'services':
        const serviceCount = await prisma.complaintType.count({ where: { isActive: true } });
        if (serviceCount === 0) errors.push('At least one service type is required');
        break;

      case 'organization':
        const deptCount = await prisma.department.count({ where: { isActive: true } });
        if (deptCount === 0) errors.push('At least one department is required');

        const jobCount = await prisma.jobTitle.count({ where: { isActive: true } });
        if (jobCount === 0) errors.push('At least one job title is required');
        break;

      case 'employee':
      case 'team':
        const empCount = await prisma.employee.count({
          where: { isActive: true, hasSystemAccess: true },
        });
        if (empCount === 0) errors.push('At least one employee with system access is required');
        break;

      case 'settings':
        // Business settings have defaults, so this is always valid
        break;

      case 'communication':
        // Optional step - no errors
        break;

      case 'review':
        // Check all minimum requirements
        const validation = await this.validateMinimumRequirements(companyId);
        if (!validation.allRequirementsMet) {
          errors.push(...validation.missingItems);
        }
        break;
    }

    return errors;
  }

  /**
   * Get or create business settings
   */
  async getBusinessSettings(companyId: string) {
    let settings = await prisma.businessSettings.findUnique({
      where: { companyId },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: { companyId },
      });
    }

    return settings;
  }

  /**
   * Update business settings
   */
  async updateBusinessSettings(companyId: string, input: UpdateBusinessSettingsInput) {
    const existing = await prisma.businessSettings.findUnique({
      where: { companyId },
    });

    if (!existing) {
      return prisma.businessSettings.create({
        data: {
          companyId,
          ...input,
          emailConfigured: !!(input.smtpHost && input.smtpUser),
        },
      });
    }

    return prisma.businessSettings.update({
      where: { companyId },
      data: {
        ...input,
        emailConfigured: !!(input.smtpHost || existing.smtpHost) && !!(input.smtpUser || existing.smtpUser),
      },
    });
  }
}
