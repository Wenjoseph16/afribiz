import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as ctrl from '../controllers/agentNetworkController';

const router = Router();
router.use(authMiddleware, requireRole(['BUSINESS', 'ADMIN']));

router.get('/', ctrl.list);
router.get('/stats', ctrl.stats);
router.get('/transactions', ctrl.listTransactions);
router.get('/:id', ctrl.get);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/transactions', ctrl.recordTransaction);

export default router;
