import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as analyticsService from '../services/analyticsService';
import { prisma } from '../lib/db';

function isAdminUser(req: AuthenticatedRequest): boolean {
  return req.user!.primaryRole === 'ADMIN' || (req.user!.roles || []).includes('ADMIN');
}

/**
 * Récupère le business du user connecté (owner).
 * - Admin → undefined (vue plateforme globale)
 * - Business sans business associé → 404 (cohérent avec getEventsCounters :
 *   un compte sans business ne doit jamais voir le flux complet de la plateforme)
 */
async function requireBusinessScope(req: AuthenticatedRequest): Promise<string | undefined> {
  if (isAdminUser(req)) return undefined;
  const business = await prisma.business.findUnique({
    where: { ownerId: req.user!.id },
    select: { id: true },
  });
  if (!business) throw new AppError('Aucun business associé au compte', 404);
  return business.id;
}

/** GET /api/analytics/events — flux temps réel (filtres : type, category, search, from, to, page, limit) */
export const getEventsFeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = await requireBusinessScope(req);

  const result = await analyticsService.getAnalyticsEvents({
    businessId,
    type: req.query.type as string | undefined,
    category: req.query.category as string | undefined,
    search: req.query.search as string | undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string) : 1,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
  });

  res.json({ success: true, data: result });
});

/** GET /api/analytics/events/breakdown — répartition par type */
export const getEventsByType = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await requireBusinessScope(req);
    const days = parseInt(req.query.days as string) || 30;

    const breakdown = await analyticsService.getEventBreakdownByType(businessId, days);
    res.json({ success: true, data: { breakdown, days } });
  }
);

/** GET /api/analytics/events/breakdown/category — répartition par catégorie d'interaction */
export const getEventsByCategory = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await requireBusinessScope(req);
    const days = parseInt(req.query.days as string) || 30;

    const breakdown = await analyticsService.getEventBreakdownByCategory(businessId, days);
    res.json({ success: true, data: { breakdown, days } });
  }
);

/** GET /api/analytics/events/summary — totaux de la période (total, today, byType, byCategory) */
export const getEventsSummary = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await requireBusinessScope(req);
    const days = parseInt(req.query.days as string) || 30;

    const summary = await analyticsService.getAnalyticsSummary(businessId, days);
    res.json({ success: true, data: summary });
  }
);

/** GET /api/analytics/events/counters — compteurs agrégés business (totals par type + revenue) */
export const getEventsCounters = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await requireBusinessScope(req);
    if (!businessId) throw new AppError('Aucun business associé au compte', 404);
    const days = parseInt(req.query.days as string) || 30;

    const counters = await analyticsService.getBusinessAnalyticsCounters(businessId, days);
    res.json({ success: true, data: counters });
  }
);
