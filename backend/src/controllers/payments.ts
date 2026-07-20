import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { Prisma } from '@prisma/client';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';

export const getPayments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { page = '1', limit = '20' } = req.query;
  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
  const skip = (pageNum - 1) * limitNum;

  const where: Prisma.PaymentWhereInput = { userId: req.user.id };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: { proofs: true },
    }),
    prisma.payment.count({ where }),
  ]);

  res.json(
    successResponse({
      payments,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  );
});

export const getPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { proofs: true },
  });
  if (!payment) {
    throw new AppError('Paiement introuvable', 404);
  }
  res.json(successResponse({ payment }));
});

export const getWallet = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const [completedPayments, refundedPayments] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: req.user.id, status: 'COMPLETED' },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: { userId: req.user.id, status: 'REFUNDED' },
      select: { amount: true },
    }),
  ]);
  const totalPaid = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalRefunded = refundedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const netBalance = totalPaid - totalRefunded;
  const cashbackRate = 2;
  const cashback = Math.max(0, Math.round((netBalance * cashbackRate) / 100));
  res.json(
    successResponse({
      balance: netBalance,
      totalPaid,
      totalRefunded,
      cashback,
      currency: 'FCFA',
      cashbackRate,
    })
  );
});

export const addPaymentProof = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { paymentId } = req.params;
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: req.user.id },
    });
    if (!payment) {
      throw new AppError('Paiement introuvable', 404);
    }

    const { imageUrl, notes } = req.body;
    const proof = await prisma.paymentProof.create({
      data: { paymentId, imageUrl, notes },
    });
    res.status(201).json(successResponse({ proof }, 'Preuve de paiement ajoutée'));
  }
);
