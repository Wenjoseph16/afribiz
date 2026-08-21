import { Router, Response } from 'express';
import {
  authMiddleware,
  AuthenticatedRequest,
  requireEmployeePermission,
} from '../middlewares/auth';
import { prisma } from '../lib/db';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';

const router = Router();

/**
 * GET /api/business/my-permissions
 *
 * Retourne les permissions de l'utilisateur courant :
 * - Boss (ownerId) → { isBoss: true, permissions: ['ALL_ACCESS'] }
 * - Employé → { isBoss: false, permissions: [...], employee: { ... } }
 *
 * Utilisé par le frontend pour filtrer la sidebar et afficher l'indicateur de contexte.
 */
router.get(
  '/my-permissions',
  authMiddleware,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    // ── Token employé ──
    if (req.isEmployee && req.employeeId) {
      const employee = await prisma.employee.findUnique({
        where: { id: req.employeeId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
          photo: true,
          businessId: true,
          maxDiscountPercentage: true,
          employeeRole: {
            select: {
              id: true,
              name: true,
              permissions: true,
            },
          },
        },
      });

      if (!employee) throw new AppError('Employé introuvable', 404);

      return res.json({
        success: true,
        data: {
          isBoss: false,
          permissions: req.employeePermissions || [],
          maxDiscountPercentage: employee.maxDiscountPercentage
            ? Number(employee.maxDiscountPercentage)
            : null,
          employee: {
            id: employee.id,
            firstName: employee.firstName,
            lastName: employee.lastName,
            position: employee.position,
            photo: employee.photo,
            businessId: employee.businessId,
            role: employee.employeeRole?.name || null,
          },
        },
      });
    }

    // ── Token boss (classique) ──
    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    });

    if (business) {
      return res.json({
        success: true,
        data: {
          isBoss: true,
          permissions: ['ALL_ACCESS'],
          maxDiscountPercentage: null,
          employee: null,
          business: {
            id: business.id,
            name: business.name,
          },
        },
      });
    }

    // ── Utilisateur sans business (CLIENT, etc.) ──
    return res.json({
      success: true,
      data: {
        isBoss: false,
        permissions: [],
        maxDiscountPercentage: null,
        employee: null,
      },
    });
  })
);

export default router;
