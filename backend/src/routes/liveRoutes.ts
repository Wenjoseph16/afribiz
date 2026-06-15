import { Router } from 'express';
import { authMiddleware, optionalAuth, requireRole } from '../middlewares/auth';
import {
  getActiveLives, getLiveById, createLive, startLive, endLive,
  updateLiveStatus, deleteLive, addLiveProduct, updateLiveProduct,
  removeLiveProduct, getLiveChats, getLiveStats,
} from '../controllers/liveController';

const router = Router();

// Routes publiques
router.get('/lives', getActiveLives);
router.get('/lives/:id', optionalAuth, getLiveById);
router.get('/lives/:id/chats', getLiveChats);

// Routes authentifiées (BUSINESS, DEVELOPER ou ADMIN)
router.post('/lives', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), createLive);
router.post('/lives/:id/start', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), startLive);
router.post('/lives/:id/end', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), endLive);
router.patch('/lives/:id/status', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), updateLiveStatus);
router.delete('/lives/:id', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), deleteLive);
router.post('/lives/:id/products', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), addLiveProduct);
router.put('/lives/:liveId/products/:productId', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), updateLiveProduct);
router.delete('/lives/:liveId/products/:productId', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), removeLiveProduct);
router.get('/lives/stats', authMiddleware, requireRole(['BUSINESS', 'DEVELOPER', 'ADMIN']), getLiveStats);

export default router;
