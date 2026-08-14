import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as service from '../services/catalogAttachmentService';

export const createAttachment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const att = await service.createOrUpdateAttachment(req.user.id, req.body);
    res.status(201).json({ success: true, data: att });
  }
);

export const listAttachments = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { itemType, itemId, sourceType } = req.query as Record<string, string | undefined>;
    const list = await service.listAttachments(req.user.id, { itemType, itemId, sourceType });
    res.json({ success: true, data: list });
  }
);

export const updateAttachment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const att = await service.updateAttachment(req.user.id, req.params.id, req.body);
    res.json({ success: true, data: att });
  }
);

export const removeAttachment = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await service.removeAttachment(req.user.id, req.params.id);
    res.json({ success: true, data: result, message: 'Rattachement supprimé' });
  }
);
