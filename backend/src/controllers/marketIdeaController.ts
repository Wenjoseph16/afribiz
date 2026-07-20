import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as ideaService from '../services/marketplaceIdeaService';

export const createIdea = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { businessId, title, description, category } = req.body;

  if (!businessId || !title || !category) {
    throw new AppError('businessId, title et category sont requis', 400);
  }

  const idea = await ideaService.createIdea({ businessId, title, description, category });
  res.status(201).json(successResponse(idea, 'Idée publiée'));
});

export const getIdeas = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { category, page, limit } = req.query;
  const result = await ideaService.getIdeas({
    category: category as string,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });
  res.json(successResponse(result));
});

export const getIdeaById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const idea = await ideaService.getIdeaById(req.params.id);
  if (!idea) {
    throw new AppError('Idée introuvable', 404);
  }
  res.json(successResponse(idea));
});

export const voteIdea = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const idea = await ideaService.voteIdea(req.params.id, req.user.id);
  res.json(successResponse(idea, 'Vote enregistré'));
});

export const unvoteIdea = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const idea = await ideaService.unvoteIdea(req.params.id, req.user.id);
  res.json(successResponse(idea, 'Vote retiré'));
});

export const getTopIdeas = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const limit = Number(req.query.limit) || 10;
  const ideas = await ideaService.getTopIdeas(limit);
  res.json(successResponse(ideas));
});
