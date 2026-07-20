import { Router, Response } from 'express';
import { authMiddleware, optionalAuth, AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import { prisma } from '../lib/db';

const router = Router();

router.get(
  '/',
  optionalAuth,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
        deletedAt: null,
      },
      include: {
        business: { select: { id: true, name: true, slug: true, logo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(successResponse(promotions));
  })
);

router.get(
  '/loyalty/program',
  authMiddleware,
  catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Non authentifié' });
      return;
    }

    const loyaltyPoints = await prisma.loyaltyPoints.findMany({
      where: { clientId: req.user.id },
      include: {
        business: { select: { id: true, name: true, slug: true, logo: true } },
      },
      orderBy: { totalPoints: 'desc' },
    });

    const businessIds = loyaltyPoints.map((p) => p.businessId);
    const programs =
      businessIds.length > 0
        ? await prisma.loyaltyProgram.findMany({
            where: { businessId: { in: businessIds } },
            select: {
              id: true,
              businessId: true,
              name: true,
              description: true,
              pointsPerAmount: true,
              amountForPoints: true,
              currency: true,
            },
          })
        : [];

    res.json(successResponse({ points: loyaltyPoints, programs }));
  })
);

export default router;
