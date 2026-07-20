import { Router } from 'express';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import { search, suggestions, getHistory } from '../controllers/smartSearchController';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.get('/search', cacheResponse({ prefix: 'smart-search', ttl: 30_000 }), search);
router.get(
  '/suggestions',
  cacheResponse({ prefix: 'smart-suggestions', ttl: 60_000 }),
  suggestions
);
router.get('/history', authMiddleware, getHistory);

export default router;
