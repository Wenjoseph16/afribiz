import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as reviewService from '../services/reviewService';

export const createReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const review = await reviewService.createReview(req.user.id, req.body);
  res.status(201).json({ success: true, data: review });
});

export const updateReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const review = await reviewService.updateReview(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: review });
});

export const deleteReview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await reviewService.deleteReview(req.user.id, req.params.id);
  res.json({ success: true, message: 'Avis supprimé' });
});

export const getReviews = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { productId, serviceId, userId, page, limit } = req.query;
  const result = await reviewService.getReviews({
    productId: productId as string,
    serviceId: serviceId as string,
    userId: userId as string,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
  });
  res.json({ success: true, ...result });
});
