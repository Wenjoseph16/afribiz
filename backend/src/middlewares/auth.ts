import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
    primaryRole: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token manquant' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      roles: decoded.roles || [decoded.primaryRole || 'CLIENT'],
      primaryRole: decoded.primaryRole || 'CLIENT',
    };
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalide' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      roles: decoded.roles || [decoded.primaryRole || 'CLIENT'],
      primaryRole: decoded.primaryRole || 'CLIENT',
    };
  } catch {
    // Token invalide, continuer sans user
  }
  next();
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Non authentifié' });
    }
    const hasRole = req.user.roles.some(r => roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ success: false, error: 'Accès refusé' });
    }
    next();
  };
}
