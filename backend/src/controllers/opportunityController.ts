import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as opportunityService from '../services/opportunityService';
import { OpportunityStatus } from '@prisma/client';

export const getOpportunityFeed = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.query.businessId as string;
    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }

    const result = await opportunityService.getOpportunityFeed(
      businessId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    res.json(successResponse(result));
  }
);

export const detectOpportunities = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { businessId } = req.body;
    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }

    const count = await opportunityService.detectOpportunities(businessId);
    res.json(successResponse({ detected: count }, `${count} opportunité(s) détectée(s)`));
  }
);

export const updateOpportunityStatus = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = Object.values(OpportunityStatus);
    if (!status || !validStatuses.includes(status)) {
      throw new AppError(`Statut invalide. Valeurs: ${validStatuses.join(', ')}`, 400);
    }

    const updated = await opportunityService.updateOpportunityStatus(
      id,
      status as OpportunityStatus
    );
    res.json(successResponse(updated, 'Opportunité mise à jour'));
  }
);

export const getPublicFeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const [trends, unmet] = await Promise.all([
    opportunityService.getPublicOpportunityFeed(1, 10),
    opportunityService.getUnmetDemandFeed(1, 10),
  ]);
  res.json(successResponse({ trends, unmetDemand: unmet }));
});
