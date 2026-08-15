import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import * as ctrl from '../controllers/cashController';

const router = Router();

router.use(authMiddleware);
router.use(requireRole(['BUSINESS', 'ADMIN']));

router.get('/widget', ctrl.getCashWidget);
router.get('/today', ctrl.getTodayCashSession);
router.get('/history', ctrl.getCashHistory);
router.post('/open', ctrl.openCashSession);
router.post('/movement', ctrl.addCashMovement);
router.post('/close', ctrl.closeCashSession);

export default router;
