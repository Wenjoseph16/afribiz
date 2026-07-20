import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as clientIntelligence from '../services/clientIntelligenceService';
import * as businessService from '../services/business';

export const getMyClientIntelligence = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const business = await businessService.getMyBusiness(req.user.id);
    if (!business) throw new AppError('Aucun business trouvé', 404);

    const [segments, topClients, barometer] = await Promise.all([
      clientIntelligence.segmentClients(business.id).catch(() => null),
      clientIntelligence.getTopClients(business.id, '30d', 5).catch(() => null),
      clientIntelligence.getActivityBarometer(business.id).catch(() => null),
    ]);

    // Métriques avec valeurs par défaut sûres
    const counts = segments?.counts || {};
    const c = counts as Record<string, number>;
    const totalClients = segments?.clients?.length ?? 0;
    const activeClients = (c?.VIP ?? 0) + (c?.LOYAL ?? 0) + (c?.ACTIVE ?? 0);
    const avgScore =
      totalClients > 0 ? `${Math.round((activeClients / totalClients) * 100)}%` : '-';
    const activityRate =
      totalClients > 0 ? `${Math.round((activeClients / totalClients) * 100)}%` : '0%';
    const accuracy = topClients?.length
      ? `${Math.round((topClients.length / Math.max(totalClients, 1)) * 100)}%`
      : '0%';
    const trend = topClients?.length ? 'positive' : 'stable';

    const insights: any[] = [
      ...(segments?.suggestions?.map((s: any) => ({
        id: `seg-${s?.segment || 'unknown'}`,
        title: s?.message?.split('.')[0] || `Segment : ${s?.segment || 'N/A'}`,
        sentiment: (s?.segment === 'VIP' || s?.segment === 'LOYAL' ? 'positive' : 'neutral') as
          | 'positive'
          | 'neutral',
        description: s?.message || `${s?.segment || 'Client'}`,
      })) ?? []),
      ...(topClients?.map((c: any) => ({
        id: `top-${c?.clientId}`,
        title:
          c?.firstName && c?.lastName
            ? `${c.firstName} ${c.lastName}`
            : c?.firstName || `Client #${c?.clientId?.slice(0, 8) || 'N/A'}`,
        sentiment: 'positive' as const,
        description: `${c?.ordersInPeriod || 0} commandes · ${c?.totalSpentInPeriod || 0} FCFA`,
      })) ?? []),
      ...(barometer?.peakHour
        ? [
            {
              id: 'peak-hour',
              title: `Heure de pointe : ${barometer.peakHour.hour}`,
              sentiment: 'neutral' as const,
              description: `${barometer.peakHour.count} commandes à cette heure`,
            },
          ]
        : []),
      ...(barometer?.peakDay
        ? [
            {
              id: 'peak-day',
              title: `Jour le plus actif : ${barometer.peakDay.day}`,
              sentiment: 'neutral' as const,
              description: `${barometer.peakDay.count} commandes ce jour`,
            },
          ]
        : []),
      ...(barometer?.trendingProducts?.length
        ? [
            {
              id: 'trending',
              title: `${barometer.trendingProducts.length} produit(s) en tendance`,
              sentiment: 'positive' as const,
              description: barometer.trendingProducts
                .map((p: any) => p?.name)
                .filter(Boolean)
                .join(', '),
            },
          ]
        : []),
    ];

    res.json(successResponse({ avgScore, activityRate, accuracy, trend, insights }));
  }
);

export const getClientSegments = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const businessId = req.query.businessId as string;
    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }

    const result = await clientIntelligence.segmentClients(businessId);
    res.json(successResponse(result));
  }
);

export const getTopClients = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const businessId = req.query.businessId as string;
  if (!businessId) {
    throw new AppError('businessId requis', 400);
  }

  const period = (req.query.period as '7d' | '30d' | '90d' | 'all') || '30d';
  const limit = Number(req.query.limit) || 10;
  const top = await clientIntelligence.getTopClients(businessId, period, limit);
  res.json(successResponse(top));
});

export const getActivityBarometer = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.query.businessId as string;
    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }

    const barometer = await clientIntelligence.getActivityBarometer(businessId);
    res.json(successResponse(barometer));
  }
);
