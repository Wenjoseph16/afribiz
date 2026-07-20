import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from './auth';

// Events that MUST be logged (security-critical)
const MANDATORY_AUDIT_EVENTS = [
  'LOGIN',
  'LOGOUT',
  'SIGNUP',
  'FAILED_LOGIN',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'TWOFA_CHALLENGE',
  'FAILED_2FA',
  'TWOFA_VERIFIED',
  'TWOFA_SETUP',
  'TWOFA_DISABLE',
  'TOKEN_REUSE',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET',
  'EMAIL_VERIFICATION',
  'ROLE_ACTIVATION',
  'ADMIN_LOGIN',
  'ADMIN_ACTION',
  'ADMIN_SETTINGS_CHANGE',
  'ADMIN_FEATURE_FLAG_CHANGE',
  'ADMIN_ROLE_CHANGE',
  'ADMIN_USER_ACTION',
  'ADMIN_BUSINESS_ACTION',
  'ADMIN_MODULE_ACTION',
  'PAYMENT_RECEIVED',
  'PAYMENT_REFUNDED',
  'PAYOUT_PROCESSED',
  'KYC_SUBMITTED',
  'KYC_APPROVED',
  'KYC_REJECTED',
  'DEVICE_ADDED',
  'DEVICE_REMOVED',
  'SESSION_REVOKED',
];

// Routes that trigger security-relevant actions
const SECURITY_ROUTES = [
  { method: 'POST', path: '/api/auth/login', action: 'LOGIN' },
  { method: 'POST', path: '/api/auth/signup', action: 'SIGNUP' },
  { method: 'POST', path: '/api/auth/logout', action: 'LOGOUT' },
  { method: 'POST', path: '/api/auth/2fa/verify', action: 'TWOFA_VERIFIED' },
  { method: 'POST', path: '/api/auth/2fa/setup', action: 'TWOFA_SETUP' },
  { method: 'POST', path: '/api/auth/2fa/disable', action: 'TWOFA_DISABLE' },
  { method: 'POST', path: '/api/auth/reset-password', action: 'PASSWORD_RESET' },
  { method: 'POST', path: '/api/auth/change-password', action: 'PASSWORD_CHANGE' },
  { method: 'POST', path: '/api/auth/activate-business', action: 'ROLE_ACTIVATION' },
  { method: 'POST', path: '/api/auth/activate-developer', action: 'ROLE_ACTIVATION' },
];

function hashPII(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return crypto.createHash('sha256').update(value).digest('hex').slice(0, 16);
}

export function auditLogMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  const startTime = Date.now();

  res.json = function (body: unknown) {
    const routeKey = `${req.method} ${req.path}`;
    const matchedRoute = SECURITY_ROUTES.find(
      (r) => r.method === req.method && routeKey.endsWith(r.path)
    );
    const isSuccess = res.statusCode < 400;

    if (matchedRoute && req.user) {
      logAuditEvent({
        userId: req.user.id,
        action: matchedRoute.action,
        success: isSuccess,
        ipAddress: hashPII(req.ip),
        userAgent: hashPII(req.headers['user-agent']),
        metadata: {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration: Date.now() - startTime,
        },
      }).catch(() => {
        /* silent */
      });
    }

    return originalJson(body);
  };

  next();
}

async function logAuditEvent(data: {
  userId: string;
  action: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        userId: data.userId,
        action: data.action as any,
        success: data.success,
        ipAddress: hashPII(data.ipAddress),
        userAgent: hashPII(data.userAgent),
        reason: data.reason,
        metadata: (data.metadata || {}) as any,
      },
    });
  } catch {
    // Audit logging failure must never crash the app
  }
}

export { MANDATORY_AUDIT_EVENTS, logAuditEvent };
