import './loadEnv';

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-min-32-chars',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Frontend Configuration
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Email Configuration (Using Mailtrap for development)
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '2525', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'noreply@afribiz.com',
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME || 'AfriBiz',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Auth Rate Limiting
  AUTH_RATE_LIMIT_WINDOW_MS: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  AUTH_RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Login Security
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
  ACCOUNT_LOCK_TIME_MS: parseInt(process.env.ACCOUNT_LOCK_TIME_MS || '900000', 10), // 15 minutes

  // OTP Configuration
  OTP_LENGTH: parseInt(process.env.OTP_LENGTH || '6', 10),
  OTP_EXPIRES_IN_MINUTES: parseInt(process.env.OTP_EXPIRES_IN_MINUTES || '10', 10),
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS || '3', 10),

  // Email Verification
  EMAIL_VERIFICATION_EXPIRES_IN_HOURS: parseInt(
    process.env.EMAIL_VERIFICATION_EXPIRES_IN_HOURS || '24',
    10
  ),
  PASSWORD_RESET_EXPIRES_IN_HOURS: parseInt(process.env.PASSWORD_RESET_EXPIRES_IN_HOURS || '1', 10),

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',

  // Bcrypt Configuration
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // Encryption Key
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // FedaPay
  FEDAPAY_SECRET_KEY: process.env.FEDAPAY_SECRET_KEY || '',
  FEDAPAY_WEBHOOK_SECRET: process.env.FEDAPAY_WEBHOOK_SECRET || '',

  // Sentry
  SENTRY_DSN: process.env.SENTRY_DSN || '',

  // Redis
  REDIS_URL: process.env.REDIS_URL || '',

  // Social
  FACEBOOK_API_VERSION: process.env.FACEBOOK_API_VERSION || 'v18.0',

  // ⚠️ DEV SECURITY FLAG — JAMAIS définir en production
  // DEV_BYPASS_2FA_CODE : si défini (ex. "123456"), CE code unique (et lui seul) permet
  //   de passer la 2FA en développement. S'il est vide, aucun bypass n'existe.
  //   Ne plus jamais activer un bypass implicite via NODE_ENV (porte dérobée).
  DEV_BYPASS_2FA_CODE: process.env.DEV_BYPASS_2FA_CODE || '',
};
