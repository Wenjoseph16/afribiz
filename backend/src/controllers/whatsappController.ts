import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as waService from '../services/whatsappService';

export const listTemplates = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await waService.listTemplates(req.user.id);
  res.json({ success: true, data });
});

export const createTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await waService.createTemplate(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const updateTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await waService.updateTemplate(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const deleteTemplate = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await waService.deleteTemplate(req.user.id, req.params.id);
  res.json({ success: true, message: 'Template supprimé' });
});

export const listSessions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await waService.listSessions(req.user.id);
  res.json({ success: true, data });
});

export const getSessionMessages = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await waService.getSessionMessages(req.user.id, req.params.sessionId);
    res.json({ success: true, data });
  }
);

export const sendMessage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await waService.sendMessage(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const stats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await waService.getWhatsAppStats(req.user.id);
  res.json({ success: true, data });
});
