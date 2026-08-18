import { Request, Response, NextFunction } from 'express';
import { AppError, catchAsyncErrors } from './errorHandler';
import { verifyAccessToken, isEmployeeToken, type AnyJWTPayload } from '../lib/jwt';
import { prisma } from '../lib/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    primaryRole: string;
    roles: string[];
  };
  sessionId?: string;
  /** Mode voir-comme : l'admin navigue en lecture seule avec l'identité d'un autre utilisateur */
  isImpersonating?: boolean;
  impersonatorId?: string;

  // ── Chantier 7 : tokens employé ──
  /** True si le token provient d'une auth employé (pinCode) */
  isEmployee?: boolean;
  /** ID de l'employé (uniquement si token employé) */
  employeeId?: string;
  /** ID du business (uniquement si token employé) */
  employeeBusinessId?: string;
  /** Permissions de l'employé depuis son EmployeeRole */
  employeePermissions?: string[];
  /** Seuil max de remise autorisé pour cet employé */
  employeeMaxDiscount?: number;
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
      const decoded: AnyJWTPayload = verifyAccessToken(token);

      // ── Token employé (Chantier 7) ──
      if (isEmployeeToken(decoded)) {
        req.isEmployee = true;
        req.employeeId = decoded.employeeId;
        req.employeeBusinessId = decoded.businessId;
        req.employeePermissions = decoded.permissions || [];
        req.employeeMaxDiscount = (decoded as any).maxDiscountPercentage ?? undefined;
        // On peuple aussi `user` pour la compatibilité backward avec les
        // contrôleurs qui vérifient req.user — l'employé est traité comme
        // un BUSINESS pour les anciens middlewares requireRole.
        req.user = {
          id: decoded.employeeId,
          email: '',
          primaryRole: 'BUSINESS',
          roles: ['BUSINESS'],
        };
        return next();
      }

      // ── Token boss / classique ──
      req.user = {
        id: decoded.id,
        email: decoded.email,
        primaryRole: decoded.primaryRole,
        roles: decoded.roles || [],
      };

      // Session liée au token : on vérifie qu'elle est toujours active. Permet à
      // « déconnecter un appareil » d'avoir un vrai effet (le JWT révoqué est rejeté).
      // Les tokens émis AVANT cette fonctionnalité (sans sessionId) restent valides.
      if (decoded.sessionId) {
        req.sessionId = decoded.sessionId;
        const s = await prisma.session.findUnique({ where: { id: decoded.sessionId } });
        if (!s || s.userId !== decoded.id || !s.isActive || s.expiresAt < new Date()) {
          throw new AppError('Session invalide ou révoquée. Veuillez vous reconnecter.', 401);
        }
      }

      // Mode voir-comme : lecture seule. Toute mutation est refusée (403),
      // sauf les routes d'échappement nécessaires (logout, stop impersonation, refresh).
      if (decoded.impersonating) {
        req.isImpersonating = true;
        req.impersonatorId = decoded.impersonatorId;
        const method = req.method.toUpperCase();
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
        const escaped = req.path.includes('/auth/logout') || req.path.includes('/impersonate/stop');
        if (isMutation && !escaped) {
          throw new AppError(
            'Mode lecture seule (voir-comme) : les modifications sont désactivées',
            403
          );
        }
      }

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
        if (isEmployeeToken(decoded)) {
          req.isEmployee = true;
          req.employeeId = decoded.employeeId;
          req.employeeBusinessId = decoded.businessId;
          req.employeePermissions = decoded.permissions || [];
          req.user = { id: decoded.employeeId, email: '', primaryRole: 'BUSINESS', roles: ['BUSINESS'] };
        } else {
          req.user = {
            id: decoded.id,
            email: decoded.email,
            primaryRole: decoded.primaryRole,
            roles: decoded.roles || [],
          };
        }
      } catch (error) {
        // Silently ignore auth errors for optional auth
      }
    }

    next();
  }
);

/**
 * Permission-based access control (Chantier 7)
 *
 * Règle :
 *  - Boss (ownerId du business) → TOUJOURS AUTORISÉ (Master Key)
 *  - Employé → vérifie que au moins une des permissions requises
 *    est dans son EmployeeRole.permissions
 *
 * NE fonctionne QU'après authMiddleware — req.user doit être peuplé.
 *
 * @param requiredPermissions - au moins une permission requise
 * @param opts.checkOwnership - si true, vérifie que l'utilisateur est bien
 *   le propriétaire du business (via ownerId). Par défaut true pour les
 *   routes qui opèrent sur le business courant.
 */
export const requireEmployeePermission = (
  requiredPermissions: string[],
  opts: { checkOwnership?: boolean } = {}
) => {
  const { checkOwnership = true } = opts;

  return catchAsyncErrors(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // ── Cas 1 : Token employé ──
    if (req.isEmployee && req.employeePermissions) {
      const hasPermission = requiredPermissions.some((p) =>
        req.employeePermissions!.includes(p)
      );
      if (!hasPermission) {
        throw new AppError(
          `Accès refusé. Permissions requises : ${requiredPermissions.join(' ou ')}`,
          403
        );
      }
      return next();
    }

    // ── Cas 2 : Boss (ownerId) → Master Key, toujours autorisé ──
    if (checkOwnership) {
      const businessId =
        (req.params.businessId as string) || (req.params.id as string) || '';
      if (businessId) {
        const business = await prisma.business.findFirst({
          where: { id: businessId, ownerId: req.user.id, isActive: true },
          select: { id: true },
        });
        if (business) {
          // Le propriétaire a accès total
          return next();
        }
      }

      // Fallback : vérifier via getBusinessByOwner (le user possède AU MOINS un business)
      const ownsAny = await prisma.business.findFirst({
        where: { ownerId: req.user.id, isActive: true, deletedAt: null },
        select: { id: true },
      });
      if (ownsAny) {
        return next();
      }
    }

    // ── Cas 3 : Ni employé Ni boss → refus ──
    throw new AppError(
      `Accès refusé. Permissions requises : ${requiredPermissions.join(' ou ')}`,
      403
    );
  });
};
