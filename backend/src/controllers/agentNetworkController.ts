import { Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as agentService from '../services/agentNetworkService';

export const list = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await agentService.listAgents(req.user.id);
  res.json({ success: true, data });
});

export const get = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await agentService.getAgent(req.user.id, req.params.id);
  res.json({ success: true, data });
});

export const create = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await agentService.createAgent(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

export const update = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await agentService.updateAgent(req.user.id, req.params.id, req.body);
  res.json({ success: true, data });
});

export const remove = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await agentService.deleteAgent(req.user.id, req.params.id);
  res.json({ success: true, message: 'Agent supprimé' });
});

export const recordTransaction = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await agentService.recordAgentTransaction(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  }
);

export const listTransactions = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await agentService.listAgentTransactions(req.user.id, req.query.agentId as string);
    res.json({ success: true, data });
  }
);

export const stats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await agentService.getAgentStats(req.user.id);
  res.json({ success: true, data });
});
