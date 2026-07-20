import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as gamificationService from '../services/gamificationService';
import { prisma } from '../lib/db';
export const getMyQuests = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const quests = await gamificationService.getActiveQuests(business.id);
  res.json({ success: true, data: quests });
});

export const getMyCompletedQuests = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const quests = await gamificationService.getCompletedQuests(business.id);
    res.json({ success: true, data: quests });
  }
);

export const initializeQuests = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    await gamificationService.initializeDailyQuests(business.id);
    await gamificationService.initializeWeeklyQuests(business.id);
    res.json({ success: true, message: 'Quetes initialisees avec succes' });
  }
);

export const getMyStreaks = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const streaks = await gamificationService.getStreaks(business.id);
  res.json({ success: true, data: streaks });
});

export const getMyRanking = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const ranking = await gamificationService.getMyRanking(business.id);
  res.json({ success: true, data: ranking });
});

export const getLeaderboard = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const category = (req.query.category as string) || 'OVERALL';
  const period = (req.query.period as string) || 'WEEKLY';
  const leaderboard = await gamificationService.computeLeaderboard(category, period);
  res.json({ success: true, data: leaderboard });
});

export const getMyChallenges = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const challenges = await gamificationService.getActiveChallenges(business.id);
    res.json({ success: true, data: challenges });
  }
);

export const getGamificationDashboard = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const business = await prisma.business.findUnique({ where: { ownerId: userId } });
    if (!business) throw new AppError('Business not found', 404);
    const dashboard = await gamificationService.getGamificationDashboard(business.id);
    res.json({ success: true, data: dashboard });
  }
);
