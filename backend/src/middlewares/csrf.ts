import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { config } from '../config/env';
import { logger } from '../lib/logger';

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

export function setCsrfCookie(res: Response): void {
  if (res.headersSent) return;
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.includes(req.method)) {
    if (!req.cookies[CSRF_COOKIE]) {
      setCsrfCookie(res);
    }
    next();
    return;
  }

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER] as string | undefined;

  if (!cookieToken || !headerToken) {
    logger.warn('CSRF token missing', { method: req.method, path: req.path });
    res.status(403).json({ success: false, error: 'Token CSRF manquant' });
    return;
  }

  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    logger.warn('CSRF token mismatch', { method: req.method, path: req.path });
    res.status(403).json({ success: false, error: 'Token CSRF invalide' });
    return;
  }

  setCsrfCookie(res);
  next();
}
