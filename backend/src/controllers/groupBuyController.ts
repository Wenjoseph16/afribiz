import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as groupBuyService from '../services/groupBuyService';

export const list = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await groupBuyService.listGroupBuys(req.user.id);
  res.json({ success: true, data });
});

export const get = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await groupBuyService.getGroupBuy(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const create = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await groupBuyService.createGroupBuy(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const update = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await groupBuyService.updateGroupBuy(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const remove = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await groupBuyService.deleteGroupBuy(req.user.id, req.params.id);
  res.json({ success: true, message: 'Achat groupé supprimé' });
});

export const addParticipant = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await groupBuyService.addParticipant(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const removeParticipant = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    await groupBuyService.removeParticipant(req.user.id, req.params.participantId);
    res.json({ success: true, message: 'Participant retiré' });
  }
);

export const confirmParticipant = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await groupBuyService.confirmParticipantOrder(
      req.user.id,
      req.params.participantId
    );
    res.json({ success: true, data });
  }
);
