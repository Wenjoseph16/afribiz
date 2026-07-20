import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { cacheResponse } from '../middlewares/cacheMiddleware';
import { getAttentionCenter, getUrgencyStatus } from '../controllers/attentionController';

const router = Router();

router.use(authMiddleware);

router.get(
  '/center',
  cacheResponse({ prefix: 'attention-center', ttl: 60_000 }),
  getAttentionCenter
);
router.get('/status', cacheResponse({ prefix: 'attention-status', ttl: 60_000 }), getUrgencyStatus);

export default router;
