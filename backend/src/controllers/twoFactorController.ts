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
  await TwoFactorService.verifyAndEnable(req.user.id, token);
  res.json(successResponse(null, '2FA has been enabled successfully'));
});

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
