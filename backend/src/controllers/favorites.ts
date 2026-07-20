import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { getFavorites, addFavorite, removeFavorite } from '../services/favoriteService';

export const list = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifie', 401);
  const { type } = req.query;
  const enriched = await getFavorites(req.user.id, type as string);
  res.json(successResponse({ favorites: enriched }));
});

export const add = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifie', 401);
  const { type, referenceId } = req.body;
  await addFavorite(req.user.id, type, referenceId);
  res.status(201).json(successResponse(null, 'Ajoute aux favoris'));
});

export const remove = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifie', 401);
  await removeFavorite(req.user.id, req.params.id);
  res.json(successResponse(null, 'Retire des favoris'));
});
