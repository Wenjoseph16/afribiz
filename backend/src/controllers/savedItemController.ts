import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as savedItemService from '../services/savedItemService';

export const saveItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const item = await savedItemService.saveItem(req.user.id, req.body);
  res.status(201).json({ success: true, data: item });
});

export const unsaveItem = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await savedItemService.unsaveItem(req.user.id, req.params.id);
  res.json({ success: true, ...result });
});

export const listSavedItems = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await savedItemService.listSavedItems(
    req.user.id,
    req.query as Record<string, any>
  );
  res.json({ success: true, ...result });
});

export const checkSaved = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const { type, referenceId } = req.query as { type: string; referenceId: string };
  const result = await savedItemService.checkSaved(req.user.id, type, referenceId);
  res.json({ success: true, ...result });
});

export const getSavedCount = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const referenceId = req.query.referenceId as string;
  if (!referenceId) {
    res.json({ success: true, count: 0 });
    return;
  }
  const result = await savedItemService.getSavedCount(referenceId);
  res.json({ success: true, ...result });
});
