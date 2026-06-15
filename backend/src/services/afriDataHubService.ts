import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

// ── Cache in-memory avec TTL ──
const cache = new Map<string, { data: any; expiresAt: number }>();
const TTL_DEFAULT = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any, ttlMs: number = TTL_DEFAULT): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearCache(): void {
  cache.clear();
}

export function clearCachePattern(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

export async function getPlatformStats(): Promise<any> {
  const cached = getCached<any>('platform:stats');
  if (cached) return cached;
  const [
    totalBusinesses,
    totalOrders,
    totalBookings,
    totalPayments,
    events,
    rentals,
    revenue,
  ] = await Promise.all([
    prisma.business.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.booking.count(),
    prisma.payment.aggregate({ _count: true, _sum: { amount: true } }),
    prisma.event.count({ where: { isActive: true } }),
    prisma.rental.count({ where: { isActive: true } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
    }),
  ]);

  const result = {
    totalBusinesses,
    totalOrders,
    totalBookings,
    totalPayments: totalPayments._count,
    totalEvents: events,
    totalRentals: rentals,
    totalRevenue: revenue._sum.amount?.toNumber() || 0,
    currency: 'FCFA',
    updatedAt: new Date(),
  };
  setCache('platform:stats', result, 5 * 60 * 1000);
  return result;
}

export async function getSectorStats(): Promise<any[]> {
  const cached = getCached<any[]>('platform:sectors');
  if (cached) return cached;

  const sectors = await prisma.business.groupBy({
    by: ['type'],
    where: { isActive: true },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const withRevenue = await Promise.all(
    sectors.map(async (s) => {
      const businesses = await prisma.business.findMany({
        where: { type: s.type, isActive: true },
        select: { id: true, ownerId: true },
      });
      const ownerIds = businesses.map((b) => b.ownerId);

      let revenue = 0;
      if (ownerIds.length > 0) {
        const r = await prisma.payment.aggregate({
          where: {
            status: 'COMPLETED',
            userId: { in: ownerIds },
          },
          _sum: { amount: true },
        });
        revenue = r._sum.amount?.toNumber() || 0;
      }

      return {
        sector: s.type,
        count: s._count.id,
        revenue,
      };
    })
  );

  setCache('platform:sectors', withRevenue, 10 * 60 * 1000);
  return withRevenue;
}

export async function getGeographicStats(): Promise<any> {
  const cached = getCached<any>('platform:geographic');
  if (cached) return cached;

  const byCountry = await prisma.business.groupBy({
    by: ['country'],
    where: { isActive: true, country: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const byCity = await prisma.business.groupBy({
    by: ['city', 'country'],
    where: { isActive: true, city: { not: null } },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 50,
  });

  const result = { byCountry, byCity };
  setCache('platform:geographic', result, 10 * 60 * 1000);
  return result;
}

export async function getGrowthStats(): Promise<any> {
  const cached = getCached<any>('platform:growth');
  if (cached) return cached;

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const [
    thisMonthOrders,
    lastMonthOrders,
    lastYearOrders,
    thisMonthBookings,
    lastMonthBookings,
    thisMonthRevenue,
    lastMonthRevenue,
    thisMonthBusinesses,
    lastMonthBusinesses,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.order.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
    prisma.order.count({ where: { createdAt: { gte: lastYear, lt: thisMonth } } }),
    prisma.booking.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.booking.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: lastMonth, lt: thisMonth } },
      _sum: { amount: true },
    }),
    prisma.business.count({ where: { createdAt: { gte: thisMonth } } }),
    prisma.business.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
  ]);

  const monthOverMonth = lastMonthOrders > 0 ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 : 0;
  const yearOverYear = lastYearOrders > 0 ? ((thisMonthOrders - (lastYearOrders / 12)) / (lastYearOrders / 12)) * 100 : 0;
  const bookingMoM = lastMonthBookings > 0 ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100 : 0;
  const revenueMoM = (lastMonthRevenue._sum.amount?.toNumber() || 0) > 0
    ? (((thisMonthRevenue._sum.amount?.toNumber() || 0) - (lastMonthRevenue._sum.amount?.toNumber() || 0)) / (lastMonthRevenue._sum.amount?.toNumber() || 0)) * 100
    : 0;
  const businessMoM = lastMonthBusinesses > 0 ? ((thisMonthBusinesses - lastMonthBusinesses) / lastMonthBusinesses) * 100 : 0;

  const result = {
    orders: {
      thisMonth: thisMonthOrders,
      lastMonth: lastMonthOrders,
      monthOverMonth: Math.round(monthOverMonth * 100) / 100,
      yearOverYear: Math.round(yearOverYear * 100) / 100,
    },
    bookings: {
      thisMonth: thisMonthBookings,
      lastMonth: lastMonthBookings,
      monthOverMonth: Math.round(bookingMoM * 100) / 100,
    },
    revenue: {
      thisMonth: thisMonthRevenue._sum.amount?.toNumber() || 0,
      lastMonth: lastMonthRevenue._sum.amount?.toNumber() || 0,
      monthOverMonth: Math.round(revenueMoM * 100) / 100,
    },
    businesses: {
      thisMonth: thisMonthBusinesses,
      lastMonth: lastMonthBusinesses,
      monthOverMonth: Math.round(businessMoM * 100) / 100,
    },
  };
  setCache('platform:growth', result, 5 * 60 * 1000);
  return result;
}

export async function getPaymentTrends(): Promise<any> {
  const methodDistribution = await prisma.payment.groupBy({
    by: ['method'],
    _count: { id: true },
    _sum: { amount: true },
    orderBy: { _count: { id: 'desc' } },
  });

  const statusDistribution = await prisma.payment.groupBy({
    by: ['status'],
    _count: { id: true },
    _sum: { amount: true },
  });

  return {
    byMethod: methodDistribution.map((m) => ({
      method: m.method,
      count: m._count.id,
      total: m._sum.amount?.toNumber() || 0,
    })),
    byStatus: statusDistribution.map((s) => ({
      status: s.status,
      count: s._count.id,
      total: s._sum.amount?.toNumber() || 0,
    })),
  };
}

export async function getConsumptionTrends(): Promise<any> {
  const ordersByDay = await prisma.$queryRaw<any[]>`
    SELECT DATE_TRUNC('day', "createdAt") as day, COUNT(*) as count
    FROM "Order"
    WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day
  `;

  const bookingsByDay = await prisma.$queryRaw<any[]>`
    SELECT DATE_TRUNC('day', "createdAt") as day, COUNT(*) as count
    FROM "Booking"
    WHERE "createdAt" >= NOW() - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day
  `;

  return {
    orders: ordersByDay,
    bookings: bookingsByDay,
  };
}

export async function getBookingTrends(): Promise<any> {
  const trends = await prisma.$queryRaw<any[]>`
    SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
    FROM "Booking"
    WHERE "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY month
    ORDER BY month
  `;

  const byStatus = await prisma.booking.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return {
    monthly: trends,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
  };
}

export async function getDeliveryTrends(): Promise<any> {
  const trends = await prisma.$queryRaw<any[]>`
    SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
    FROM "Order"
    WHERE "status" = 'DELIVERED' AND "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY month
    ORDER BY month
  `;

  const byStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  return {
    monthly: trends,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.id })),
  };
}

export async function computeSectorBenchmarks(): Promise<void> {
  const sectors = await prisma.business.findMany({
    where: { isActive: true, score: { isNot: null } },
    include: { score: true },
    distinct: ['type'],
  });

  const sectorMap = new Map<string, any[]>();
  for (const s of sectors) {
    if (!s.score) continue;
    const arr = sectorMap.get(s.type) || [];
    arr.push(s.score);
    sectorMap.set(s.type, arr);
  }

  for (const [sector, scores] of sectorMap) {
    const count = scores.length;
    if (count === 0) continue;

    const totals = scores.reduce(
      (acc, s) => ({
        avgScore: acc.avgScore + s.overallScore,
        avgCommercial: acc.avgCommercial + s.commercialScore,
        avgFinancial: acc.avgFinancial + s.financialScore,
        avgSatisfaction: acc.avgSatisfaction + s.satisfactionScore,
        avgReliability: acc.avgReliability + s.reliabilityScore,
        avgProfile: acc.avgProfile + s.profileScore,
      }),
      { avgScore: 0, avgCommercial: 0, avgFinancial: 0, avgSatisfaction: 0, avgReliability: 0, avgProfile: 0 }
    );

    await prisma.sectorBenchmark.upsert({
      where: { sector },
      update: {
        avgScore: totals.avgScore / count,
        avgCommercial: totals.avgCommercial / count,
        avgFinancial: totals.avgFinancial / count,
        avgSatisfaction: totals.avgSatisfaction / count,
        avgReliability: totals.avgReliability / count,
        avgProfile: totals.avgProfile / count,
        businessCount: count,
        computedAt: new Date(),
      },
      create: {
        sector,
        avgScore: totals.avgScore / count,
        avgCommercial: totals.avgCommercial / count,
        avgFinancial: totals.avgFinancial / count,
        avgSatisfaction: totals.avgSatisfaction / count,
        avgReliability: totals.avgReliability / count,
        avgProfile: totals.avgProfile / count,
        businessCount: count,
      },
    });
  }
}

export async function generateBusinessReport(businessId: string, partnerId: string): Promise<any> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { score: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const consent = await prisma.dataConsent.findUnique({ where: { businessId } });
  if (!consent || !consent.isActive || consent.shareLevel === 'NONE') {
    throw new AppError('Business has not consented to data sharing', 403);
  }

  const partner = await prisma.dataPartner.findUnique({ where: { id: partnerId } });
  if (!partner || !partner.isActive) throw new AppError('Partner not found or inactive', 404);

  const score = business.score || {
    overallScore: 0,
    commercialScore: 0,
    financialScore: 0,
    satisfactionScore: 0,
    reliabilityScore: 0,
    profileScore: 0,
    category: 'VERY_LOW',
    totalOrders: 0,
    totalBookings: 0,
    avgRating: 0,
    reviewCount: 0,
    completionPct: 0,
  };

  const reportData = {
    businessName: business.name,
    businessType: business.type,
    location: { country: business.country, city: business.city },
    score: {
      overall: score.overallScore,
      category: score.category,
      components: {
        commercial: score.commercialScore,
        financial: score.financialScore,
        satisfaction: score.satisfactionScore,
        reliability: score.reliabilityScore,
        profile: score.profileScore,
      },
    },
    metrics: {
      totalOrders: score.totalOrders,
      totalBookings: score.totalBookings,
      avgRating: score.avgRating,
      reviewCount: score.reviewCount,
      completionPct: score.completionPct,
    },
    generatedAt: new Date(),
  };

  const report = await prisma.dataReport.create({
    data: {
      partnerId,
      type: 'SOLVABILITY',
      status: 'READY',
      title: `Rapport de solvabilité - ${business.name}`,
      description: `Rapport généré pour ${partner.name}`,
      businessId,
      data: reportData,
      summary: `${business.name} a un score de ${score.overallScore}/1000 (${score.category})`,
      price: 0,
      currency: 'FCFA',
    },
  });

  await prisma.dataAccessLog.create({
    data: {
      partnerId,
      action: 'VIEW_REPORT',
      businessId,
      reportId: report.id,
      details: { type: 'SOLVABILITY' },
    },
  });

  return report;
}

export async function generateSectorReport(sector: string): Promise<any> {
  const benchmarks = await getSectorBenchmarkForReport(sector);
  if (!benchmarks) throw new AppError('No data for this sector', 404);

  const businesses = await prisma.business.findMany({
    where: { type: sector as any, isActive: true },
    select: { id: true, name: true, city: true, country: true },
    take: 100,
  });

  const reportData = {
    sector,
    benchmarks,
    totalBusinesses: businesses.length,
    sampleBusinesses: businesses.slice(0, 20).map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city,
      country: b.country,
    })),
    generatedAt: new Date(),
  };

  const report = await prisma.dataReport.create({
    data: {
      type: 'SECTORIAL',
      status: 'READY',
      title: `Rapport sectoriel - ${sector}`,
      description: `Analyse du secteur ${sector}`,
      sector,
      data: reportData,
      summary: `Secteur ${sector}: ${businesses.length} entreprises`,
    },
  });

  return report;
}

export async function generateGeographicReport(country: string, city?: string): Promise<any> {
  const where: any = { country, isActive: true };
  if (city) where.city = city;

  const businesses = await prisma.business.findMany({
    where,
    select: { id: true, name: true, type: true, city: true },
    take: 100,
  });

  const totalRevenue = await prisma.payment.aggregate({
    where: {
      status: 'COMPLETED',
      user: { business: { is: { country } } },
    },
    _sum: { amount: true },
  });

  const reportData = {
    country,
    city: city || null,
    totalBusinesses: businesses.length,
    totalRevenue: totalRevenue._sum.amount?.toNumber() || 0,
    businesses: businesses.slice(0, 50),
    generatedAt: new Date(),
  };

  const report = await prisma.dataReport.create({
    data: {
      type: 'GEOGRAPHIC',
      status: 'READY',
      title: `Rapport géographique - ${city || country}`,
      description: `Analyse du marché ${city ? `à ${city}, ` : ''}${country}`,
      country,
      city: city || null,
      data: reportData,
      summary: `${businesses.length} entreprises en ${city || country}`,
    },
  });

  return report;
}

async function getSectorBenchmarkForReport(sector: string): Promise<any> {
  const scores = await prisma.business.findMany({
    where: { type: sector as any, isActive: true, score: { isNot: null } },
    include: { score: true },
  });

  if (scores.length === 0) return null;

  const totals = scores.reduce(
    (acc, b) => {
      if (!b.score) return acc;
      return {
        avgScore: acc.avgScore + b.score.overallScore,
        avgCommercial: acc.avgCommercial + b.score.commercialScore,
        avgFinancial: acc.avgFinancial + b.score.financialScore,
        avgSatisfaction: acc.avgSatisfaction + b.score.satisfactionScore,
        avgReliability: acc.avgReliability + b.score.reliabilityScore,
        avgProfile: acc.avgProfile + b.score.profileScore,
      };
    },
    { avgScore: 0, avgCommercial: 0, avgFinancial: 0, avgSatisfaction: 0, avgReliability: 0, avgProfile: 0 }
  );

  const count = scores.length;
  return {
    avgScore: Math.round(totals.avgScore / count),
    avgCommercial: Math.round(totals.avgCommercial / count),
    avgFinancial: Math.round(totals.avgFinancial / count),
    avgSatisfaction: Math.round(totals.avgSatisfaction / count),
    avgReliability: Math.round(totals.avgReliability / count),
    avgProfile: Math.round(totals.avgProfile / count),
    businessCount: count,
  };
}

export async function getPartnerAccessCheck(partnerId: string): Promise<boolean> {
  const sub = await prisma.partnerSubscription.findFirst({
    where: { partnerId, status: 'ACTIVE' },
  });
  return !!sub;
}

export async function getBusinessConsentCheck(businessId: string): Promise<any> {
  return prisma.dataConsent.findUnique({ where: { businessId } });
}
