import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as growthEngine from '../services/growthEngineService';
import { GrowthBriefType } from '@prisma/client';

import { prisma } from '../lib/db';

async function getBusinessId(req: AuthenticatedRequest): Promise<string> {
  if (!req.user) throw new AppError('Non authentifié', 401);
  // Le paramètre ?businessId= est réservé à l'usage interne/admin (Cron, débogage).
  // Pour un utilisateur normal, on résout TOUJOURS le business depuis son compte :
  // jamais de lecture croisée du brief/analytics d'un autre business (IDOR).
  const qId = req.query.businessId as string | undefined;
  if (qId && req.user.roles?.includes('ADMIN')) return qId;
  const business = await prisma.business.findFirst({
    where: { ownerId: req.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Aucun business trouvé pour cet utilisateur', 404);
  return business.id;
}

export const getMorningBrief = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const businessId = await getBusinessId(req);

    const brief = await growthEngine.getLatestBrief(businessId, 'MORNING_BRIEF' as GrowthBriefType);
    // Un brief stocké n'est valable que s'il date d'aujourd'hui (le cron régénère chaque matin).
    // S'il est périmé (hier ou avant), on le régénère pour ne jamais afficher de vieilles données
    // présentées comme « brief du matin ».
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isFresh = !!brief?.date && new Date(brief.date).getTime() >= todayStart.getTime();
    if (brief && isFresh) {
      res.json(successResponse(brief));
      return;
    }

    const generated = await growthEngine.generateMorningBrief(businessId);
    res.json(successResponse(generated));
  }
);

export const getEveningSummary = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const businessId = await getBusinessId(req);

    const summary = await growthEngine.getLatestBrief(
      businessId,
      'EVENING_SUMMARY' as GrowthBriefType
    );
    if (summary) {
      res.json(successResponse(summary));
      return;
    }

    const generated = await growthEngine.generateEveningSummary(businessId);
    res.json(successResponse(generated));
  }
);

export const generateBriefNow = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { businessId: bodyId, type } = req.body;
    const businessId = bodyId || (await getBusinessId(req));
    if (!type) {
      throw new AppError('type requis (MORNING_BRIEF ou EVENING_SUMMARY)', 400);
    }

    if (type === 'MORNING_BRIEF') {
      const result = await growthEngine.generateMorningBrief(businessId);
      res.json(successResponse(result, 'Brief généré'));
    } else if (type === 'EVENING_SUMMARY') {
      const result = await growthEngine.generateEveningSummary(businessId);
      res.json(successResponse(result, 'Résumé généré'));
    } else {
      throw new AppError('Type invalide', 400);
    }
  }
);

export const getCalendarInsights = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const insights = await growthEngine.generateCalendarInsights(businessId);
    res.json(successResponse(insights));
  }
);

export const getRecentBriefs = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const businessId = await getBusinessId(req);
    const days = Number(req.query.days) || 7;
    const briefs = await growthEngine.getRecentBriefs(businessId, days);
    res.json(successResponse(briefs));
  }
);
