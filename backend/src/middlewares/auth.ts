import { Request, Response, NextFunction } from 'express';
import { AppError, catchAsyncErrors } from './errorHandler';
import { verifyAccessToken } from '../lib/jwt';

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
 * Require email verification
 */
export const requireEmailVerified = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // In a real app, you'd check user.emailVerified from database
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

/**
 * Login attempt rate limiting middleware
 */
export const loginRateLimit = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts: { [key: string]: { count: number; firstAttempt: number } } = {};

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.body.email || req.ip;

    if (!attempts[identifier]) {
      attempts[identifier] = { count: 0, firstAttempt: Date.now() };
    }

    const now = Date.now();
    const timeSinceFirstAttempt = now - attempts[identifier].firstAttempt;

    // Reset if window has passed
    if (timeSinceFirstAttempt > windowMs) {
      attempts[identifier] = { count: 0, firstAttempt: now };
    }

    attempts[identifier].count++;

    if (attempts[identifier].count > maxAttempts) {
      throw new AppError(
        `Too many login attempts. Please try again in ${Math.ceil((windowMs - timeSinceFirstAttempt) / 1000)} seconds.`,
        429
      );
    }

    next();
  };
};
