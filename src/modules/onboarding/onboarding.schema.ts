import { z } from 'zod';

// Setup mode enum
export const SetupMode = z.enum(['none', 'quick', 'detailed']);
export type SetupMode = z.infer<typeof SetupMode>;

// Select setup mode
export const selectModeSchema = z.object({
  body: z.object({
    mode: z.enum(['quick', 'detailed']),
  }),
});
export type SelectModeInput = z.infer<typeof selectModeSchema>['body'];

// Step number param
export const stepParamSchema = z.object({
  params: z.object({
    stepNum: z.string().transform((val) => parseInt(val, 10)),
  }),
});

// Save step data - generic container for step-specific data
export const saveStepSchema = z.object({
  params: z.object({
    stepNum: z.string().transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    data: z.record(z.any()).optional(),
  }),
});
export type SaveStepInput = z.infer<typeof saveStepSchema>;

// Business settings update
export const updateBusinessSettingsSchema = z.object({
  body: z.object({
    workingDays: z.array(z.string()).optional(),
    workStartTime: z.string().optional(),
    workEndTime: z.string().optional(),
    timezone: z.string().optional(),
    invoicePrefix: z.string().optional(),
    invoiceStartNumber: z.number().int().positive().optional(),
    quotePrefix: z.string().optional(),
    quoteStartNumber: z.number().int().positive().optional(),
    quoteValidityDays: z.number().int().positive().optional(),
    receiptPrefix: z.string().optional(),
    receiptStartNumber: z.number().int().positive().optional(),
    smtpHost: z.string().optional(),
    smtpPort: z.number().int().optional(),
    smtpUser: z.string().optional(),
    smtpPassword: z.string().optional(),
    smtpFromEmail: z.string().email().optional(),
    smtpFromName: z.string().optional(),
    smtpSecure: z.boolean().optional(),
  }),
});
export type UpdateBusinessSettingsInput = z.infer<typeof updateBusinessSettingsSchema>['body'];

// Onboarding status response type
export interface OnboardingStep {
  stepNumber: number;
  key: string;
  name: string;
  nameAr: string;
  description: string;
  isRequired: boolean;
  isComplete: boolean;
  canSkip: boolean;
  validationErrors: string[];
}

export interface OnboardingValidation {
  hasCompanyProfile: boolean;
  hasServiceType: boolean;
  hasArea: boolean;
  hasZone: boolean;
  hasEmployee: boolean;
  allRequirementsMet: boolean;
  missingItems: string[];
}

export interface OnboardingStatus {
  setupMode: 'none' | 'quick' | 'detailed';
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  isCompleted: boolean;
  minimumMet: boolean;
  steps: OnboardingStep[];
  validation: OnboardingValidation;
}

// Step definitions for Quick Setup (4 steps)
export const QUICK_STEPS: Omit<OnboardingStep, 'isComplete' | 'validationErrors'>[] = [
  {
    stepNumber: 1,
    key: 'company',
    name: 'Company Basics',
    nameAr: 'معلومات الشركة',
    description: 'Set up your company name, contact details, and currency',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 2,
    key: 'service-location',
    name: 'Service & Location',
    nameAr: 'الخدمة والموقع',
    description: 'Add at least one service type, area, and zone',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 3,
    key: 'employee',
    name: 'First Employee',
    nameAr: 'أول موظف',
    description: 'Add your first team member with system access',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 4,
    key: 'review',
    name: 'Review & Complete',
    nameAr: 'المراجعة والإكمال',
    description: 'Review your setup and activate your account',
    isRequired: true,
    canSkip: false,
  },
];

// Step definitions for Detailed Setup (7 steps)
export const DETAILED_STEPS: Omit<OnboardingStep, 'isComplete' | 'validationErrors'>[] = [
  {
    stepNumber: 1,
    key: 'company',
    name: 'Company Profile',
    nameAr: 'ملف الشركة',
    description: 'Complete company details including logo, VAT, and bank information',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 2,
    key: 'locations',
    name: 'Location Hierarchy',
    nameAr: 'هيكل المواقع',
    description: 'Set up countries, governorates, areas, and zones',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 3,
    key: 'services',
    name: 'Service Configuration',
    nameAr: 'إعداد الخدمات',
    description: 'Configure service types, priorities, and SLA settings',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 4,
    key: 'organization',
    name: 'Organization Structure',
    nameAr: 'الهيكل التنظيمي',
    description: 'Set up divisions, departments, and job titles',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 5,
    key: 'team',
    name: 'Team Setup',
    nameAr: 'إعداد الفريق',
    description: 'Add employees and assign them to zones',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 6,
    key: 'settings',
    name: 'Business Settings',
    nameAr: 'إعدادات العمل',
    description: 'Configure working hours and document numbering',
    isRequired: true,
    canSkip: false,
  },
  {
    stepNumber: 7,
    key: 'communication',
    name: 'Communication',
    nameAr: 'الاتصالات',
    description: 'Set up email notifications (optional)',
    isRequired: false,
    canSkip: true,
  },
];
