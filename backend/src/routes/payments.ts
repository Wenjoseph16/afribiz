import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { z } from 'zod';
import { getPayments, getPayment, getWallet, addPaymentProof } from '../controllers/payments';
import { listClientEscrows, clientReleaseEscrow, clientDisputeEscrow, listClientDebts, clientPayDebt } from '../controllers/debtsPayments';

const router = Router();

router.use(authMiddleware);

router.get('/', getPayments);
router.get('/wallet', getWallet);
router.get('/escrow/client', listClientEscrows);
router.post('/escrow/client/:id/confirm', clientReleaseEscrow);
router.post('/escrow/client/:id/dispute', validateBody(z.object({ reason: z.string().min(1, 'Motif requis') })), clientDisputeEscrow);
router.get('/debts/client', listClientDebts);
router.post('/debts/client/:id/pay', validateBody(z.object({ amount: z.number().positive('Montant invalide'), paymentMethod: z.string().optional(), notes: z.string().optional() })), clientPayDebt);
router.get('/:id', getPayment);
router.post('/:paymentId/proof', addPaymentProof);

export default router;
