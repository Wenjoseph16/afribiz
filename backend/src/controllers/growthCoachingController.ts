import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import { prisma } from '../lib/db';
import * as growthCoaching from '../services/growthCoachingService';

async function getBusinessId(req: AuthenticatedRequest): Promise<string> {
  const qId = req.query.businessId as string | undefined;
  if (qId) return qId;
  if (!req.user) throw new AppError('Non authentifié', 401);
  const business = await prisma.business.findFirst({
    where: { ownerId: req.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Aucun business trouvé pour cet utilisateur', 404);
  return business.id;
}

export const getGrowthDetection = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const result = await growthCoaching.getGrowthDetection(businessId);
    res.json(successResponse(result));
  }
);

export const getCoachDashboard = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const result = await growthCoaching.getCoachDashboard(businessId);
    res.json(successResponse(result));
  }
);

export const getModuleRecommendations = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const result = await growthCoaching.getModuleRecommendations(businessId);
    res.json(successResponse(result));
  }
);
