import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as followService from '../services/followService';

export const follow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { businessId, developerId } = req.body;
  const result = await followService.follow(req.user.id, { businessId, developerId });
  res.status(201).json({ success: true, data: result, message: 'Vous suivez maintenant' });
});

export const unfollow = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await followService.unfollow(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const getFollowers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { targetId, type } = req.params;
  const { page, limit } = req.query;
  const result = await followService.getFollowers(
    targetId,
    type as 'business' | 'developer',
    Number(page) || 1,
    Number(limit) || 20
  );
  res.json({ success: true, data: result });
});

export const getFollowing = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { page, limit } = req.query;
  const result = await followService.getFollowing(
    req.user.id,
    Number(page) || 1,
    Number(limit) || 20
  );
  res.json({ success: true, data: result });
});

export const getFollowCount = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { targetId, type } = req.params;
  const count = await followService.getFollowCount(targetId, type as 'business' | 'developer');
  res.json({ success: true, data: { count } });
});

export const checkFollowing = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { businessId, developerId } = req.query;
  const result = await followService.isFollowing(req.user.id, {
    businessId: businessId as string | undefined,
    developerId: developerId as string | undefined,
  });
  res.json({ success: true, data: result });
});
