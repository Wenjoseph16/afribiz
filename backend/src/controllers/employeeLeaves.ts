import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as leaveService from '../services/employeeLeaves';

export const listLeaves = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await leaveService.listLeaves(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getLeave = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const leave = await leaveService.getLeave(req.user.id, req.params.id);
  res.json({ success: true, data: leave });
});

export const createLeave = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const leave = await leaveService.createLeave(req.user.id, req.body);
  res.status(201).json({ success: true, data: leave, message: 'Congé créé' });
});

export const updateLeaveStatus = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { status, notes } = req.body;
    const leave = await leaveService.updateLeaveStatus(req.user.id, req.params.id, {
      status,
      notes,
    });
    res.json({ success: true, data: leave, message: 'Statut du congé mis à jour' });
  }
);

export const deleteLeave = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await leaveService.deleteLeave(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const getLeaveStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const stats = await leaveService.getLeaveStats(req.user.id);
  res.json({ success: true, data: stats });
});
