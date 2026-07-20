import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as recommendationService from '../services/recommendationService';

export const getRecommendations = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { type, page, limit } = req.query;
    const validTypes = ['PRODUCT', 'SERVICE', 'BUSINESS', 'EVENT', 'PROMOTION', 'OFFER_FLASH'];
    const recType = (type as string) || 'PRODUCT';
    if (!validTypes.includes(recType)) {
      throw new AppError(`Type invalide. Types supportés: ${validTypes.join(', ')}`, 400);
    }

    const userId = req.user?.id || 'anonymous';
    const result = await recommendationService.getRecommendations(
      userId,
      recType as 'PRODUCT' | 'SERVICE' | 'BUSINESS' | 'EVENT' | 'PROMOTION' | 'OFFER_FLASH',
      Number(page) || 1,
      Number(limit) || 20
    );
    res.json({ success: true, data: result });
  }
);
