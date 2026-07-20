import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as trainingService from '../services/training';
import * as certificateService from '../services/certificateGenerator';

export const listAllTrainings = catchAsyncErrors(
  async (_req: AuthenticatedRequest, res: Response) => {
    const trainings = await trainingService.listAllTrainings();
    res.json(successResponse({ trainings }));
  }
);

export const getMyTrainings = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const trainings = await trainingService.getUserTrainings(req.user.id);
  res.json(successResponse({ trainings }));
});

export const enrollInTraining = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await trainingService.enrollInTraining(req.user.id, req.params.id);
    res.json(successResponse(result, 'Inscription réussie'));
  }
);

export const generateCertificateCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await certificateService.generateCertificate(req.user.id, req.params.trainingId);
    res.json(successResponse(result, 'Certificat généré'));
  }
);
