import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as satisfactionService from '../services/satisfactionService';

export const submitSurvey = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Authentification requise', 401);
    const { orderId, bookingId, score, feedback } = req.body || {};
    const data = await satisfactionService.submitSatisfaction(req.user.id, {
      orderId,
      bookingId,
      score: Number(score),
      feedback,
    });
    res.json({ success: true, data, message: 'Merci pour votre avis !' });
  }
);

export const getContext = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Authentification requise', 401);
    const { orderId, bookingId } = req.query as Record<string, string | undefined>;
    const data = await satisfactionService.getSatisfactionContext(
      req.user.id,
      orderId,
      bookingId
    );
    res.json({ success: true, data });
  }
);

export const getBusinessStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Authentification requise', 401);
    const data = await satisfactionService.getBusinessSatisfactionStats(req.user.id);
    res.json({ success: true, data });
  }
);
