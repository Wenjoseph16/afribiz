import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import {
  getOpportunityFeed,
  detectOpportunities,
  updateOpportunityStatus,
  getPublicFeed,
} from '../controllers/opportunityController';

const router = Router();

router.get('/public', cacheResponse({ prefix: 'opportunity-public', ttl: 60_000 }), getPublicFeed);
router.use(authMiddleware);
router.get('/feed', cacheResponse({ prefix: 'opportunity-feed', ttl: 60_000 }), getOpportunityFeed);
router.post('/detect', detectOpportunities);
router.patch('/:id/status', updateOpportunityStatus);

export default router;
