import { Router } from 'express';
import { authMiddleware, requireEmployeePermission } from '../middlewares/auth';
import { initiatePayment, listTransactions } from '../controllers/paymentsProcessor';
import { demoConfirmPayment, demoListTransactions } from '../controllers/paymentDemoController';

const router = Router();
router.use(authMiddleware, requireEmployeePermission(['ACCESS_FINANCES']));

router.post('/initiate', initiatePayment);
router.get('/transactions', listTransactions);

// ── Démo paiement (sans clé FedaPay) : confirme une transaction sim_ en rejouant
// le webhook FedaPay de production (transaction → paiement → commande → caisse) ──
router.post('/demo/confirm', demoConfirmPayment);
router.get('/demo/transactions', demoListTransactions);

export default router;
