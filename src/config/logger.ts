import pino from 'pino';
import { config } from './index.js';

export const logger = pino({
  level: config.logLevel,
  transport: config.isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: {
    paths: ['password', 'token', 'authorization', 'creditCard', 'nationalId'],
    censor: '[REDACTED]',
  },
  base: {
    service: 'agentcare-api',
    version: process.env.npm_package_version,
    environment: config.nodeEnv,
  },
});
