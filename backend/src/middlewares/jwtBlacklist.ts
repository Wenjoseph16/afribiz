import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { RevokedTokenRepository } from '../repositories/revokedTokenRepository';
import { AuthenticatedRequest } from './auth';

export async function jwtBlacklistMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token) as any;
    if (decoded?.jti) {
      const isRevoked = await RevokedTokenRepository.findByJti(decoded.jti);
      if (isRevoked) {
        return res.status(401).json({ success: false, error: 'Token révoqué' });
      }
    }
  } catch {
    // Silent fail — le middleware auth gère l'erreur
  }

  next();
}
