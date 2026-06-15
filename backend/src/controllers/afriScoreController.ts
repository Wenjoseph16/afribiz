import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import { PartnerRequest } from '../middlewares/partnerAuth';
import * as afriScoreService from '../services/afriScoreService';
import * as afriDataHubService from '../services/afriDataHubService';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

// ============ PUBLIC (BUSINESS) ============

export const getMyScore = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  const score = await afriScoreService.computeBusinessScore(business.id);
  res.json({ success: true, data: score });
});

export const getMyScoreHistory = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  const period = req.query.period as string | undefined;
  const history = await afriScoreService.getScoreHistory(business.id, period);
  res.json({ success: true, data: history });
});

export const getMyBadges = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  const badges = await afriScoreService.getBadges(business.id);
  res.json({ success: true, data: badges });
});

export const getMyBenchmark = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  const myScore = await prisma.businessScore.findUnique({ where: { businessId: business.id } });
  const benchmark = await afriScoreService.getSectorBenchmark(business.type);

  res.json({
    success: true,
    data: {
      myScore: myScore ? { overall: myScore.overallScore, category: myScore.category } : null,
      benchmark,
    },
  });
});

// ============ PUBLIC (ANY AUTH) ============

export const getPublicScore = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId } = req.params;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, slug: true, type: true, logo: true, city: true, country: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const score = await prisma.businessScore.findUnique({
    where: { businessId },
    select: {
      overallScore: true,
      category: true,
      commercialScore: true,
      financialScore: true,
      satisfactionScore: true,
      reliabilityScore: true,
      profileScore: true,
      totalOrders: true,
      totalBookings: true,
      avgRating: true,
      reviewCount: true,
      completionPct: true,
    },
  });

  const badges = await afriScoreService.getBadges(businessId);

  res.json({
    success: true,
    data: {
      business,
      score: score || {
        overallScore: 0, category: 'VERY_LOW', commercialScore: 0, financialScore: 0,
        satisfactionScore: 0, reliabilityScore: 0, profileScore: 0,
        totalOrders: 0, totalBookings: 0, avgRating: 0, reviewCount: 0, completionPct: 0,
      },
      badges,
    },
  });
});

// ============ PARTNER API ============

export const partnerGetBusinessScore = catchAsyncErrors(async (req: PartnerRequest, res: Response) => {
  const { businessId } = req.params;
  const partnerId = req.partner!.id;

  const consent = await afriDataHubService.getBusinessConsentCheck(businessId);
  if (!consent || !consent.isActive || consent.shareLevel === 'NONE') {
    throw new AppError('Business has not consented to data sharing', 403);
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, type: true, country: true, city: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const score = await prisma.businessScore.findUnique({
    where: { businessId },
    select: {
      overallScore: true, category: true, commercialScore: true, financialScore: true,
      satisfactionScore: true, reliabilityScore: true, profileScore: true,
      totalOrders: true, totalBookings: true, avgRating: true, reviewCount: true,
    },
  });

  await prisma.dataAccessLog.create({
    data: { partnerId, action: 'VIEW_SCORE', businessId, details: { score: score?.overallScore } },
  });

  res.json({
    success: true,
    data: {
      business: { id: business.id, name: business.name, type: business.type },
      score: score || { overallScore: 0, category: 'VERY_LOW' },
    },
  });
});

export const partnerGenerateReport = catchAsyncErrors(async (req: PartnerRequest, res: Response) => {
  const { businessId } = req.params;
  const partnerId = req.partner!.id;

  const report = await afriDataHubService.generateBusinessReport(businessId, partnerId);
  res.status(201).json({ success: true, data: report });
});

export const partnerGetSectorReport = catchAsyncErrors(async (req: PartnerRequest, res: Response) => {
  const { sector } = req.params;
  const report = await afriDataHubService.generateSectorReport(sector);
  res.json({ success: true, data: report });
});

// ============ DATA HUB ============

export const getHubOverview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await afriDataHubService.getPlatformStats();
  res.json({ success: true, data: stats });
});

export const getHubSectors = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await afriDataHubService.getSectorStats();
  res.json({ success: true, data: stats });
});

export const getHubGeographic = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const stats = await afriDataHubService.getGeographicStats();
  res.json({ success: true, data: stats });
});

export const getHubTrends = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const [growth, consumption, booking, delivery] = await Promise.all([
    afriDataHubService.getGrowthStats(),
    afriDataHubService.getConsumptionTrends(),
    afriDataHubService.getBookingTrends(),
    afriDataHubService.getDeliveryTrends(),
  ]);

  res.json({
    success: true,
    data: { growth, consumption, booking, delivery },
  });
});

export const getHubPayments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const trends = await afriDataHubService.getPaymentTrends();
  res.json({ success: true, data: trends });
});

// ============ ADMIN ============

export const adminListPartners = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const partners = await prisma.dataPartner.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { subscriptions: true, reports: true } } },
  });
  res.json({ success: true, data: partners });
});

export const adminCreatePartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  const apiKey = `apk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

  const partner = await prisma.dataPartner.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type,
      email: data.email,
      phone: data.phone,
      website: data.website,
      logo: data.logo,
      description: data.description,
      apiKey,
      apiEnabled: data.apiEnabled || false,
      apiQuota: data.apiQuota || 1000,
      isActive: true,
    },
  });

  res.status(201).json({ success: true, data: partner });
});

export const adminUpdatePartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const partner = await prisma.dataPartner.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name : undefined,
      slug: data.slug !== undefined ? data.slug : undefined,
      type: data.type !== undefined ? data.type : undefined,
      email: data.email !== undefined ? data.email : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      website: data.website !== undefined ? data.website : undefined,
      logo: data.logo !== undefined ? data.logo : undefined,
      description: data.description !== undefined ? data.description : undefined,
      apiEnabled: data.apiEnabled !== undefined ? data.apiEnabled : undefined,
      apiQuota: data.apiQuota !== undefined ? data.apiQuota : undefined,
      isActive: data.isActive !== undefined ? data.isActive : undefined,
    },
  });

  res.json({ success: true, data: partner });
});

export const adminDeactivatePartner = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const partner = await prisma.dataPartner.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({ success: true, data: partner });
});

export const adminListReports = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    prisma.dataReport.findMany({
      skip,
      take: limit,
      include: { partner: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dataReport.count(),
  ]);

  res.json({
    success: true,
    data: { data: reports, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const adminAccessLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.dataAccessLog.findMany({
      skip,
      take: limit,
      include: {
        partner: { select: { id: true, name: true, slug: true } },
        business: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dataAccessLog.count(),
  ]);

  res.json({
    success: true,
    data: { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const adminSubscriptions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const subscriptions = await prisma.partnerSubscription.findMany({
    include: { partner: { select: { id: true, name: true, slug: true, type: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: subscriptions });
});

export const adminRecompute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const count = await afriScoreService.recomputeAllScores();
  await afriDataHubService.computeSectorBenchmarks();
  res.json({ success: true, message: `Scores recalculés pour ${count} entreprises` });
});

export const adminRevenue = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const [reports, partners] = await Promise.all([
    prisma.dataReport.findMany({
      where: { isPaid: true },
      select: { price: true, createdAt: true },
    }),
    prisma.partnerSubscription.findMany({
      where: { status: 'ACTIVE' },
      select: { price: true, plan: true },
    }),
  ]);

  const reportRevenue = reports.reduce((sum, r) => sum + (r.price?.toNumber() || 0), 0);
  const subscriptionRevenue = partners.reduce((sum, s) => sum + (s.price?.toNumber() || 0), 0);

  res.json({
    success: true,
    data: {
      reportRevenue,
      subscriptionRevenue,
      totalRevenue: reportRevenue + subscriptionRevenue,
      totalReports: reports.length,
      totalSubscriptions: partners.length,
      currency: 'FCFA',
    },
  });
});

export const recomputeMyScore = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  const score = await afriScoreService.computeBusinessScore(business.id);
  res.json({ success: true, data: score, message: 'Score recalculé avec succès' });
});

export const deleteConsent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  await prisma.dataConsent.deleteMany({ where: { businessId: business.id } });
  res.json({ success: true, message: 'Consentement révoqué avec succès' });
});

// ============ CONSENT ============

export const getConsent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  let consent = await prisma.dataConsent.findUnique({ where: { businessId: business.id } });
  if (!consent) {
    consent = await prisma.dataConsent.create({
      data: { businessId: business.id },
    });
  }

  res.json({ success: true, data: consent });
});

export const updateConsent = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);

  const { shareLevel, allowsBanks, allowsInsurance, allowsInvestors, allowsPublic, allowsAll, isActive } = req.body;

  const consent = await prisma.dataConsent.upsert({
    where: { businessId: business.id },
    update: {
      ...(shareLevel !== undefined && { shareLevel }),
      ...(allowsBanks !== undefined && { allowsBanks }),
      ...(allowsInsurance !== undefined && { allowsInsurance }),
      ...(allowsInvestors !== undefined && { allowsInvestors }),
      ...(allowsPublic !== undefined && { allowsPublic }),
      ...(allowsAll !== undefined && { allowsAll }),
      ...(isActive !== undefined && { isActive }),
      ...(isActive === false && { revocationDate: new Date() }),
    },
    create: {
      businessId: business.id,
      shareLevel: shareLevel || 'NONE',
      allowsBanks: allowsBanks || false,
      allowsInsurance: allowsInsurance || false,
      allowsInvestors: allowsInvestors || false,
      allowsPublic: allowsPublic || false,
      allowsAll: allowsAll || false,
    },
  });

  res.json({ success: true, data: consent });
});
