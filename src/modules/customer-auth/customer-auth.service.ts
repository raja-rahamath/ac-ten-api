import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { UnauthorizedError, ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { emailService } from '../../services/email.service.js';
import {
  RegisterIndividualInput,
  RegisterCompanyInput,
  CustomerLoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
  RegisterPropertyInput,
} from './customer-auth.schema.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  customerId?: string;
}

export class CustomerAuthService {
  // Development email override for testing (set DEV_EMAIL_REDIRECT in .env to redirect, or leave empty to send to actual recipients)
  private devEmail = process.env.DEV_EMAIL_REDIRECT || '';

  private getEmailRecipient(email: string): string {
    // In development, redirect all emails to dev email only if DEV_EMAIL_REDIRECT is set
    if (config.isDevelopment && this.devEmail) {
      return this.devEmail;
    }
    return email;
  }

  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      config.jwt.secret,
      { expiresIn: config.jwt.accessExpiresIn } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    );

    return { accessToken, refreshToken };
  }

  private generateCustomerNo(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `CUST-${dateStr}-${randomSuffix}`;
  }

  async checkEmailAvailability(email: string): Promise<{ available: boolean; message: string }> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { available: false, message: 'Email already registered' };
    }

    return { available: true, message: 'Email is available' };
  }

  async registerIndividual(input: RegisterIndividualInput) {
    const { email, password, firstName, lastName, phone } = input;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get customer role
    const customerRole = await prisma.role.findFirst({
      where: { name: 'customer' },
    });

    // Generate customer number
    const customerNo = this.generateCustomerNo();

    // Create user and customer in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          roleId: customerRole?.id,
          isActive: true,
          isVerified: false,
          verificationToken,
          verificationTokenExpiry,
        },
        include: {
          role: true,
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          customerNo,
          customerType: 'INDIVIDUAL',
          firstName,
          lastName,
          email,
          phone,
          isActive: true,
          isVerified: false,
        },
      });

      return { user, customer };
    });

    // Send verification email
    await this.sendVerificationEmail(result.user.email, verificationToken, firstName);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
    };
  }

  async registerCompany(input: RegisterCompanyInput) {
    const { email, password, companyName, contactFirstName, contactLastName, contactPhone } = input;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = this.generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get customer role
    const customerRole = await prisma.role.findFirst({
      where: { name: 'customer' },
    });

    // Generate customer number
    const customerNo = this.generateCustomerNo();

    // Create user and customer in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: contactFirstName,
          lastName: contactLastName,
          phone: contactPhone,
          roleId: customerRole?.id,
          isActive: true,
          isVerified: false,
          verificationToken,
          verificationTokenExpiry,
        },
        include: {
          role: true,
        },
      });

      const customer = await tx.customer.create({
        data: {
          userId: user.id,
          customerNo,
          customerType: 'ORGANIZATION',
          orgName: companyName,
          firstName: contactFirstName,
          lastName: contactLastName,
          email,
          phone: contactPhone,
          isActive: true,
          isVerified: false,
        },
      });

      return { user, customer };
    });

    // Send verification email
    await this.sendVerificationEmail(result.user.email, verificationToken, contactFirstName);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: result.user.id,
        email: result.user.email,
        companyName,
        contactName: `${contactFirstName} ${contactLastName}`,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    // Update user and customer
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });

      await tx.customer.updateMany({
        where: { userId: user.id },
        data: {
          isVerified: true,
        },
      });
    });

    return {
      message: 'Email verified successfully. You can now login.',
    };
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { customer: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestError('Email already verified');
    }

    // Generate new verification token
    const verificationToken = this.generateVerificationToken();
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    });

    // Send verification email
    await this.sendVerificationEmail(email, verificationToken, user.firstName);

    return {
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  async login(input: CustomerLoginInput) {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        customer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is a customer
    if (!user.customer) {
      throw new UnauthorizedError('Access denied. Please use the staff login.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account is disabled');
    }

    if (!user.isVerified) {
      throw new UnauthorizedError('Please verify your email before logging in');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: 'customer',
      customerId: user.customer.id,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        customer: {
          id: user.customer.id,
          customerNo: user.customer.customerNo,
          customerType: user.customer.customerType,
          companyName: user.customer.orgName,
        },
      },
    };
  }

  async forgotPassword(input: ForgotPasswordInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { customer: true },
    });

    // Don't reveal if user exists
    if (!user || !user.customer) {
      return {
        message: 'If the email exists, a password reset link will be sent.',
      };
    }

    // Generate reset token
    const resetToken = this.generateVerificationToken();
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetTokenExpiry: resetTokenExpiry,
      },
    });

    // Send password reset email
    await this.sendPasswordResetEmail(user.email, resetToken, user.firstName);

    return {
      message: 'If the email exists, a password reset link will be sent.',
    };
  }

  async resetPassword(input: ResetPasswordInput) {
    const { token, password } = input;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    });

    return {
      message: 'Password reset successfully. You can now login with your new password.',
    };
  }

  async refreshToken(input: RefreshTokenInput) {
    const { refreshToken } = input;

    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as TokenPayload & { type: string };

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { role: true, customer: true },
      });

      if (!user || !user.isActive || !user.customer) {
        throw new UnauthorizedError('User not found or inactive');
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: 'customer',
        customerId: user.customer.id,
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customer: {
          include: {
            properties: {
              where: { status: 'ACTIVE' },
              include: {
                property: {
                  include: {
                    type: true,
                    areaRef: {
                      include: {
                        governorate: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.customer) {
      throw new NotFoundError('Customer not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isVerified: user.isVerified,
      customer: {
        id: user.customer.id,
        customerNo: user.customer.customerNo,
        customerType: user.customer.customerType,
        companyName: user.customer.orgName,
        properties: user.customer.properties.map(cp => ({
          id: cp.property.id,
          propertyNo: cp.property.propertyNo,
          name: cp.property.name,
          address: cp.property.address,
          building: cp.property.building,
          floor: cp.property.floor,
          unit: cp.property.unit,
          area: cp.property.areaRef?.name,
          governorate: cp.property.areaRef?.governorate?.name,
          propertyType: cp.property.type?.name,
          ownershipType: cp.ownershipType,
          isPrimary: cp.isPrimary,
        })),
      },
    };
  }

  // Property registration methods
  async registerProperty(userId: string, input: RegisterPropertyInput) {
    // Get customer for this user
    const customer = await prisma.customer.findFirst({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Parse property details
    let flat: string, building: string, road: string, block: string, areaName: string;

    if (input.propertyAddress) {
      // Parse combined format: Flat-Building-Road-Block-Area
      const parts = input.propertyAddress.split('-');
      if (parts.length < 5) {
        throw new BadRequestError('Invalid property address format. Expected: Flat-Building-Road-Block-Area (e.g., 1-1458-3435-334-Mahooz)');
      }
      flat = parts[0];
      building = parts[1];
      road = parts[2];
      block = parts[3];
      areaName = parts.slice(4).join('-'); // Join remaining parts in case area has dashes
    } else {
      flat = input.flat!;
      building = input.building!;
      road = input.road!;
      block = input.block!;
      areaName = input.areaName!;
    }

    // Pad numbers with leading zeros
    const paddedFlat = flat.padStart(4, '0');
    const paddedBuilding = building.padStart(5, '0');
    const paddedRoad = road.padStart(4, '0');
    const paddedBlock = block.padStart(4, '0');

    // Find area with fuzzy matching
    const area = await this.findAreaByName(areaName);
    if (!area) {
      throw new BadRequestError(`Area "${areaName}" not found. Please check the spelling or contact support.`);
    }

    // Generate property number
    const propertyNo = `${paddedFlat}-${paddedBuilding}-${paddedRoad}-${paddedBlock}`;

    // Check if property already exists
    let property = await prisma.property.findUnique({
      where: { propertyNo },
    });

    // Get default property type (Apartment) if not provided
    let propertyTypeId = input.propertyTypeId;
    if (!propertyTypeId) {
      const defaultType = await prisma.propertyType.findFirst({
        where: { name: 'Apartment' },
      });
      propertyTypeId = defaultType?.id;
    }

    if (!propertyTypeId) {
      throw new BadRequestError('Property type not found');
    }

    // Create or use existing property
    if (!property) {
      property = await prisma.property.create({
        data: {
          propertyNo,
          name: `Unit ${paddedFlat}, Building ${paddedBuilding}`,
          typeId: propertyTypeId,
          areaId: area.id,
          building: paddedBuilding,
          floor: '', // Can be derived from flat number if needed
          unit: paddedFlat,
          areaName: area.name,
          address: `Flat ${flat}, Building ${building}, Road ${road}, Block ${block}, ${area.name}`,
          isActive: true,
          createdById: userId,
        },
        include: {
          type: true,
          areaRef: {
            include: {
              governorate: true,
            },
          },
        },
      });
    }

    // Check if customer already has this property linked
    const existingLink = await prisma.customerProperty.findFirst({
      where: {
        customerId: customer.id,
        propertyId: property.id,
        status: 'ACTIVE',
      },
    });

    if (existingLink) {
      throw new ConflictError('You already have this property registered');
    }

    // If setting as primary, unset other primary properties for this customer
    if (input.isPrimary) {
      await prisma.customerProperty.updateMany({
        where: {
          customerId: customer.id,
          status: 'ACTIVE',
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    // Check if this is the first property - auto set as primary
    const existingProperties = await prisma.customerProperty.count({
      where: {
        customerId: customer.id,
        status: 'ACTIVE',
      },
    });

    const shouldBePrimary = input.isPrimary || existingProperties === 0;

    // Create customer-property link
    const customerProperty = await prisma.customerProperty.create({
      data: {
        customerId: customer.id,
        propertyId: property.id,
        ownershipType: input.ownershipType || 'TENANT',
        status: 'ACTIVE',
        isPrimary: shouldBePrimary,
        startDate: new Date(),
        createdById: userId,
      },
    });

    // Fetch property with relations for response
    const propertyWithRelations = await prisma.property.findUnique({
      where: { id: property.id },
      include: {
        type: true,
        areaRef: {
          include: {
            governorate: true,
          },
        },
      },
    });

    return {
      message: 'Property registered successfully',
      property: {
        id: property.id,
        propertyNo: property.propertyNo,
        name: property.name,
        address: property.address,
        building: property.building,
        unit: property.unit,
        area: propertyWithRelations?.areaRef?.name || area.name,
        governorate: propertyWithRelations?.areaRef?.governorate?.name || area.governorate?.name,
        propertyType: propertyWithRelations?.type?.name,
        ownershipType: customerProperty.ownershipType,
        isPrimary: customerProperty.isPrimary,
      },
    };
  }

  async getCustomerProperties(userId: string, status?: string) {
    const customer = await prisma.customer.findFirst({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const where: any = { customerId: customer.id };
    if (status) {
      where.status = status;
    } else {
      where.status = 'ACTIVE';
    }

    const customerProperties = await prisma.customerProperty.findMany({
      where,
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      include: {
        property: {
          include: {
            type: true,
            areaRef: {
              include: {
                governorate: true,
              },
            },
          },
        },
      },
    });

    return customerProperties.map(cp => ({
      id: cp.property.id,
      customerPropertyId: cp.id,
      propertyNo: cp.property.propertyNo,
      name: cp.property.name,
      address: cp.property.address,
      building: cp.property.building,
      floor: cp.property.floor,
      unit: cp.property.unit,
      area: cp.property.areaRef?.name,
      governorate: cp.property.areaRef?.governorate?.name,
      propertyType: cp.property.type?.name,
      ownershipType: cp.ownershipType,
      isPrimary: cp.isPrimary,
      status: cp.status,
    }));
  }

  async setPrimaryProperty(userId: string, propertyId: string) {
    const customer = await prisma.customer.findFirst({
      where: { userId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Find the customer property link
    const customerProperty = await prisma.customerProperty.findFirst({
      where: {
        customerId: customer.id,
        propertyId,
        status: 'ACTIVE',
      },
    });

    if (!customerProperty) {
      throw new NotFoundError('Property not found or not linked to your account');
    }

    // Unset other primary properties
    await prisma.customerProperty.updateMany({
      where: {
        customerId: customer.id,
        status: 'ACTIVE',
        isPrimary: true,
        id: { not: customerProperty.id },
      },
      data: { isPrimary: false },
    });

    // Set this property as primary
    await prisma.customerProperty.update({
      where: { id: customerProperty.id },
      data: { isPrimary: true },
    });

    return { message: 'Property set as primary successfully' };
  }

  async listAreas(search?: string) {
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { aliases: { has: search } },
      ];
    }

    const areas = await prisma.area.findMany({
      where,
      // Return all areas - Bahrain has ~60 areas, no need to limit
      orderBy: { name: 'asc' },
      include: {
        governorate: {
          select: {
            id: true,
            name: true,
            nameAr: true,
          },
        },
      },
    });

    return areas.map(area => ({
      id: area.id,
      name: area.name,
      nameAr: area.nameAr,
      governorate: area.governorate?.name,
      governorateAr: area.governorate?.nameAr,
    }));
  }

  private async findAreaByName(areaName: string) {
    // First try exact match (case insensitive)
    let area = await prisma.area.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { equals: areaName, mode: 'insensitive' } },
          { nameAr: { equals: areaName, mode: 'insensitive' } },
        ],
      },
      include: {
        governorate: true,
      },
    });

    if (area) return area;

    // Try aliases (exact match in array)
    area = await prisma.area.findFirst({
      where: {
        isActive: true,
        aliases: { has: areaName },
      },
      include: {
        governorate: true,
      },
    });

    if (area) return area;

    // Try case-insensitive partial match
    area = await prisma.area.findFirst({
      where: {
        isActive: true,
        OR: [
          { name: { contains: areaName, mode: 'insensitive' } },
          { nameAr: { contains: areaName, mode: 'insensitive' } },
        ],
      },
      include: {
        governorate: true,
      },
    });

    return area;
  }

  // Email sending methods
  private async sendVerificationEmail(email: string, token: string, firstName: string) {
    const recipientEmail = this.getEmailRecipient(email);
    // Use PUBLIC_API_URL env var, fallback to localhost for dev or Hetzner server for production
    const apiBaseUrl = process.env.PUBLIC_API_URL || (config.isDevelopment ? 'http://localhost:4001' : 'http://116.203.196.139:4001');
    const verificationUrl = `${apiBaseUrl}/api/v1/customer/auth/verify?token=${token}`;

    const html = this.getVerificationEmailTemplate(firstName, verificationUrl, email);
    const text = `
Hello ${firstName},

Thank you for registering with AgentCare!

Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with AgentCare, please ignore this email.

Best regards,
The AgentCare Team
    `.trim();

    await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Verify Your AgentCare Account',
      html,
      text,
    });
  }

  private async sendPasswordResetEmail(email: string, token: string, firstName: string) {
    const recipientEmail = this.getEmailRecipient(email);
    // Use PUBLIC_PORTAL_URL env var, fallback to localhost for dev or Hetzner server for production
    const portalBaseUrl = process.env.PUBLIC_PORTAL_URL || (config.isDevelopment ? 'http://localhost:3001' : 'http://116.203.196.139:3001');
    const resetUrl = `${portalBaseUrl}/reset-password?token=${token}`;

    const html = this.getPasswordResetEmailTemplate(firstName, resetUrl, email);
    const text = `
Hello ${firstName},

We received a request to reset your password for your AgentCare account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

Best regards,
The AgentCare Team
    `.trim();

    await emailService.sendEmail({
      to: recipientEmail,
      subject: 'Reset Your AgentCare Password',
      html,
      text,
    });
  }

  private getVerificationEmailTemplate(firstName: string, verificationUrl: string, originalEmail: string): string {
    const devNote = config.isDevelopment
      ? `<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
          <strong>Development Mode:</strong> Original recipient: ${originalEmail}
        </div>`
      : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Welcome to AgentCare!</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${devNote}
              <p style="margin: 0 0 20px; font-size: 16px; color: #334155; line-height: 1.6;">
                Hello <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; color: #334155; line-height: 1.6;">
                Thank you for registering with AgentCare! To complete your registration and start using our services, please verify your email address by clicking the button below.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(14, 165, 233, 0.3);">
                  Verify Email Address
                </a>
              </div>

              <p style="margin: 24px 0 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                This verification link will expire in 24 hours. If you didn't create an account with AgentCare, you can safely ignore this email.
              </p>

              <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8; word-break: break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #0ea5e9;">${verificationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated message from AgentCare. Please do not reply to this email.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} AgentCare. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getPasswordResetEmailTemplate(firstName: string, resetUrl: string, originalEmail: string): string {
    const devNote = config.isDevelopment
      ? `<div style="background-color: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 13px;">
          <strong>Development Mode:</strong> Original recipient: ${originalEmail}
        </div>`
      : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Reset Your Password</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${devNote}
              <p style="margin: 0 0 20px; font-size: 16px; color: #334155; line-height: 1.6;">
                Hello <strong>${firstName}</strong>,
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; color: #334155; line-height: 1.6;">
                We received a request to reset your password for your AgentCare account. Click the button below to set a new password.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.3);">
                  Reset Password
                </a>
              </div>

              <p style="margin: 24px 0 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>

              <p style="margin: 16px 0 0; font-size: 13px; color: #94a3b8; word-break: break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #f97316;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center; background-color: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                This is an automated message from AgentCare. Please do not reply to this email.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} AgentCare. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  async createServiceRequest(userId: string, input: {
    propertyId: string;
    category?: string;
    serviceType?: string;
    title: string;
    description: string;
    priority?: string;
  }) {
    // Get customer from user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user?.customer) {
      throw new BadRequestError('Customer not found for this user');
    }

    // Verify property belongs to customer
    const customerProperty = await prisma.customerProperty.findFirst({
      where: {
        customerId: user.customer.id,
        propertyId: input.propertyId,
        status: 'ACTIVE',
      },
      include: {
        property: true,
      },
    });

    if (!customerProperty) {
      throw new BadRequestError('Property not found or does not belong to customer');
    }

    // Map category to complaint type
    const CATEGORY_TO_COMPLAINT_TYPE: Record<string, string> = {
      'electrical': 'Electrical',
      'plumbing': 'Plumbing',
      'hvac': 'AC Maintenance',
      'ac_hvac': 'AC Maintenance',
      'pest_control': 'Pest Control',
      'general_maintenance': 'General Maintenance',
      'appliance': 'General Maintenance',
      'cleaning': 'Cleaning',
      'general': 'General Maintenance',
    };

    const category = input.category || input.serviceType || 'general';
    const categoryName = CATEGORY_TO_COMPLAINT_TYPE[category.toLowerCase()] || category;

    // Look up complaint type
    let complaintType = await prisma.complaintType.findFirst({
      where: {
        name: {
          equals: categoryName,
          mode: 'insensitive',
        },
      },
    });

    if (!complaintType) {
      complaintType = await prisma.complaintType.findFirst();
    }

    if (!complaintType) {
      throw new BadRequestError('No complaint types available. Please contact support.');
    }

    // Get zone from area
    let zoneId: string | null = null;
    const areaId = customerProperty.property?.areaId;

    if (areaId) {
      const zoneArea = await prisma.zoneArea.findFirst({
        where: { areaId, isActive: true },
        include: { zone: { select: { id: true } } },
      });
      if (zoneArea?.zone) {
        zoneId = zoneArea.zone.id;
      }
    }

    if (!zoneId) {
      throw new BadRequestError('Zone is required. Please contact support.');
    }

    // Generate request number
    const requests = await prisma.$queryRaw<{ request_no: string }[]>`
      SELECT request_no
      FROM fixitbh_ac.service_requests
      WHERE request_no ~ '^SR-[0-9]+$'
      ORDER BY CAST(SUBSTRING(request_no FROM 4) AS INTEGER) DESC
      LIMIT 1
    `;

    let nextNumber = 1;
    if (requests.length > 0 && requests[0].request_no) {
      const match = requests[0].request_no.match(/SR-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const requestNo = `SR-${nextNumber.toString().padStart(5, '0')}`;

    // Normalize priority - Prisma enum: LOW, MEDIUM, HIGH, EMERGENCY
    const priorityMap: Record<string, string> = {
      'low': 'LOW',
      'normal': 'MEDIUM',
      'medium': 'MEDIUM',
      'high': 'HIGH',
      'urgent': 'EMERGENCY',
      'emergency': 'EMERGENCY',
    };
    const priority = priorityMap[(input.priority || 'normal').toLowerCase()] || 'MEDIUM';

    // Create the service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        requestNo,
        title: input.title,
        description: input.description,
        status: 'NEW',
        priority: priority as any,
        customerId: user.customer.id,
        propertyId: input.propertyId,
        customerPropertyId: customerProperty.id,
        complaintTypeId: complaintType.id,
        zoneId,
        source: 'AI_CHAT',
      },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        property: { select: { id: true, name: true, building: true, areaName: true } },
        complaintType: { select: { name: true } },
      },
    });

    return {
      id: serviceRequest.id,
      requestNo: serviceRequest.requestNo,
      requestNumber: serviceRequest.requestNo, // Legacy field
      title: serviceRequest.title,
      description: serviceRequest.description,
      status: serviceRequest.status,
      priority: serviceRequest.priority,
      category: serviceRequest.complaintType?.name,
      createdAt: serviceRequest.createdAt,
    };
  }

  // Icon mapping for service types
  private readonly SERVICE_TYPE_ICONS: Record<string, { icon: string; color: string }> = {
    'AC Maintenance': { icon: 'snow', color: '#06b6d4' },
    'Plumbing': { icon: 'water', color: '#3b82f6' },
    'Electrical': { icon: 'flash', color: '#f59e0b' },
    'Cleaning': { icon: 'sparkles', color: '#10b981' },
    'Carpentry': { icon: 'hammer', color: '#8b5cf6' },
    'Painting': { icon: 'color-palette', color: '#ec4899' },
    'Appliance Repair': { icon: 'tv', color: '#8b5cf6' },
    'General Maintenance': { icon: 'construct', color: '#64748b' },
    'Pest Control': { icon: 'bug', color: '#ef4444' },
  };

  async getServiceTypes() {
    const complaintTypes = await prisma.complaintType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nameAr: true,
        description: true,
      },
    });

    return complaintTypes.map(ct => {
      const iconConfig = this.SERVICE_TYPE_ICONS[ct.name] || { icon: 'construct', color: '#64748b' };
      return {
        id: ct.id,
        name: ct.name,
        nameAr: ct.nameAr,
        description: ct.description,
        icon: iconConfig.icon,
        color: iconConfig.color,
      };
    });
  }

  async getCustomerServiceRequests(userId: string, filter?: { status?: string }) {
    // Get customer from user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user?.customer) {
      throw new BadRequestError('Customer not found for this user');
    }

    const where: any = { customerId: user.customer.id };
    if (filter?.status) {
      where.status = filter.status;
    }

    const serviceRequests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        complaintType: { select: { name: true, nameAr: true } },
        property: { select: { id: true, name: true, building: true, areaName: true } },
        customerProperty: {
          select: {
            id: true,
            ownershipType: true,
            property: {
              select: {
                id: true,
                name: true,
                building: true,
                areaName: true,
              },
            },
          },
        },
        assignedTo: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    return {
      data: serviceRequests.map(sr => ({
        id: sr.id,
        requestNo: sr.requestNo,
        title: sr.title,
        description: sr.description,
        status: sr.status,
        priority: sr.priority,
        complaintType: sr.complaintType,
        property: sr.property || sr.customerProperty?.property,
        customerProperty: sr.customerProperty,
        assignedTo: sr.assignedTo,
        createdAt: sr.createdAt,
        startedAt: sr.startedAt,
        completedAt: sr.completedAt,
      })),
      pagination: {
        page: 1,
        limit: 100,
        total: serviceRequests.length,
        totalPages: 1,
      },
    };
  }

  async getCustomerServiceRequestById(userId: string, requestId: string) {
    // Get customer from user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user?.customer) {
      throw new BadRequestError('Customer not found for this user');
    }

    const serviceRequest = await prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        customerId: user.customer.id,
      },
      include: {
        complaintType: { select: { name: true, nameAr: true } },
        property: { select: { id: true, name: true, flat: true, building: true, road: true, block: true, areaName: true } },
        customerProperty: {
          select: {
            id: true,
            ownershipType: true,
            property: {
              select: {
                id: true,
                name: true,
                flat: true,
                building: true,
                road: true,
                block: true,
                areaName: true,
              },
            },
          },
        },
        assignedTo: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    if (!serviceRequest) {
      throw new NotFoundError('Service request not found');
    }

    // Build property address
    const prop = serviceRequest.property || serviceRequest.customerProperty?.property;
    let propertyAddress = 'No address specified';
    if (prop) {
      const parts = [];
      if (prop.flat) parts.push(`Flat ${prop.flat}`);
      if (prop.building) parts.push(`Building ${prop.building}`);
      if (prop.road) parts.push(`Road ${prop.road}`);
      if (prop.block) parts.push(`Block ${prop.block}`);
      if (prop.areaName) parts.push(prop.areaName);
      propertyAddress = parts.join(', ') || prop.name || 'No address specified';
    }

    return {
      id: serviceRequest.id,
      requestNo: serviceRequest.requestNo,
      title: serviceRequest.title,
      description: serviceRequest.description,
      status: serviceRequest.status,
      priority: serviceRequest.priority,
      complaintType: serviceRequest.complaintType,
      property: prop,
      propertyAddress,
      customerProperty: serviceRequest.customerProperty,
      assignedTo: serviceRequest.assignedTo,
      createdAt: serviceRequest.createdAt,
      startedAt: serviceRequest.startedAt,
      completedAt: serviceRequest.completedAt,
    };
  }
}
