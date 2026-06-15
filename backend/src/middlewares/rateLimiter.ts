import rateLimit from 'express-rate-limit';

// ============================================
// Rate Limiters centralisés par groupe de routes
// Chaque limiteur est IP-based (comportement par défaut d'express-rate-limit)
// ============================================

/**
 * Authentification — 5 req / 15 min (par défaut)
 * Endpoints: signup, login, forgot-password, reset-password, OTP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '100', 10),
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
