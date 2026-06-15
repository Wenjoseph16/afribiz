import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as marketingService from '../services/marketingCampaigns';

export const getMarketingStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const stats = await marketingService.getMarketingStats(req.user.id);
  res.json({ success: true, data: stats });
});
export const triggerBirthdayCampaign = catchAsyncErrors(async (_req: AuthenticatedRequest, res: Response) => {
  const result = await marketingService.sendBirthdayCampaigns();
  res.json({ success: true, data: result, message: 'Campagne anniversaire exécutée' });
});
export const triggerInactiveCheck = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const result = await marketingService.detectInactiveClients(days);
  res.json({ success: true, data: result, message: 'Vérification clients inactifs terminée' });
});
