import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { initiatePayment, listTransactions } from '../controllers/paymentsProcessor';

const router = Router();
router.use(authMiddleware);

router.post('/initiate', initiatePayment);
router.get('/transactions', listTransactions);

export default router;
