import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import {
  getMorningBrief,
  getEveningSummary,
  generateBriefNow,
  getCalendarInsights,
  getRecentBriefs,
} from '../controllers/growthEngineController';

const router = Router();

router.use(authMiddleware);

router.get('/brief', cacheResponse({ prefix: 'growth-brief', ttl: 120_000 }), getMorningBrief);
router.get(
  '/summary',
  cacheResponse({ prefix: 'growth-summary', ttl: 120_000 }),
  getEveningSummary
);
router.post('/generate', generateBriefNow);
router.get(
  '/calendar',
  cacheResponse({ prefix: 'growth-calendar', ttl: 60_000 }),
  getCalendarInsights
);
router.get('/history', cacheResponse({ prefix: 'growth-history', ttl: 60_000 }), getRecentBriefs);

export default router;
