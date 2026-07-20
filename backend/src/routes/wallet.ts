import { Router } from 'express';
import { authMiddleware, requireRole } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { z } from 'zod';
import * as walletService from '../services/wallet';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authMiddleware, requireRole(['CLIENT', 'BUSINESS', 'ADMIN']));

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

import { prisma } from '../lib/db';

async function getBusinessIdFromUser(userId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Aucun business trouvé pour cet utilisateur', 404);
  return business.id;
}

router.get(
  '/',
  catchAsyncErrors(async (req: any, res) => {
    const businessId = await getBusinessIdFromUser(req.user!.id);
    const balance = await walletService.getBalance(businessId);
    res.json({ success: true, data: balance });
  })
);

router.post(
  '/deposit',
  validateBody(depositSchema),
  catchAsyncErrors(async (req: any, res) => {
    const businessId = await getBusinessIdFromUser(req.user!.id);
    const tx = await walletService.deposit(businessId, req.body);
    res.json({ success: true, data: tx, message: 'Dépôt effectué' });
  })
);

router.post(
  '/withdraw',
  validateBody(withdrawSchema),
  catchAsyncErrors(async (req: any, res) => {
    const businessId = await getBusinessIdFromUser(req.user!.id);
    const tx = await walletService.withdraw(businessId, req.body);
    res.json({ success: true, data: tx, message: 'Retrait effectué' });
  })
);

router.get(
  '/transactions',
  catchAsyncErrors(async (req: any, res) => {
    const businessId = await getBusinessIdFromUser(req.user!.id);
    const data = await walletService.listTransactions(businessId, req.query);
    res.json({ success: true, data });
  })
);

export default router;
