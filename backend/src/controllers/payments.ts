import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { Prisma } from '@prisma/client';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { publishPaymentReceived, publishPaymentFailed, publishPaymentReminder, publishRefundProcessed } from '../events/publishers';

export const getPayments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
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

  res.json(successResponse({
    payments,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  }));
});

export const getPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const payment = await prisma.payment.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { proofs: true },
  });
  if (!payment) { res.status(404).json({ success: false, error: 'Paiement introuvable' }); return; }
  res.json(successResponse({ payment }));
});

export const getWallet = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const payments = await prisma.payment.findMany({
    where: { userId: req.user.id, status: 'COMPLETED' },
  });
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  // Cashback : 2% du total des paiements complétés
  const cashback = Math.round(totalPaid * 0.02);
  res.json(successResponse({
    balance: totalPaid,
    cashback,
    currency: 'FCFA',
    cashbackRate: 2,
  }));
});

export const addPaymentProof = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { paymentId } = req.params;
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: req.user.id },
  });
  if (!payment) { res.status(404).json({ success: false, error: 'Paiement introuvable' }); return; }

  const { imageUrl, notes } = req.body;
  const proof = await prisma.paymentProof.create({
    data: { paymentId, imageUrl, notes },
  });
  res.status(201).json(successResponse({ proof }, 'Preuve de paiement ajoutée'));
});
