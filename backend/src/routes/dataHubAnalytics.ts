import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as analyticsController from '../controllers/dataHubAnalyticsController';

const router = Router();

router.use(authMiddleware);

router.get('/analytics/search-trends', analyticsController.getSearchTrends);
router.get('/analytics/conversion-funnel', analyticsController.getConversionFunnel);
router.get('/analytics/retention-cohorts', analyticsController.getRetentionCohorts);
router.get('/analytics/product-recommendations', analyticsController.getProductRecommendations);
router.get('/analytics/engagement', analyticsController.getEngagementAnalytics);
router.get('/copilot/daily-tips', analyticsController.getDailyTips);
router.get('/copilot/business-health', analyticsController.getBusinessHealth);
router.post('/copilot/check-and-notify', analyticsController.triggerCopilotNotifications);

export default router;
