import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as ctrl from '../controllers/voiceCatalogueController';

const router = Router();

// Public routes
router.get('/commands', ctrl.listCommands);

// Protected routes
router.post('/commands', authMiddleware, requireRole(['BUSINESS', 'ADMIN']), ctrl.createCommand);
router.put('/commands/:id', authMiddleware, requireRole(['BUSINESS', 'ADMIN']), ctrl.updateCommand);
router.delete(
  '/commands/:id',
  authMiddleware,
  requireRole(['BUSINESS', 'ADMIN']),
  ctrl.deleteCommand
);
router.get('/queries', authMiddleware, requireRole(['BUSINESS', 'ADMIN']), ctrl.listQueries);
router.post('/queries', authMiddleware, requireRole(['BUSINESS', 'ADMIN']), ctrl.createQuery);
router.get('/stats', authMiddleware, requireRole(['BUSINESS', 'ADMIN']), ctrl.stats);

export default router;
