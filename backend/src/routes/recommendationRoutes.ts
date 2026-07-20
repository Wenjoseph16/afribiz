import { Router } from 'express';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import { getRecommendations } from '../controllers/recommendationController';

const router = Router();

router.get('/', cacheResponse({ prefix: 'recommendations', ttl: 60_000 }), getRecommendations);

export default router;
