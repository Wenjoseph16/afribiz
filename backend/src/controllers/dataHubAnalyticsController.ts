import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as analyticsService from '../services/dataHubAnalytics';
import * as copilotService from '../services/businessCopilot';

import { generateBusinessNotifications } from '../services/copilotNotificationService';
import { prisma } from '../lib/db';

// ── Data Hub Platform Stats ──

/** GET /datahub/auth-trends — activité d'authentification (Data Hub) */
export const getAuthTrends = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const trends = await analyticsService.getAuthTrends(days);
    res.json({ success: true, data: trends });
  }
);

export const getPlatformStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const [totalBusinesses, totalOrders, totalRevenue, avgRating, totalUsers, totalProducts] =
      await Promise.all([
        prisma.business.count({ where: { deletedAt: null } }),
        prisma.order.count(),
        prisma.order
          .aggregate({ _sum: { totalAmount: true } })
          .then((r) => Number(r._sum.totalAmount || 0)),
        prisma.business
          .aggregate({ _avg: { rating: true } })
          .then((r) => Math.round(Number(r._avg.rating || 0))),
        prisma.user.count(),
        prisma.product.count({ where: { deletedAt: null } }),
      ]);
    res.json({
      success: true,
      data: {
        totalBusinesses,
        totalOrders,
        totalRevenue,
        avgScore: avgRating,
        totalUsers,
        totalProducts,
      },
    });
  }
);

export const getSectorBenchmarks = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businesses = await prisma.business.findMany({
      where: { deletedAt: null },
      select: { type: true, rating: true, id: true },
    });
    const sectorMap = new Map<string, { scores: number[]; count: number }>();
    for (const b of businesses) {
      const key = b.type || 'AUTRE';
      if (!sectorMap.has(key)) sectorMap.set(key, { scores: [], count: 0 });
      const entry = sectorMap.get(key)!;
      entry.scores.push(b.rating || 0);
      entry.count++;
    }
    const sectors = Array.from(sectorMap.entries()).map(([sector, data]) => ({
      sector,
      businessCount: data.count,
      avgScore:
        data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
    }));
    res.json({ success: true, data: { sectors } });
  }
);

export const getGeographicStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businesses = await prisma.business.findMany({
      where: { deletedAt: null, country: { not: null } },
      select: { country: true, city: true, rating: true },
    });
    const regionMap = new Map<
      string,
      { businessCount: number; cities: Set<string>; scores: number[] }
    >();
    for (const b of businesses) {
      const country = b.country || 'Inconnu';
      if (!regionMap.has(country))
        regionMap.set(country, { businessCount: 0, cities: new Set(), scores: [] });
      const entry = regionMap.get(country)!;
      entry.businessCount++;
      if (b.city) entry.cities.add(b.city);
      if (b.rating) entry.scores.push(b.rating);
    }
    const regions = Array.from(regionMap.entries()).map(([country, data]) => ({
      country,
      businessCount: data.businessCount,
      activeCities: data.cities.size,
      avgScore:
        data.scores.length > 0
          ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
          : 0,
    }));
    res.json({ success: true, data: { regions } });
  }
);

export const getGrowthStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
  const [newBusinesses, prevBusinesses, transactions30d, transactionsPrev, totalOrders] =
    await Promise.all([
      prisma.business.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.business.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.order.count(),
    ]);
  const transactionGrowth =
    prevBusinesses > 0
      ? Math.round(((transactions30d - transactionsPrev) / transactionsPrev) * 100)
      : 0;
  const adoptionRate = totalOrders > 0 ? Math.round((transactions30d / totalOrders) * 100) : 0;
  res.json({ success: true, data: { newBusinesses, transactionGrowth, adoptionRate } });
});

export const getPaymentTrends = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const [totalPayments, successPayments, avgAmount, pendingAmount] = await Promise.all([
      prisma.payment.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.payment.count({ where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.payment
        .aggregate({ where: { status: 'COMPLETED' }, _avg: { amount: true } })
        .then((r) => Math.round(Number(r._avg.amount || 0))),
      prisma.payment
        .aggregate({ where: { status: { in: ['PENDING', 'VERIFYING'] } }, _sum: { amount: true } })
        .then((r) => Number(r._sum.amount || 0)),
    ]);
    const successRate = totalPayments > 0 ? Math.round((successPayments / totalPayments) * 100) : 0;
    res.json({ success: true, data: { totalPayments, successRate, avgAmount, pendingAmount } });
  }
);

export const listReports = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  // Les rapports partenaires seront implémentés dans une version future
  res.json({ success: true, data: { reports: [] } });
});

export const getReportDetail = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: null });
  }
);

export const orderReport = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      id: 'pending',
      status: 'PENDING',
      type: req.body.type || 'individuel',
      title: `Rapport ${req.body.type || 'standard'}`,
      createdAt: new Date().toISOString(),
    },
  });
});

export const getBusinessDetails = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const business = await prisma.business.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        country: true,
        city: true,
        logo: true,
        rating: true,
        description: true,
        isActive: true,
      },
    });
    if (!business) throw new AppError('Business non trouvé', 404);
    res.json({ success: true, data: business });
  }
);

export const getSearchTrends = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const days = parseInt(req.query.days as string) || 30;
    const trends = await analyticsService.getSearchTrends(days);
    res.json({ success: true, data: trends });
  }
);

export const getConversionFunnel = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const funnel = await analyticsService.getConversionFunnel(business.id);
    res.json({ success: true, data: funnel });
  }
);

export const getRetentionCohorts = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const cohorts = await analyticsService.getRetentionCohorts(business.id);
    res.json({ success: true, data: cohorts });
  }
);

export const getProductRecommendations = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 6;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const recommendations = await analyticsService.getProductRecommendations(business.id, limit);
    res.json({ success: true, data: recommendations });
  }
);

export const getEngagementAnalytics = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const engagement = await analyticsService.getEngagementAnalytics(business.id);
    res.json({ success: true, data: engagement });
  }
);

export const getDailyTips = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const tips = await copilotService.generateDailyTips(business.id);
  res.json({ success: true, data: tips });
});

export const triggerCopilotNotifications = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const count = await generateBusinessNotifications(business.id, business.ownerId, business.name);
    res.json({
      success: true,
      data: { generated: count, businessId: business.id, businessName: business.name },
    });
  }
);

export const getBusinessHealth = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const health = await copilotService.getBusinessHealth(business.id);
    res.json({ success: true, data: health });
  }
);

export const getModuleTips = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const moduleKey = req.params.moduleKey as string;
  if (!moduleKey) throw new AppError('moduleKey requis', 400);

  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  const tips = await copilotService.getModuleTips(business.id, moduleKey);
  res.json({ success: true, data: tips });
});

export const generateSmartTipCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { moduleKey } = req.body;
    if (!moduleKey) throw new AppError('moduleKey requis', 400);

    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);

    const tip = await copilotService.generateSmartTip(business.id, moduleKey);
    res.json({ success: true, data: tip });
  }
);

export const generateDailyBriefCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);

    const brief = await copilotService.generateDailyBriefForBusiness(business.id);
    res.json({ success: true, data: brief });
  }
);

export const generateDailyAnalysisCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);

    const [tipsData, health, brief] = await Promise.all([
      copilotService.generateDailyTips(business.id),
      copilotService.getBusinessHealth(business.id),
      copilotService.generateDailyBriefForBusiness(business.id),
    ]);

    const insights = (tipsData.tips || [])
      .filter((t: any) => t.priority === 'high')
      .map((t: any) => t.message);

    const suggestions = (tipsData.tips || [])
      .filter((t: any) => t.priority !== 'high')
      .map((t: any) => t.message);

    let riskLevel = 'low';
    if (health.status === 'critical') riskLevel = 'high';
    else if (health.status === 'fair') riskLevel = 'medium';

    res.json({
      success: true,
      data: {
        summary: brief?.brief || 'Aucune activité récente.',
        insights,
        suggestions,
        riskLevel,
        healthScore: health.healthScore,
        healthStatus: health.status,
        generatedAt: new Date().toISOString(),
      },
    });
  }
);

// Copilot extended endpoints (Phase 1)

import * as copilotBenchmark from '../services/copilotBenchmark';
import * as copilotAnomaly from '../services/copilotAnomaly';
import * as copilotSeasonal from '../services/copilotSeasonal';

export const getBenchmarksCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);

    const benchmarks = await copilotBenchmark.getPeerBenchmarks(
      business.id,
      business.type,
      business.address || undefined
    );
    res.json({ success: true, data: benchmarks });
  }
);

export const getAnomaliesCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);

    const anomalies = await copilotAnomaly.detectAnomalies(business.id);
    res.json({ success: true, data: anomalies });
  }
);

export const getSeasonalCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);

    const seasonal = await copilotSeasonal.getSeasonalOpportunities(business.id, business.type);
    res.json({ success: true, data: seasonal });
  }
);

import { generateWeeklyReport } from '../services/copilotReport';
import { scheduleOnboardingSequence } from '../services/copilotOnboarding';

export const getWeeklyReportCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);

    const report = await generateWeeklyReport(business.id);
    res.json({ success: true, data: report });
  }
);

export const triggerOnboardingCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);

    await scheduleOnboardingSequence(business.id, 'admin_manual');
    res.json({ success: true, message: "Séquence d'onboarding planifiée" });
  }
);
