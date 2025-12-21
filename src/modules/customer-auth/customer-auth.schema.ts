import { z } from 'zod';

// Individual customer registration schema
export const registerIndividualSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    phone: z.string().min(8, 'Phone number is required'),
  }),
});

// Company customer registration schema
export const registerCompanySchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    contactFirstName: z.string().min(1, 'Contact first name is required'),
    contactLastName: z.string().min(1, 'Contact last name is required'),
    contactPhone: z.string().min(8, 'Contact phone number is required'),
  }),
});

// Customer login schema
export const customerLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

// Email verification schema
export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),
});

// Resend verification email schema
export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

// Password reset request schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

// Password reset schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

// Property registration schema - supports both combined format and individual fields
export const registerPropertySchema = z.object({
  body: z.object({
    // Option 1: Combined format like "1-1458-3435-334-Mahooz"
    propertyAddress: z.string().optional(),
    // Option 2: Individual fields
    flat: z.string().optional(), // Optional - villas don't have flat numbers
    building: z.string().optional(),
    road: z.string().optional(),
    block: z.string().optional(),
    areaName: z.string().optional(),
    // Common fields
    propertyTypeId: z.string().optional(), // Default to 'Apartment' if not provided
    isPrimary: z.boolean().optional().default(false),
    ownershipType: z.enum(['OWNER', 'TENANT', 'PROPERTY_MANAGER', 'AUTHORIZED_CONTACT']).optional().default('TENANT'),
  }).refine(
    (data) => {
      // Either propertyAddress OR required individual fields must be provided
      // Note: flat is optional (villas don't have flat numbers)
      const hasAddress = !!data.propertyAddress;
      const hasRequiredFields = !!(data.building && data.road && data.block && data.areaName);
      return hasAddress || hasRequiredFields;
    },
    {
      message: 'Either propertyAddress (format: Flat-Building-Road-Block-Area) or required fields (building, road, block, areaName) are required. Flat is optional.',
    }
  ),
});

// Get customer properties schema
export const getCustomerPropertiesSchema = z.object({
  query: z.object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED']).optional(),
  }).optional(),
});

// Set primary property schema
export const setPrimaryPropertySchema = z.object({
  params: z.object({
    propertyId: z.string().min(1, 'Property ID is required'),
  }),
});

// List areas schema (for autocomplete)
export const listAreasSchema = z.object({
  query: z.object({
    search: z.string().optional(),
  }).optional(),
});

// Type exports
export type RegisterIndividualInput = z.infer<typeof registerIndividualSchema>['body'];
export type RegisterCompanyInput = z.infer<typeof registerCompanySchema>['body'];
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['query'];
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type RegisterPropertyInput = z.infer<typeof registerPropertySchema>['body'];
export type GetCustomerPropertiesQuery = z.infer<typeof getCustomerPropertiesSchema>['query'];
export type SetPrimaryPropertyParams = z.infer<typeof setPrimaryPropertySchema>['params'];
export type ListAreasQuery = z.infer<typeof listAreasSchema>['query'];
