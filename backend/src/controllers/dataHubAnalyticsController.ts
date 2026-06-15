import { Response } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as analyticsService from '../services/dataHubAnalytics';
import * as copilotService from '../services/businessCopilot';
import { generateBusinessNotifications } from '../services/copilotNotificationService';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export const getSearchTrends = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const trends = analyticsService.getSearchTrends(days);
  res.json({ success: true, data: trends });
});

export const getConversionFunnel = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const funnel = await analyticsService.getConversionFunnel(business.id);
  res.json({ success: true, data: funnel });
});

export const getRetentionCohorts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const cohorts = await analyticsService.getRetentionCohorts(business.id);
  res.json({ success: true, data: cohorts });
});

export const getProductRecommendations = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const limit = parseInt(req.query.limit as string) || 6;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const recommendations = await analyticsService.getProductRecommendations(business.id, limit);
  res.json({ success: true, data: recommendations });
});

export const getEngagementAnalytics = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const engagement = await analyticsService.getEngagementAnalytics(business.id);
  res.json({ success: true, data: engagement });
});

export const getDailyTips = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const tips = await copilotService.generateDailyTips(business.id);
  res.json({ success: true, data: tips });
});

export const triggerCopilotNotifications = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const count = await generateBusinessNotifications(business.id, business.ownerId, business.name);
  res.json({ success: true, data: { generated: count, businessId: business.id, businessName: business.name } });
});

export const getBusinessHealth = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Business not found', 404);
  const health = await copilotService.getBusinessHealth(business.id);
  res.json({ success: true, data: health });
});
