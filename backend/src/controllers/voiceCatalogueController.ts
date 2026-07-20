import { Request, Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as voiceService from '../services/voiceCatalogueService';

export const listCommands = catchAsyncErrors(async (_req: Request, res: Response) => {
  const data = await voiceService.listVoiceCommands();
  res.json({ success: true, data });
});

export const createCommand = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await voiceService.createVoiceCommand(req.body);
  res.status(201).json({ success: true, data });
});

export const updateCommand = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await voiceService.updateVoiceCommand(req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteCommand = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await voiceService.deleteVoiceCommand(req.params.id);
  res.json({ success: true, message: 'Commande supprimée' });
});

export const listQueries = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await voiceService.listVoiceQueries(req.user.id);
  res.json({ success: true, data });
});

export const createQuery = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await voiceService.createVoiceQuery(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const stats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await voiceService.getVoiceStats(req.user.id);
  res.json({ success: true, data });
});
