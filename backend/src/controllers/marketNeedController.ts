import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as needService from '../services/marketplaceNeedService';

export const createNeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { businessId, title, description, category, budget, urgency } = req.body;

  if (!businessId || !title || !category) {
    throw new AppError('businessId, title et category sont requis', 400);
  }

  const need = await needService.createNeed({
    businessId,
    title,
    description,
    category,
    budget,
    urgency,
  });
  res.status(201).json(successResponse(need, 'Besoin publié'));
});

export const getNeeds = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { category, status, page, limit } = req.query;
  const result = await needService.getNeeds({
    category: category as string,
    status: status as string,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  res.json(successResponse(result));
});

export const getNeedById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const need = await needService.getNeedById(req.params.id);
  if (!need) {
    throw new AppError('Besoin introuvable', 404);
  }
  res.json(successResponse(need));
});

export const voteNeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const need = await needService.voteNeed(req.params.id, req.user.id);
  res.json(successResponse(need, 'Vote enregistré'));
});

export const unvoteNeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const need = await needService.unvoteNeed(req.params.id, req.user.id);
  res.json(successResponse(need, 'Vote retiré'));
});

export const closeNeed = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { businessId } = req.body;
  if (!businessId) {
    throw new AppError('businessId requis', 400);
  }
  const need = await needService.closeNeed(req.params.id, businessId);
  res.json(successResponse(need, 'Besoin clôturé'));
});
