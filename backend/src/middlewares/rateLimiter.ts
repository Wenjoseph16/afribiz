import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Pass-through en dev/test.
 * Les grandes plateformes (Stripe, Shopify, Supabase) n'appliquent
 * pas de rate limit sur le login en dev — ça casse les tests E2E.
 */
function passThrough(_req: Request, _res: Response, next: NextFunction) {
  next();
}

// ============================================
// Rate Limiters centralisés par groupe de routes
// Chaque limiteur est IP-based (comportement par défaut d'express-rate-limit)
// ============================================

/**
 * Authentification — login, signup, forgot-password, reset-password
 *
 * STRATÉGIE (niveau Stripe/Supabase) :
 *   • DEV/Test : aucune restriction (pas de blocage des tests E2E)
 *   • PROD : 500 req / heure / IP (suffisant pour usage normal,
 *             bloque le brute-force massif)
 *   • Le vrai protection est le Account Lockout (failedLoginAttempts)
 *      + CAPTCHA front-end, pas le rate limit IP.
 */
export const authLimiter = isDev
  ? passThrough
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '500', 10),
      message: { success: false, error: 'Trop de tentatives. Réessayez plus tard.' },
      standardHeaders: true,
      legacyHeaders: false,
    });

/**
 * Renvoi d'email/OTP — 3 req / 1 heure
 * Endpoints: resend-verification, resend-otp
 */
export const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, error: 'Trop de tentatives. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API standard — 300 req / 15 min (20 req/min)
 * Endpoints: toutes les routes d'API protégées (business, orders, stories, shorts, etc.)
 * Dashboard React Query fait du polling régulier, ne pas bloquer les appels légitimes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT_MAX || '300', 10),
  message: { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * API sensible — 60 req / 15 min
 * Endpoints: finance, public, uploads
 */
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.SENSITIVE_RATE_LIMIT_MAX || '60', 10),
  message: { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin — 300 req / 15 min
 * Endpoints: routes admin (dashboard, gestion utilisateurs, etc.)
 */
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.ADMIN_RATE_LIMIT_MAX || '300', 10),
  message: { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP Verification — 5 req / 1 min (strict pour éviter brute-force)
 * Endpoint: verify-otp
 */
export const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, error: 'Trop de tentatives OTP. Réessayez dans une minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict — 20 req / 15 min
 * Endpoints: paiements, escrow, actions sensibles
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================
// Adaptive rate limiting by user role
// ============================================

interface RoleRateLimitConfig {
  [role: string]: {
    windowMs: number;
    max: number;
  };
}

const ROLE_LIMITS: RoleRateLimitConfig = {
  ADMIN: { windowMs: 15 * 60 * 1000, max: 500 },
  BUSINESS: { windowMs: 15 * 60 * 1000, max: 300 },
  DEVELOPER: { windowMs: 15 * 60 * 1000, max: 200 },
  CLIENT: { windowMs: 15 * 60 * 1000, max: 100 },
};

/**
 * Adaptive rate limiter — adjusts limits based on user role
 * Admin > Business > Developer > Client
 */
export const roleBasedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    const user = (req as any).user;
    if (!user) return 100; // default for unauthenticated
    const role = user.primaryRole || 'CLIENT';
    return ROLE_LIMITS[role]?.max || 100;
  },
  keyGenerator: (req) => {
    const userId = (req as any).user?.id;
    if (userId) return `user:${userId}`;
    return req.ip || 'unknown';
  },
  message: { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Webhook — 30 req / 1 min
 * Endpoints: FedaPay webhook, Stripe webhook
 * Les webhooks peuvent envoyer plusieurs événements en rafale, mais pas plus de 30/min
 */
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, error: 'Trop de requêtes webhook. Réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Apply role-adaptive rate limiting to a route
 * Usage: app.use('/api/sensitive', roleAdaptiveLimiter('ADMIN', 'BUSINESS'))
 */
export function roleAdaptiveLimiter(...allowedRoles: string[]) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
      const user = (req as any).user;
      if (!user) return 20; // unauthenticated strict
      const role = user.primaryRole;
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) return 20;
      return ROLE_LIMITS[role]?.max || 100;
    },
    keyGenerator: (req) => {
      const userId = (req as any).user?.id;
      return userId ? `user:${userId}` : req.ip || 'unknown';
    },
    message: { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}
