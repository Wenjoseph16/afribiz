import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { AppError } from './errorHandler';
import { prisma } from '../lib/db';
import { VERIFICATION_LIMITS } from '../config/verificationLimits';

export async function checkTransactionLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const amount = req.body.amount || req.body.total || 0;
  if (!amount) return next();

  const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
    select: { verificationLevel: true },
  });

  if (!business) throw new AppError('Business introuvable', 404);

  const limits = VERIFICATION_LIMITS[business.verificationLevel];
  if (limits.maxTransactionAmount && amount > limits.maxTransactionAmount) {
    throw new AppError(
      `Transaction limitée à ${limits.maxTransactionAmount.toLocaleString('fr-FR')} FCFA pour votre niveau (${business.verificationLevel}). Passez au niveau Or pour augmenter cette limite.`,
      403
    );
  }

  next();
}

export async function checkDailyTransactionLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
    select: { verificationLevel: true },
  });

  if (!business) throw new AppError('Business introuvable', 404);

  const limits = VERIFICATION_LIMITS[business.verificationLevel];
  if (!limits.maxDailyTransactions) return next();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await prisma.order.count({
    where: {
      business: { ownerId: req.user.id },
      createdAt: { gte: today },
    },
  });

  if (count >= limits.maxDailyTransactions) {
    throw new AppError(
      `Limite de ${limits.maxDailyTransactions} transactions par jour atteinte pour votre niveau (${business.verificationLevel}). Revenez demain ou passez au niveau Or.`,
      403
    );
  }

  next();
}
