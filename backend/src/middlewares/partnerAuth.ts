import { Response, NextFunction } from 'express';
import { AppError, catchAsyncErrors } from './errorHandler';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from './auth';

export interface PartnerRequest extends AuthenticatedRequest {
  partner?: {
    id: string;
    name: string;
    type: string;
    slug: string;
  };
}

export const partnerAuthMiddleware = catchAsyncErrors(
  async (req: PartnerRequest, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppError('API key requise. Utilisez l\'en-tête X-API-Key.', 401);
    }

    const partner = await prisma.dataPartner.findUnique({
      where: { apiKey },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
    });

    if (!partner) {
      throw new AppError('Clé API invalide', 401);
    }

    if (!partner.isActive) {
      throw new AppError('Ce partenaire est désactivé', 403);
    }

    if (!partner.apiEnabled) {
      throw new AppError('API non activée pour ce partenaire', 403);
    }

    if (partner.subscriptions.length === 0) {
      throw new AppError('Aucun abonnement actif. Veuillez souscrire à un abonnement.', 403);
    }

    if (partner.apiUsed >= partner.apiQuota) {
      throw new AppError('Quota API dépassé', 429);
    }

    await prisma.dataPartner.update({
      where: { id: partner.id },
      data: { apiUsed: { increment: 1 } },
    });

    req.partner = {
      id: partner.id,
      name: partner.name,
      type: partner.type,
      slug: partner.slug,
    };

    next();
  }
);
