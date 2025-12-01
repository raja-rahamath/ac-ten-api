import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { UnauthorizedError, ConflictError } from '../../utils/errors.js';
import { LoginInput, RegisterInput, RefreshTokenInput } from './auth.schema.js';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  async login(input: LoginInput) {
    const { email, password } = input;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role?.name || 'user',
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
      },
    };
  }

  async register(input: RegisterInput) {
    const { email, password, firstName, lastName, phone } = input;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Get default role
    const defaultRole = await prisma.role.findFirst({
      where: { name: 'customer' },
    });

    // Generate customer number (CUST-YYYYMMDD-XXXX format)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const customerCount = await prisma.customer.count();
    const customerNo = `CUST-${dateStr}-${String(customerCount + 1).padStart(4, '0')}`;

    // Create user and customer in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          roleId: defaultRole?.id,
          isActive: true,
        },
        include: {
          role: true,
        },
      });

      // Create customer record linked to user
      await tx.customer.create({
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

      return user;
    });

    const tokens = this.generateTokens({
      userId: result.id,
      email: result.email,
      role: result.role?.name || 'user',
    });

    return {
      ...tokens,
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role?.name,
      },
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
        include: { role: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      return this.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role?.name || 'user',
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        employee: {
          include: {
            company: true,
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role?.name,
      isActive: user.isActive,
      isVerified: user.isVerified,
      employee: user.employee ? {
        id: user.employee.id,
        employeeNo: user.employee.employeeNo,
        company: user.employee.company?.name,
        department: user.employee.department?.name,
      } : null,
    };
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
}
