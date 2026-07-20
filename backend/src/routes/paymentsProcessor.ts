import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { initiatePayment, listTransactions } from '../controllers/paymentsProcessor';

const router = Router();
router.use(authMiddleware, requireRole(['BUSINESS', 'ADMIN']));

router.post('/initiate', initiatePayment);
router.get('/transactions', listTransactions);

export default router;
