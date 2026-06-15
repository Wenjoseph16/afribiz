import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as trainingService from '../services/training';

export const getMyTrainings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const trainings = await trainingService.getUserTrainings(req.user.id);
  res.json(successResponse({ trainings }));
});

export const enrollInTraining = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const result = await trainingService.enrollInTraining(req.user.id, req.params.id);
  res.json(successResponse(result, 'Inscription réussie'));
});