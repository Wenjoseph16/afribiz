import { Router } from 'express';
import { authMiddleware, requireEmployeePermission } from '../middlewares/auth';
import { validateBody } from '../middlewares/validators';
import { z } from 'zod';
import * as walletService from '../services/wallet';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';

const router = Router();
router.use(authMiddleware, requireEmployeePermission(['ACCESS_FINANCES']));

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

async function getBusinessIdFromUser(userId: string, optional = false) {
  const business = await prisma.business.findFirst({
    where: { ownerId: userId, deletedAt: null },
    select: { id: true },
  });
  if (!business) {
    if (optional) return null;
    throw new AppError('Aucun business trouvé pour cet utilisateur', 404);
  }
  return business.id;
}

router.get(
  '/',
  catchAsyncErrors(async (req: any, res) => {
    // Lecture tolérante : un client (sans business) reçoit un solde à zéro,
    // jamais un 404 — la lecture du wallet ne casse jamais une page.
    const businessId = await getBusinessIdFromUser(req.user!.id, true);
    if (!businessId) {
      res.json({
        success: true,
        data: { balance: 0, locked: 0, available: 0, currency: 'FCFA' },
      });
      return;
    }
    const balance = await walletService.getBalance(businessId);
    res.json({ success: true, data: balance });
  })
);

router.post(
  '/deposit',
  validateBody(depositSchema),
  catchAsyncErrors(async (req: any, res) => {
    const businessId = (await getBusinessIdFromUser(req.user!.id))!;
    const tx = await walletService.deposit(businessId, req.body);
    res.json({ success: true, data: tx, message: 'Dépôt effectué' });
  })
);

router.post(
  '/withdraw',
  validateBody(withdrawSchema),
  catchAsyncErrors(async (req: any, res) => {
    const businessId = (await getBusinessIdFromUser(req.user!.id))!;
    const tx = await walletService.withdraw(businessId, req.body);
    res.json({ success: true, data: tx, message: 'Retrait effectué' });
  })
);

router.get(
  '/transactions',
  catchAsyncErrors(async (req: any, res) => {
    const businessId = await getBusinessIdFromUser(req.user!.id, true);
    if (!businessId) {
      res.json({
        success: true,
        data: { transactions: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      });
      return;
    }
    const data = await walletService.listTransactions(businessId, req.query);
    res.json({ success: true, data });
  })
);

export default router;
