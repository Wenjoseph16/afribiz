import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as reportService from '../services/contentReportService';
import { CommentTargetType, ContentReportStatus } from '@prisma/client';

export const createReport = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const { type, referenceId, reason, description } = req.body;

  if (!type || !referenceId || !reason?.trim()) {
    throw new AppError('type, referenceId et reason sont requis', 400);
  }

  const validTypes = Object.values(CommentTargetType);
  if (!validTypes.includes(type)) {
    throw new AppError('Type invalide', 400);
  }

  const report = await reportService.createReport({
    reporterId: req.user.id,
    type: type as CommentTargetType,
    referenceId,
    reason: reason.trim(),
    description,
  });
  res.status(201).json(successResponse(report, 'Signalement envoyé'));
});

export const getReports = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { status, type, page, limit } = req.query;

  const result = await reportService.getReports({
    status: status as ContentReportStatus | undefined,
    type: type as CommentTargetType | undefined,
    page: Number(page) || 1,
    limit: Number(limit) || 20,
  });

  res.json(successResponse(result));
});

export const getReportById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const report = await reportService.getReportById(req.params.id);
  if (!report) {
    throw new AppError('Signalement introuvable', 404);
  }
  res.json(successResponse(report));
});

export const resolveReport = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);

  const { status } = req.body;
  const validStatuses = Object.values(ContentReportStatus);
  if (!status || !validStatuses.includes(status)) {
    throw new AppError(`Statut invalide. Valeurs: ${validStatuses.join(', ')}`, 400);
  }

  const report = await reportService.resolveReport(
    req.params.id,
    req.user.id,
    status as ContentReportStatus
  );
  res.json(successResponse(report, 'Signalement mis à jour'));
});

export const getReportCounts = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const counts = await reportService.countReportsByStatus();
    res.json(successResponse(counts));
  }
);
