import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as syncService from '../services/offlineSyncService';

export const list = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await syncService.listSyncItems(req.user.id, req.query.status as string);
  res.json({ success: true, data });
});

export const create = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await syncService.createSyncItem({ userId: req.user.id, ...req.body });
  res.status(201).json({ success: true, data });
});

export const process = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await syncService.processSyncItem(req.params.id);
  res.json({ success: true, data });
});

export const pendingCount = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const count = await syncService.getPendingSyncCount(req.user.id);
  res.json({ success: true, data: { count } });
});

export const bulkSync = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await syncService.bulkSync(req.user.id, req.body.items);
  res.json({ success: true, data });
});
