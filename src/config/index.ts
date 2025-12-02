import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT - Secret must be set via environment variable
  jwt: {
    secret: process.env.JWT_SECRET || '',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),

  // File Upload
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10), // 10MB
    path: process.env.UPLOAD_PATH || './uploads',
  },

  // AI Service
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',

  // SMTP/Email
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@agentcare.com',
  },

  // Internal Service API Key (for service-to-service communication)
  // Must be set via environment variable - no hardcoded default
  internalApiKey: process.env.INTERNAL_API_KEY || '',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Check if we're in production
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
} as const;

// Validate required config in production
if (config.isProduction) {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'REDIS_URL', 'INTERNAL_API_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  // Validate JWT secret strength in production
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
}

// Warn in development if using empty secrets
if (config.isDevelopment) {
  if (!config.jwt.secret) {
    console.warn('⚠️  WARNING: JWT_SECRET not set. Please set it in .env file.');
  }
  if (!config.internalApiKey) {
    console.warn('⚠️  WARNING: INTERNAL_API_KEY not set. Please set it in .env file.');
  }
}
