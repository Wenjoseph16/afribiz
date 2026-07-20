import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as attentionService from '../services/attentionService';

export const getAttentionCenter = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const businessId = req.query.businessId as string;
    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }

    const result = await attentionService.getAttentionItems(businessId);
    res.json(successResponse(result));
  }
);

export const getUrgencyStatus = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const businessId = req.query.businessId as string;
    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }

    const attention = await attentionService.getAttentionItems(businessId);
    const hasUrgency = attention.criticalCount > 0 || attention.highCount > 5;

    res.json(
      successResponse({
        status: hasUrgency ? 'ATTENTION_REQUIRED' : 'NORMAL',
        criticalCount: attention.criticalCount,
        highCount: attention.highCount,
        totalCount: attention.totalCount,
      })
    );
  }
);
