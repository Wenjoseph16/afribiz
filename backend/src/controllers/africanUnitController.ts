import { Request, Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as unitService from '../services/africanUnitService';

export const list = catchAsyncErrors(async (req: Request, res: Response) => {
  const data = await unitService.listUnits(
    req.query.category as string,
    req.query.region as string
  );
  res.json({ success: true, data });
});

export const get = catchAsyncErrors(async (req: Request, res: Response) => {
  const data = await unitService.getUnit(req.params.id);
  res.json({ success: true, data });
});

export const create = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await unitService.createUnit(req.body);
  res.status(201).json({ success: true, data });
});

export const update = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await unitService.updateUnit(req.params.id, req.body);
  res.json({ success: true, data });
});

export const remove = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await unitService.deleteUnit(req.params.id);
  res.json({ success: true, message: 'Unité supprimée' });
});

export const convert = catchAsyncErrors(async (req: Request, res: Response) => {
  const { unitId, value, toStandard } = req.body;
  const data = await unitService.convertValue(unitId, value, toStandard);
  res.json({ success: true, data });
});

export const categories = catchAsyncErrors(async (_req: Request, res: Response) => {
  const data = await unitService.getCategories();
  res.json({ success: true, data });
});
