import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import { logger } from '../lib/logger';
import { RefreshTokenRepository } from '../repositories/refreshTokenRepository';

export const exportUserData = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const userId = req.user.id;

  const [user, payments, orders, bookings, debts, notificationPrefs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        roles: true,
        emailVerified: true,
        phoneVerified: true,
        twoFactorEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.payment.findMany({
      where: { userId },
      select: { id: true, amount: true, method: true, status: true, createdAt: true, paidAt: true },
    }),
    prisma.order.findMany({
      where: { buyerId: userId },
      select: { id: true, status: true, totalAmount: true, createdAt: true },
    }),
    prisma.booking.findMany({
      where: { clientId: userId },
      select: { id: true, status: true, startDate: true, endDate: true },
    }),
    prisma.debt.findMany({
      where: { buyerId: userId },
      select: { id: true, totalAmount: true, amountPaid: true, status: true, dueDate: true },
    }),
    prisma.notificationPreference.findMany({ where: { userId } }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user,
    payments,
    orders,
    bookings,
    debts,
    notificationPreferences: notificationPrefs,
  };

  logger.info(`GDPR: User ${userId} exported their data`);

  res.json(successResponse(exportData));
});

export const deleteAccount = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const userId = req.user.id;
  const { confirmation } = req.body;

  if (confirmation !== 'CONFIRM_DELETE') {
    throw new AppError('Veuillez confirmer la suppression avec le code CONFIRM_DELETE', 400);
  }

  await prisma.$transaction(async (tx) => {
    // Anonymize personal data
    await tx.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${userId}@anonymized.afribiz.com`,
        firstName: 'Compte',
        lastName: 'Supprimé',
        phone: null,
        passwordHash: 'DELETED',
        twoFactorSecret: null,
        emailVerified: false,
        phoneVerified: false,
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Soft-delete related data (each model uses a different field for the user FK)
    const modelConfigs = [
      { model: tx.business, field: 'ownerId' },
      { model: tx.order, field: 'buyerId' },
      { model: tx.booking, field: 'clientId' },
      { model: tx.payment, field: 'userId' },
      { model: tx.debt, field: 'buyerId' },
      { model: tx.post, field: 'authorId' },
    ] as const;
    for (const { model, field } of modelConfigs) {
      await (model as Record<string, any>).updateMany({
        where: { [field]: userId } as Record<string, any>,
        data: { deletedAt: new Date() } as Record<string, any>,
      });
    }
  });

  // Revoke all JWT sessions
  await RefreshTokenRepository.revokeAllByUserId(userId);

  logger.info(`GDPR: User ${userId} deleted their account`);

  res.json(
    successResponse(
      null,
      'Compte supprimé avec succès. Vos données seront définitivement effacées sous 30 jours.'
    )
  );
});
