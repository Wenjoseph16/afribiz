import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { TwoFactorService } from '../services/twoFactorService';
import { comparePasswords } from '../lib/password';

export const setup2FA = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const result = await TwoFactorService.generateSecret(req.user.id);
  res.json(
    successResponse(result, 'Secret generated. Scan the QR code with your authenticator app.')
  );
});

export const verify2FA = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const { token } = req.body;
  if (!token) {
    throw new AppError('Verification code is required', 400);
  }
  const backupCodes = await TwoFactorService.verifyAndEnable(req.user.id, token);
  res.json(
    successResponse(
      { backupCodes },
      '2FA a été activé. Enregistrez vos codes de secours : ils ne seront plus jamais affichés.'
    )
  );
});

export const regenerateRecoveryCodes = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { password } = req.body;
    if (!password) {
      throw new AppError('Current password is required to regenerate recovery codes', 400);
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (!user.twoFactorEnabled) {
      throw new AppError('2FA is not enabled', 400);
    }
    const valid = await comparePasswords(password, user.passwordHash);
    if (!valid) {
      throw new AppError('Invalid password', 400);
    }
    const backupCodes = TwoFactorService.generateBackupCodes();
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
    });
    // Action sensible → piste d'audit (comme TWOFA_VERIFIED)
    await prisma.securityLog.create({
      data: {
        userId: req.user.id,
        action: 'TWOFA_CODES_REGENERATED',
        success: true,
        reason: 'Recovery codes regenerated',
      },
    });
    res.json(
      successResponse({ backupCodes }, 'Codes de secours régénérés. Enregistrez-les immédiatement.')
    );
  }
);

export const disable2FA = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const { password } = req.body;
  if (!password) {
    throw new AppError('Current password is required to disable 2FA', 400);
  }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  const valid = await comparePasswords(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid password', 400);
  }
  await TwoFactorService.disable(req.user.id);
  // Action sensible → piste d'audit
  await prisma.securityLog.create({
    data: {
      userId: req.user.id,
      action: 'TWOFA_DISABLED',
      success: true,
      reason: '2FA disabled with password',
    },
  });
  res.json(successResponse(null, '2FA has been disabled'));
});

export const get2FAStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { twoFactorEnabled: true },
  });
  res.json(successResponse({ enabled: user?.twoFactorEnabled || false }));
});
