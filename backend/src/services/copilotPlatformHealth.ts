import { prisma } from '../lib/db';

interface PlatformHealthResult {
  totalBusinesses: number;
  healthDistribution: {
    excellent: number;
    good: number;
    fair: number;
    critical: number;
  };
  averageHealthScore: number;
  topMissingTips: { tip: string; count: number }[];
  featureAdoption: { module: string; count: number; percentage: number }[];
  businessesAtRisk: { id: string; name: string; healthScore: number; daysSinceLastOrder: number }[];
  healthTrend30d: { date: string; avg: number }[];
  totalModules: number;
  totalActiveInstallations: number;
}

export async function getPlatformHealth(): Promise<PlatformHealthResult> {
  const [businesses, activeBusinesses, , totalModules] = await Promise.all([
    prisma.business.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        score: true,
        modules: true,
        createdAt: true,
      },
    }),
    prisma.business.count({ where: { deletedAt: null, isActive: true } }),
    prisma.developerProfile.count({ where: { isActive: true } }),
    prisma.developerModule.count({ where: { isPublished: true } }),
  ]);

  // Health distribution
  const healthDistribution = { excellent: 0, good: 0, fair: 0, critical: 0 };
  let totalHealthScore = 0;

  // Feature adoption tracking
  const moduleCounts: Record<string, number> = {};

  // Collect data per business
  const atRisk: { id: string; name: string; healthScore: number; daysSinceLastOrder: number }[] =
    [];

  for (const b of businesses) {
    const s = b.score;
    const health = s ? Math.round(s.overallScore / 10) : 0;
    totalHealthScore += health;

    if (health >= 80) healthDistribution.excellent++;
    else if (health >= 60) healthDistribution.good++;
    else if (health >= 40) healthDistribution.fair++;
    else healthDistribution.critical++;

    // Module adoption
    const mods = (b.modules || []) as string[];
    for (const m of mods) {
      moduleCounts[m] = (moduleCounts[m] || 0) + 1;
    }

    // Churn risk detection
    if (health < 50) {
      const lastOrder = await prisma.order.findFirst({
        where: { businessId: b.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });
      const daysSince = lastOrder
        ? Math.round((Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      if (daysSince > 30) {
        atRisk.push({ id: b.id, name: b.name, healthScore: health, daysSinceLastOrder: daysSince });
      }
    }
  }

  // Average health
  const averageHealthScore =
    businesses.length > 0 ? Math.round(totalHealthScore / businesses.length) : 0;

  // Feature adoption
  const totalBiz = businesses.length || 1;
  const featureAdoption = Object.entries(moduleCounts)
    .map(([module, count]) => ({
      module,
      count,
      percentage: Math.round((count / totalBiz) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Top missing tips (based on business profiles)
  const [noLogo, noDescription, noAddress] = await Promise.all([
    prisma.business.count({ where: { deletedAt: null, logo: null } }),
    prisma.business.count({ where: { deletedAt: null, description: null } }),
    prisma.business.count({ where: { deletedAt: null, address: null } }),
    prisma.product.count({
      where: {
        business: { deletedAt: null },
        deletedAt: null,
      },
    }),
  ]);

  const totalWithProducts = await prisma.product.groupBy({
    by: ['businessId'],
    where: { deletedAt: null, business: { deletedAt: null } },
  });

  const topMissingTips = [
    { tip: 'Logo manquant', count: noLogo },
    { tip: 'Description manquante', count: noDescription },
    { tip: 'Adresse manquante', count: noAddress },
    { tip: 'Aucun produit publié', count: activeBusinesses - totalWithProducts.length },
  ].sort((a, b) => b.count - a.count);

  // 30-day trend (from BusinessDailyStats)
  const thirtyDaysAgoStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const dailyStats = await prisma.businessDailyStats.groupBy({
    by: ['date'],
    where: { date: { gte: thirtyDaysAgoStart } },
    _avg: { orders: true, pageViews: true },
    orderBy: { date: 'asc' },
  });

  const healthTrend30d = dailyStats.map((d) => ({
    date: d.date.toISOString().split('T')[0],
    avg: Math.round(((d._avg.orders || 0) * 10 + (d._avg.pageViews || 0) * 5) / 2),
  }));

  return {
    totalBusinesses: activeBusinesses,
    healthDistribution,
    averageHealthScore,
    topMissingTips,
    featureAdoption,
    businessesAtRisk: atRisk.sort((a, b) => a.healthScore - b.healthScore).slice(0, 10),
    healthTrend30d,
    totalModules,
    totalActiveInstallations: await prisma.developerModuleInstallation.count({
      where: { status: 'ACTIVE' },
    }),
  };
}
