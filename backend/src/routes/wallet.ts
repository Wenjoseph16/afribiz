import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { z } from 'zod';
import * as walletService from '../services/wallet';
import { catchAsyncErrors } from '../middlewares/errorHandler';

const router = Router();
router.use(authMiddleware);

const depositSchema = z.object({
  amount: z.number().positive(),
  reference: z.string().optional(),
  description: z.string().optional(),
});

const withdrawSchema = z.object({
  amount: z.number().positive(),
  reference: z.string().optional(),
  description: z.string().optional(),
});

router.get('/', catchAsyncErrors(async (req: any, res) => {
  const balance = await walletService.getBalance(req.user!.id);
  res.json({ success: true, data: balance });
}));

router.post('/deposit', validateBody(depositSchema), catchAsyncErrors(async (req: any, res) => {
  const tx = await walletService.deposit(req.user!.id, req.body);
  res.json({ success: true, data: tx, message: 'Dépôt effectué' });
}));

router.post('/withdraw', validateBody(withdrawSchema), catchAsyncErrors(async (req: any, res) => {
  const tx = await walletService.withdraw(req.user!.id, req.body);
  res.json({ success: true, data: tx, message: 'Retrait effectué' });
}));

router.get('/transactions', catchAsyncErrors(async (req: any, res) => {
  const data = await walletService.listTransactions(req.user!.id, req.query);
  res.json({ success: true, data });
}));

export default router;
