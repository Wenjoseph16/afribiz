import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import * as ctrl from '../controllers/offlineSyncController';

const router = Router();
router.use(authMiddleware);

router.get('/', ctrl.list);
router.get('/pending-count', ctrl.pendingCount);
router.post('/', ctrl.create);
router.post('/bulk', ctrl.bulkSync);
router.put('/:id/process', ctrl.process);

export default router;
