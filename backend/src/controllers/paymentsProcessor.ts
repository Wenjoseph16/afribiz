import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as paymentProc from '../services/paymentProcessor';

export const initiatePayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const { provider, amount, phone, paymentMethodId, orderId, currency } = req.body;
  
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id }, select: { id: true } });
  if (!business) throw new AppError('Business non trouvé', 404);

  let result;
  if (provider === 'STRIPE') {
    result = await paymentProc.processStripePayment(amount, currency || 'FCFA', paymentMethodId, `Paiement ${orderId || ''}`);
  } else {
    result = await paymentProc.processMobileMoney(provider, phone, amount);
  }

  const transaction = await paymentProc.saveTransaction({
    businessId: business.id,
    userId: req.user.id,
    orderId,
    amount,
    currency: currency || 'FCFA',
    provider,
    providerRef: result.providerRef,
    status: result.status,
    fee: result.fee || 0,
  });

  res.json({ success: true, data: { transaction, ...result } });
});

export const listTransactions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id }, select: { id: true } });
  if (!business) throw new AppError('Business non trouvé', 404);

  const { page = 1, limit = 20, provider, status } = req.query;
  const where: any = { businessId: business.id };
  if (provider) where.provider = provider;
  if (status) where.status = status;

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  res.json({ success: true, data: { transactions, total, page: Number(page), limit: Number(limit) } });
});
