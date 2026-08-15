import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as ctrl from '../controllers/offlineSyncController';

const router = Router();
router.use(authMiddleware);

// Contrat frontend : /items, /items/:id/process, /pending-count, /bulk
// (alias / et /:id/process gardés pour compatibilité)
router.get('/items', ctrl.list);
router.get('/', ctrl.list);
router.get('/pending-count', ctrl.pendingCount);
router.post('/items', ctrl.create);
router.post('/', ctrl.create);
router.post('/items/:id/process', ctrl.process);
router.put('/:id/process', ctrl.process);
router.post('/bulk', ctrl.bulkSync);

export default router;
