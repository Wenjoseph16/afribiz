import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import {
  getProfile,
  updateProfile,
  updatePassword,
  toggle2FA,
  uploadAvatar,
} from '../services/profileService';

export const getMyProfile = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const user = await getProfile(req.user.id);
  res.json(successResponse({ user }));
});

export const updateMyProfile = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const user = await updateProfile(req.user.id, req.body);
    res.json(successResponse({ user }, 'Profil mis a jour'));
  }
);

export const updateMyPassword = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated', 401);
    const { currentPassword, newPassword } = req.body;
    await updatePassword(req.user.id, currentPassword, newPassword);
    res.json(successResponse(null, 'Password updated'));
  }
);

export const toggleMy2FA = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated', 401);
  const { enable } = req.body;
  await toggle2FA(req.user.id, enable);
  res.json(successResponse(null, '2FA preference updated'));
});

export const uploadMyAvatar = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifie', 401);
  const avatarUrl = await uploadAvatar(req.user.id, req.file);
  res.json(successResponse({ avatar: avatarUrl }, 'Photo de profil mise a jour'));
});
