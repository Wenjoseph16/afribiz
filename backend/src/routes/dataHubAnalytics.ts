import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middlewares/auth';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { prisma } from '../lib/db';
import { assertCopilotAccess } from '../services/planAccessService';
import * as analyticsController from '../controllers/dataHubAnalyticsController';
import * as analyticsEventsController from '../controllers/analyticsEventsController';

const router = Router();

router.use(authMiddleware);

/**
 * Garde Copilot IA : vérifie que le business du user a le privilège COPILOT_ACCESS.
 * (Option Premium 3 000 FCFA/mois — plans Gratuit/AfriBiz sans copilot refusés.)
 */
const copilotGuard = catchAsyncErrors(async (req: AuthenticatedRequest, _res: any, next: any) => {
  const business = await prisma.business.findUnique({
    where: { ownerId: req.user!.id },
    select: { id: true },
  });
  if (!business) throw new AppError('Aucun business associé à ce compte', 404);
  await assertCopilotAccess(business.id);
  next();
});

// ── Analytics Event Feed (flux temps réel AnalyticsEvent) ──
// Placées AVANT toute route /:id pour ne jamais être capturées.

router.get('/analytics/events', analyticsEventsController.getEventsFeed);
router.get('/analytics/events/breakdown/category', analyticsEventsController.getEventsByCategory);
router.get('/analytics/events/breakdown', analyticsEventsController.getEventsByType);
router.get('/analytics/events/summary', analyticsEventsController.getEventsSummary);
router.get('/analytics/events/counters', analyticsEventsController.getEventsCounters);

router.get(
  '/analytics/search-trends',
  cacheResponse({ prefix: 'analytics-search-trends', ttl: 300_000 }),
  analyticsController.getSearchTrends
);
router.get(
  '/analytics/conversion-funnel',
  cacheResponse({ prefix: 'analytics-conversion-funnel', ttl: 300_000 }),
  analyticsController.getConversionFunnel
);
router.get(
  '/analytics/retention-cohorts',
  cacheResponse({ prefix: 'analytics-retention-cohorts', ttl: 3600_000 }),
  analyticsController.getRetentionCohorts
);
router.get(
  '/analytics/product-recommendations',
  cacheResponse({ prefix: 'analytics-product-recommendations', ttl: 300_000 }),
  analyticsController.getProductRecommendations
);
router.get(
  '/analytics/engagement',
  cacheResponse({ prefix: 'analytics-engagement', ttl: 300_000 }),
  analyticsController.getEngagementAnalytics
);
router.get(
  '/copilot/daily-tips',
  copilotGuard,
  cacheResponse({ prefix: 'copilot-daily-tips', ttl: 3600_000 }),
  analyticsController.getDailyTips
);
router.get(
  '/copilot/business-health',
  copilotGuard,
  cacheResponse({ prefix: 'copilot-business-health', ttl: 300_000 }),
  analyticsController.getBusinessHealth
);
router.post('/copilot/check-and-notify', copilotGuard, analyticsController.triggerCopilotNotifications);
router.get('/copilot/module/:moduleKey/tips', copilotGuard, analyticsController.getModuleTips);

// ── Data Hub Routes ──

router.get('/datahub/stats', analyticsController.getPlatformStats);
router.get('/datahub/auth-trends', analyticsController.getAuthTrends);
router.get('/datahub/sectors', analyticsController.getSectorBenchmarks);
router.get('/datahub/geographic', analyticsController.getGeographicStats);
router.get('/datahub/growth', analyticsController.getGrowthStats);
router.get('/datahub/payments', analyticsController.getPaymentTrends);
router.get('/datahub/reports', analyticsController.listReports);
router.get('/datahub/reports/:id', analyticsController.getReportDetail);
router.post('/datahub/reports/order', analyticsController.orderReport);
router.get('/datahub/businesses/:id', analyticsController.getBusinessDetails);

// Rule-based Copilot endpoints (tous protégés par la garde Copilot IA)
router.post('/copilot/smart-tip', copilotGuard, analyticsController.generateSmartTipCtrl);
router.get('/copilot/daily-brief', copilotGuard, analyticsController.generateDailyBriefCtrl);
router.post('/copilot/analyze', copilotGuard, analyticsController.generateDailyAnalysisCtrl);
router.get('/copilot/benchmarks', copilotGuard, analyticsController.getBenchmarksCtrl);
router.get('/copilot/anomalies', copilotGuard, analyticsController.getAnomaliesCtrl);
router.get('/copilot/seasonal', copilotGuard, analyticsController.getSeasonalCtrl);
router.get('/copilot/weekly-report', copilotGuard, analyticsController.getWeeklyReportCtrl);
router.post('/copilot/onboarding/trigger', copilotGuard, analyticsController.triggerOnboardingCtrl);

export default router;
