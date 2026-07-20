import { Router } from 'express';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import { getFeed, getTrendingFeed } from '../controllers/feedController';

const router = Router();

router.get('/', cacheResponse({ prefix: 'feed', ttl: 30_000 }), getFeed);
router.get('/trending', cacheResponse({ prefix: 'feed-trending', ttl: 60_000 }), getTrendingFeed);

export default router;
