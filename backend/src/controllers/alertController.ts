import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as alertService from '../services/alertService';

export const createAlert = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const alert = await alertService.createAlert(req.user!.id, req.body);
  res.status(201).json({ success: true, data: alert });
});

export const updateAlert = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const alert = await alertService.updateAlert(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: alert });
});

export const deleteAlert = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await alertService.deleteAlert(req.user!.id, req.params.id);
  res.json({ success: true, message: 'Alerte supprimée' });
});

export const listAlerts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const result = await alertService.listAlerts(req.user!.id, req.query as Record<string, any>);
  res.json({ success: true, data: result });
});

export const getAlert = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const alert = await alertService.getAlert(req.user!.id, req.params.id);
  res.json({ success: true, data: alert });
});
