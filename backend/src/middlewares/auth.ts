import { Request, Response, NextFunction } from 'express';
import { AppError, catchAsyncErrors } from './errorHandler';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    primaryRole: string;
    roles: string[];
  };
  sessionId?: string;
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authMiddleware = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        primaryRole: decoded.primaryRole,
        roles: decoded.roles || [],
      };
      next();
    } catch (error: any) {
      throw new AppError(error.message || 'Invalid token', 401);
    }
  }
);

/**
 * Role-based access control middleware
 * Allows access if user has at least one of the specified roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Check both roles array AND primaryRole for defense in depth
    const userRoles: string[] = req.user!.roles || [];
    const hasRole = allowedRoles.some(
      (role) => userRoles.includes(role) || req.user!.primaryRole === role
    );

    if (!hasRole) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  });
};

/**
 * Require primary role
 */
export const requirePrimaryRole = (role: string) => {
  return catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (req.user.primaryRole !== role) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  });
};

/**
 * Require email verification — vérifie en base que l'email du compte est vérifié.
 * À appliquer aux actions sensibles (argent, admin, etc.).
 * NB : coût = 1 requête DB légère par appel (select emailVerified uniquement).
 */
export const requireEmailVerified = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });
    if (!user) {
      throw new AppError('User not found', 401);
    }
    if (!user.emailVerified) {
      throw new AppError(
        'Email non vérifié. Veuillez vérifier votre adresse email avant de continuer.',
        403,
        { code: 'EMAIL_NOT_VERIFIED' }
      );
    }

    next();
  }
);

/**
 * Optional authentication - doesn't throw if no token
 */
export const optionalAuth = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        req.user = {
          id: decoded.id,
          email: decoded.email,
          primaryRole: decoded.primaryRole,
          roles: decoded.roles || [],
        };
      } catch (error) {
        // Silently ignore auth errors for optional auth
      }
    }

    next();
  }
);

