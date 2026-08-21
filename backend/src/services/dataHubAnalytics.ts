import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

export async function trackSearchQuery(
  query: string,
  resultCount: number,
  options?: {
    userId?: string;
    businessId?: string;
    source?: string;
    filters?: Record<string, any>;
  }
): Promise<void> {
  try {
    await prisma.searchLog.create({
      data: {
        query,
        resultCount,
        userId: options?.userId,
        businessId: options?.businessId,
        source: options?.source || 'marketplace',
        filters: options?.filters || undefined,
      },
    });
  } catch (err) {
    // Silently fail — search tracking is non-critical
    logger.error('Failed to track search query:', err);
  }
}

export async function getSearchTrends(days: number = 30): Promise<any> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalSearches, topQueries, queriesWithoutResults] = await Promise.all([
    prisma.searchLog.count({ where: { createdAt: { gte: since } } }),
    prisma.searchLog.groupBy({
      by: ['query'],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      _sum: { resultCount: true },
      orderBy: { _count: { id: 'desc' } },
      take: 50,
    }),
    prisma.searchLog.groupBy({
      by: ['query'],
      where: { createdAt: { gte: since }, resultCount: 0 },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
  ]);

  const noResultsCounts = new Map(queriesWithoutResults.map((q) => [q.query, q._count.id]));

  return {
    totalSearches,
    uniqueQueries: topQueries.length,
    topQueries: topQueries.map((q) => ({
      query: q.query,
      count: q._count.id,
      noResults: noResultsCounts.get(q.query) || 0,
    })),
    queriesWithoutResults: queriesWithoutResults.map((q) => ({
      query: q.query,
      count: q._count.id,
      noResults: q._count.id,
    })),
    period: days + ' days',
  };
}

export async function getConversionFunnel(businessId: string): Promise<any> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Récupérer les IDs des produits du business pour la query panier
  const businessProductIds = (
    await prisma.product.findMany({
      where: { businessId, deletedAt: null },
      select: { id: true },
    })
  ).map((p) => p.id);

  const [pageViews, productViews, productClicks, cartAdds, orders, payments] = await Promise.all([
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.productView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.productClick.count({ where: { businessId, clickedAt: { gte: thirtyDaysAgo } } }),
    businessProductIds.length > 0
      ? prisma.cartItem.count({
          where: { productId: { in: businessProductIds }, createdAt: { gte: thirtyDaysAgo } },
        })
      : 0,
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.payment.count({
      where: { order: { businessId }, createdAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' },
    }),
  ]);

  return {
    period: '30 jours',
    stages: [
      { name: 'Visites page', count: pageViews },
      { name: 'Vues produit', count: productViews },
      { name: 'Clics produit', count: productClicks },
      { name: 'Ajouts panier', count: cartAdds },
      { name: 'Commandes', count: orders },
      { name: 'Paiements', count: payments },
    ],
    conversionRates: {
      viewToClick: pageViews > 0 ? Math.round((productClicks / pageViews) * 10000) / 100 : 0,
      clickToCart: productClicks > 0 ? Math.round((cartAdds / productClicks) * 10000) / 100 : 0,
      cartToOrder: cartAdds > 0 ? Math.round((orders / cartAdds) * 10000) / 100 : 0,
      orderToPayment: orders > 0 ? Math.round((payments / orders) * 10000) / 100 : 0,
      overall: pageViews > 0 ? Math.round((payments / pageViews) * 10000) / 100 : 0,
    },
  };
}

export async function getRetentionCohorts(businessId: string): Promise<any> {
  const now = new Date();
  const cohorts: any[] = [];
  for (let i = 0; i < 6; i++) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const cohortClients = await prisma.businessClient.findMany({
      where: { businessId, createdAt: { gte: cohortStart, lt: cohortEnd } },
      select: { clientId: true, createdAt: true },
    });
    if (cohortClients.length === 0) continue;
    const clientIds = cohortClients.map((c) => c.clientId);
    const cs = cohortStart.getTime();
    const [w1, w4, w12] = await Promise.all([
      prisma.order.count({
        where: {
          businessId,
          buyerId: { in: clientIds },
          createdAt: { gte: new Date(cs), lt: new Date(cs + 7 * 86400000) },
        },
      }),
      prisma.order.count({
        where: {
          businessId,
          buyerId: { in: clientIds },
          createdAt: { gte: new Date(cs), lt: new Date(cs + 28 * 86400000) },
        },
      }),
      prisma.order.count({
        where: {
          businessId,
          buyerId: { in: clientIds },
          createdAt: { gte: new Date(cs), lt: new Date(cs + 84 * 86400000) },
        },
      }),
    ]);
    cohorts.push({
      period: cohortStart.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      total: cohortClients.length,
      week1: Math.round((w1 / cohortClients.length) * 100),
      week4: Math.round((w4 / cohortClients.length) * 100),
      week12: Math.round((w12 / cohortClients.length) * 100),
    });
  }
  return cohorts;
}

export async function getProductRecommendations(
  businessId: string,
  limit: number = 6
): Promise<any[]> {
  const [topViewed, topClicked, topOrdered] = await Promise.all([
    prisma.productView.groupBy({
      by: ['productId'],
      where: { businessId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    prisma.productClick.groupBy({
      by: ['productId'],
      where: { businessId },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { businessId } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
  ]);
  const scores = new Map<string, number>();
  for (const v of topViewed)
    scores.set(v.productId, (scores.get(v.productId) || 0) + v._count.id * 1);
  for (const c of topClicked)
    scores.set(c.productId, (scores.get(c.productId) || 0) + c._count.id * 3);
  for (const o of topOrdered) {
    if (o.productId) scores.set(o.productId, (scores.get(o.productId) || 0) + o._count.id * 5);
  }
  const sortedIds = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
  if (sortedIds.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: sortedIds }, businessId, deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      images: true,
      price: true,
      description: true,
      category: true,
      rating: true,
    },
  });
  return sortedIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .slice(0, limit);
}

export async function getEngagementAnalytics(businessId: string): Promise<any> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totalClients, activeClients, pageViews, reviews, messages] = await Promise.all([
    prisma.businessClient.count({ where: { businessId } }),
    prisma.businessClient.count({ where: { businessId, lastVisitAt: { gte: thirtyDaysAgo } } }),
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.businessReview.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.conversation.count({
      where: { participants: { has: businessId }, lastMessageAt: { gte: thirtyDaysAgo } },
    }),
  ]);
  return {
    totalClients,
    activeClients,
    engagementRate: totalClients > 0 ? Math.round((activeClients / totalClients) * 100) : 0,
    pageViews30d: pageViews,
    reviews30d: reviews,
    conversations30d: messages,
    avgViewsPerClient: activeClients > 0 ? Math.round(pageViews / activeClients) : 0,
  };
}

/**
 * Satisfaction (Data Hub) — synthèse branchée sur l'AfriScore :
 * score composant satisfaction, moyennes d'enquête, taux de réponse et
 * tendance 30 jours (fenêtre complète remplie, jours sans réponse = 0).
 */
export async function getSatisfactionAnalytics(businessId: string): Promise<any> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [score, agg, surveyLow, sentOrders, sentBookings, rows] = await Promise.all([
    prisma.businessScore.findUnique({
      where: { businessId },
      select: {
        overallScore: true,
        satisfactionScore: true,
        category: true,
        avgRating: true,
        reviewCount: true,
      },
    }),
    prisma.satisfactionSurveyResponse.aggregate({
      where: { businessId },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.satisfactionSurveyResponse.count({
      where: { businessId, createdAt: { gte: thirtyDaysAgo }, score: { lte: 2 } },
    }),
    prisma.order.count({
      where: { businessId, satisfactionSurveySentAt: { not: null } },
    }),
    prisma.booking.count({
      where: { businessId, satisfactionSurveySentAt: { not: null } },
    }),
    prisma.satisfactionSurveyResponse.findMany({
      where: { businessId, createdAt: { gte: thirtyDaysAgo } },
      select: { score: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 5000,
    }),
  ]);

  // Tendance 30 jours : fenêtre complète remplie, agrégation en mémoire
  const dayMap = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const day = r.createdAt.toISOString().slice(0, 10);
    const cur = dayMap.get(day) || { sum: 0, count: 0 };
    cur.sum += r.score;
    cur.count += 1;
    dayMap.set(day, cur);
  }
  const trend: { day: string; average: number | null; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const bucket = dayMap.get(key);
    trend.push({
      day: key,
      average: bucket ? Math.round((bucket.sum / bucket.count) * 10) / 10 : null,
      count: bucket ? bucket.count : 0,
    });
  }

  const totalResponses = agg._count._all || 0;
  const surveysSent = sentOrders + sentBookings;
  return {
    afriScoreComponent: score?.satisfactionScore ?? null,
    overallScore: score?.overallScore ?? null,
    category: score?.category ?? null,
    surveyAverage: agg._avg.score ?? null,
    surveyResponses: totalResponses,
    surveysSent,
    responseRate: surveysSent > 0 ? Math.round((totalResponses / surveysSent) * 1000) / 10 : null,
    recentLow30d: surveyLow,
    avgRating: score?.avgRating ?? null,
    reviewCount: score?.reviewCount ?? 0,
    trend,
    period: '30 jours',
  };
}

/**
 * Activité d'authentification (Data Hub) — alimentée par les AnalyticsEvent type 'auth'
 * (USER_SIGNED_UP, USER_LOGGED_IN, USER_LOGGED_OUT, PASSWORD_CHANGED, ACCOUNT_LOCKED).
 * L'Auth nourrit ainsi le Data Hub : KPIs + répartition par événement + courbe par jour.
 */
export async function getAuthTrends(days: number = 30): Promise<any> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { type: 'auth', occurredAt: { gte: since } } as any;

  const [total, byEvent, byDayRows] = await Promise.all([
    prisma.analyticsEvent.count({ where }),
    prisma.analyticsEvent.groupBy({
      by: ['eventName'],
      where,
      _count: { _all: true },
      orderBy: { _count: { eventName: 'desc' } },
    }),
    prisma.analyticsEvent.findMany({
      where,
      select: { occurredAt: true },
      orderBy: { occurredAt: 'asc' },
      take: 5000,
    }),
  ]);

  // Bucketing par jour en mémoire (évite le SQL date_trunc, fiable et simple)
  const dayMap = new Map<string, number>();
  for (const ev of byDayRows) {
    const day = ev.occurredAt.toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) || 0) + 1);
  }

  return {
    total,
    days,
    byEvent: byEvent.map((r) => ({ eventName: r.eventName, count: r._count._all })),
    byDay: Array.from(dayMap.entries()).map(([day, count]) => ({ day, count })),
  };
}
