import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as referralService from '../services/referral';

export const getMyReferralCode = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await referralService.getMyReferralCode(req.user.id);
    res.json(successResponse(data));
  }
);

export const inviteReferral = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await referralService.createReferral(req.user.id, req.body.email);
  res.json(successResponse(data, 'Invitation envoyée'));
});

export const getMyReferrals = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await referralService.getMyReferrals(req.user.id);
  res.json(successResponse(data));
});

export const getMyReferralRewards = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await referralService.getMyReferralRewards(req.user.id);
    res.json(successResponse(data));
  }
);

export const getReferralStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await referralService.getReferralStats(req.user.id);
    res.json(successResponse(data));
  }
);
