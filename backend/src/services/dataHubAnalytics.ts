import { prisma } from '../lib/db';

// LIMITATION: in-memory — perdu au redémarrage du serveur
const searchQueries: { query: string; timestamp: Date; resultCount: number }[] = [];
const MAX_SEARCH_LOGS = 10000;

export function trackSearchQuery(query: string, resultCount: number): void {
  searchQueries.push({ query, timestamp: new Date(), resultCount });
  if (searchQueries.length > MAX_SEARCH_LOGS) {
    searchQueries.splice(0, searchQueries.length - MAX_SEARCH_LOGS);
  }
}

export function getSearchTrends(days: number = 30): any {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = searchQueries.filter((q) => q.timestamp.getTime() > since);
  const queryCounts = new Map<string, { count: number; noResults: number }>();
  for (const q of recent) {
    const key = q.query.toLowerCase().trim();
    if (!key) continue;
    const entry = queryCounts.get(key) || { count: 0, noResults: 0 };
    entry.count++;
    if (q.resultCount === 0) entry.noResults++;
    queryCounts.set(key, entry);
  }
  return {
    totalSearches: recent.length,
    uniqueQueries: queryCounts.size,
    topQueries: Array.from(queryCounts.entries())
      .map(([query, stats]) => ({ query, count: stats.count, noResults: stats.noResults }))
      .sort((a, b) => b.count - a.count).slice(0, 50),
    queriesWithoutResults: Array.from(queryCounts.entries())
      .filter(([, stats]) => stats.noResults > 0)
      .map(([query, stats]) => ({ query, count: stats.count, noResults: stats.noResults }))
      .sort((a, b) => b.count - a.count).slice(0, 20),
    period: days + ' days',
  };
}

export async function getConversionFunnel(businessId: string): Promise<any> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Récupérer les IDs des produits du business pour la query panier
  const businessProductIds = (await prisma.product.findMany({
    where: { businessId, deletedAt: null },
    select: { id: true },
  })).map((p) => p.id);

  const [pageViews, productViews, productClicks, cartAdds, orders, payments] = await Promise.all([
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.productView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.productClick.count({ where: { businessId, clickedAt: { gte: thirtyDaysAgo } } }),
    businessProductIds.length > 0
      ? prisma.cartItem.count({ where: { productId: { in: businessProductIds }, createdAt: { gte: thirtyDaysAgo } } })
      : 0,
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.payment.count({ where: { order: { businessId }, createdAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' } }),
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
      prisma.order.count({ where: { businessId, buyerId: { in: clientIds }, createdAt: { gte: new Date(cs), lt: new Date(cs + 7 * 86400000) } } }),
      prisma.order.count({ where: { businessId, buyerId: { in: clientIds }, createdAt: { gte: new Date(cs), lt: new Date(cs + 28 * 86400000) } } }),
      prisma.order.count({ where: { businessId, buyerId: { in: clientIds }, createdAt: { gte: new Date(cs), lt: new Date(cs + 84 * 86400000) } } }),
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

export async function getProductRecommendations(businessId: string, limit: number = 6): Promise<any[]> {
  const [topViewed, topClicked, topOrdered] = await Promise.all([
    prisma.productView.groupBy({ by: ['productId'], where: { businessId }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 20 }),
    prisma.productClick.groupBy({ by: ['productId'], where: { businessId }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 20 }),
    prisma.orderItem.groupBy({ by: ['productId'], where: { order: { businessId } }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 20 }),
  ]);
  const scores = new Map<string, number>();
  for (const v of topViewed) scores.set(v.productId, (scores.get(v.productId) || 0) + v._count.id * 1);
  for (const c of topClicked) scores.set(c.productId, (scores.get(c.productId) || 0) + c._count.id * 3);
  for (const o of topOrdered) { if (o.productId) scores.set(o.productId, (scores.get(o.productId) || 0) + o._count.id * 5); }
  const sortedIds = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  if (sortedIds.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: sortedIds }, businessId, deletedAt: null, isActive: true },
    select: { id: true, name: true, slug: true, images: true, price: true, description: true, category: true, rating: true },
  });
  return sortedIds.map((id) => products.find((p) => p.id === id)).filter(Boolean).slice(0, limit);
}

export async function getEngagementAnalytics(businessId: string): Promise<any> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [totalClients, activeClients, pageViews, reviews, messages] = await Promise.all([
    prisma.businessClient.count({ where: { businessId } }),
    prisma.businessClient.count({ where: { businessId, lastVisitAt: { gte: thirtyDaysAgo } } }),
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.businessReview.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.conversation.count({ where: { participants: { has: businessId }, lastMessageAt: { gte: thirtyDaysAgo } } }),
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
