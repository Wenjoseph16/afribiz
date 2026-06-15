import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const NODE_ENV = process.env.NODE_ENV || 'development';

function requireSecret(name: string): string {
  const value = process.env[name];
  if (value) return value;
  if (NODE_ENV === 'production') {
    throw new Error(`❌ Variable d'environnement ${name} manquante. Le serveur ne peut pas démarrer en production sans cette clé.`);
  }
  const generated = crypto.randomBytes(32).toString('hex');
  console.warn(`⚠️  ${name} non défini. Clé aléatoire générée pour le développement. Les sessions seront perdues au redémarrage.`);
  return generated;
}

export const config = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT Configuration — MUST be set in production
  JWT_SECRET: requireSecret('JWT_SECRET'),
  JWT_REFRESH_SECRET: requireSecret('JWT_REFRESH_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Email Configuration
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '2525', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@afribiz.com',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'AfriBiz',

  // Redis Cache
  REDIS_URL: process.env.REDIS_URL || '',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Auth Rate Limiting
  AUTH_RATE_LIMIT_WINDOW_MS: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '5', 10),

  // Login Security
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  ACCOUNT_LOCK_TIME_MS: parseInt(process.env.ACCOUNT_LOCK_TIME_MS || '900000', 10),

  // OTP Configuration
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH || '6', 10),
  OTP_EXPIRES_IN_MINUTES: parseInt(process.env.OTP_EXPIRES_IN_MINUTES || '10', 10),
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),

  // Email Verification
  EMAIL_VERIFICATION_EXPIRES_IN_HOURS: parseInt(process.env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS || '24', 10),
  PASSWORD_RESET_EXPIRES_IN_HOURS: parseInt(process.env.PASSWORD_RESET_EXPIRES_IN_HOURS || '1', 10),

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',

  // Stripe Configuration
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',

  // Bcrypt Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // Sentry
  SENTRY_DSN: process.env.SENTRY_DSN || '',
};
