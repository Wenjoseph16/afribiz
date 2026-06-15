import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { TwoFactorService } from '../services/twoFactorService';
import { comparePasswords } from '../lib/password';

export const setup2FA = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Not authenticated' }); return; }
  const result = await TwoFactorService.generateSecret(req.user.id);
  res.json(successResponse(result, 'Secret generated. Scan the QR code with your authenticator app.'));
});

export const verify2FA = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Not authenticated' }); return; }
  const { token } = req.body;
  if (!token) { res.status(400).json({ success: false, error: 'Verification code is required' }); return; }
  await TwoFactorService.verifyAndEnable(req.user.id, token);
  res.json(successResponse(null, '2FA has been enabled successfully'));
});

export const disable2FA = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Not authenticated' }); return; }
  const { password } = req.body;
  if (!password) { res.status(400).json({ success: false, error: 'Current password is required to disable 2FA' }); return; }
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) { res.status(404).json({ success: false, error: 'User not found' }); return; }
  const valid = await comparePasswords(password, user.passwordHash);
  if (!valid) { res.status(400).json({ success: false, error: 'Invalid password' }); return; }
  await TwoFactorService.disable(req.user.id);
  res.json(successResponse(null, '2FA has been disabled'));
});

export const get2FAStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Not authenticated' }); return; }
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { twoFactorEnabled: true },
  });
  res.json(successResponse({ enabled: user?.twoFactorEnabled || false }));
});
