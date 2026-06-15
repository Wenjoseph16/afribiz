import { Router } from 'express';
import { search, trending, stats, similar, activeAds } from '../controllers/marketplace';
import { cacheResponse } from '../middlewares/cacheMiddleware';

const router = Router();

router.get('/search', cacheResponse({ prefix: 'marketplace', ttl: 30_000 }), search);
router.get('/trending', cacheResponse({ prefix: 'marketplace', ttl: 300_000 }), trending);
router.get('/stats', cacheResponse({ prefix: 'marketplace', ttl: 300_000 }), stats);
router.get('/similar/:id', cacheResponse({ prefix: 'marketplace', ttl: 60_000 }), similar);
router.get('/ads', cacheResponse({ prefix: 'marketplace-ads', ttl: 60_000 }), activeAds);

export default router;
