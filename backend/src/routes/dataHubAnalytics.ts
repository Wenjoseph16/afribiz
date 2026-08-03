import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import * as analyticsController from '../controllers/dataHubAnalyticsController';
import * as analyticsEventsController from '../controllers/analyticsEventsController';

const router = Router();

router.use(authMiddleware);

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
  cacheResponse({ prefix: 'copilot-daily-tips', ttl: 3600_000 }),
  analyticsController.getDailyTips
);
router.get(
  '/copilot/business-health',
  cacheResponse({ prefix: 'copilot-business-health', ttl: 300_000 }),
  analyticsController.getBusinessHealth
);
router.post('/copilot/check-and-notify', analyticsController.triggerCopilotNotifications);
router.get('/copilot/module/:moduleKey/tips', analyticsController.getModuleTips);

// ── Data Hub Routes ──

router.get('/datahub/stats', analyticsController.getPlatformStats);
router.get('/datahub/sectors', analyticsController.getSectorBenchmarks);
router.get('/datahub/geographic', analyticsController.getGeographicStats);
router.get('/datahub/growth', analyticsController.getGrowthStats);
router.get('/datahub/payments', analyticsController.getPaymentTrends);
router.get('/datahub/reports', analyticsController.listReports);
router.get('/datahub/reports/:id', analyticsController.getReportDetail);
router.post('/datahub/reports/order', analyticsController.orderReport);
router.get('/datahub/businesses/:id', analyticsController.getBusinessDetails);

// Rule-based Copilot endpoints
router.post('/copilot/smart-tip', analyticsController.generateSmartTipCtrl);
router.get('/copilot/daily-brief', analyticsController.generateDailyBriefCtrl);
router.post('/copilot/analyze', analyticsController.generateDailyAnalysisCtrl);
router.get('/copilot/benchmarks', analyticsController.getBenchmarksCtrl);
router.get('/copilot/anomalies', analyticsController.getAnomaliesCtrl);
router.get('/copilot/seasonal', analyticsController.getSeasonalCtrl);
router.get('/copilot/weekly-report', analyticsController.getWeeklyReportCtrl);
router.post('/copilot/onboarding/trigger', analyticsController.triggerOnboardingCtrl);

export default router;
