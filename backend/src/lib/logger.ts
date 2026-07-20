import winston from 'winston';
import { config } from '../config/env';

// PII fields to mask in logs
const PII_FIELDS = new Set([
  'password',
  'passwordHash',
  'token',
  'secret',
  'accessToken',
  'refreshToken',
  'twoFactorSecret',
  'twoFactorBackupCodes',
  'creditCard',
  'cvv',
  'pin',
  'taxId',
  'businessRegistration',
  'identityDocument',
  'companyDocument',
  'responsiblePhoto',
  'facePhoto',
  'missionLetter',
]);

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // email
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}[-.\s]?\d{2,4}\b/g, // phone
  /\b(?:\d[ -]*?){13,16}\b/g, // credit card
];

function maskPII(obj: unknown, depth = 0): unknown {
  if (depth > 5) return obj;
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => maskPII(item, depth + 1));
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (PII_FIELDS.has(key)) {
      masked[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      let maskedValue = value;
      for (const pattern of PII_PATTERNS) {
        maskedValue = maskedValue.replace(pattern, (match) => {
          if (match.includes('@')) {
            const [name, domain] = match.split('@');
            return `${name[0]}***@${domain}`;
          }
          return match.slice(0, 3) + '***' + match.slice(-2);
        });
      }
      masked[key] = maskedValue;
    } else {
      masked[key] = maskPII(value, depth + 1);
    }
  }
  return masked;
}

const isVercel = !!process.env.VERCEL;

const transports: winston.transport[] = [];

if (isVercel) {
  transports.push(new winston.transports.Console({ format: winston.format.json() }));
} else {
  transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
  if (config.NODE_ENV !== 'production') {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, correlationId, ...meta }) => {
            const cid = correlationId ? ` [${correlationId}]` : '';
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(maskPII(meta))}` : '';
            return `${level}:${cid} ${message}${metaStr}`;
          })
        ),
      })
    );
  }
}

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    winston.format((info) => maskPII(info) as winston.Logform.TransformableInfo)()
  ),
  defaultMeta: { service: 'afribiz-api' },
  transports,
});

export { maskPII };
