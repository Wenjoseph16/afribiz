import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as cashService from '../services/cashService';

export const openCashSession = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { openingBalance, notes } = req.body || {};
    const data = await cashService.openSession(
      req.user.id,
      Number(openingBalance || 0),
      req.user.id
    );
    res.json({ success: true, data });
  }
);

export const getTodayCashSession = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await cashService.getTodaySession(req.user.id);
    res.json({ success: true, data });
  }
);

export const getCashHistory = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const limit = parseInt(req.query.limit as string) || 30;
    const data = await cashService.getSessionHistory(req.user.id, limit);
    res.json({ success: true, data });
  }
);

export const addCashMovement = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await cashService.addMovement(req.user.id, req.body || {}, req.user.id);
    res.status(201).json({ success: true, data });
  }
);

export const closeCashSession = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { actualBalance, notes } = req.body || {};
    const data = await cashService.closeSession(
      req.user.id,
      Number(actualBalance || 0),
      req.user.id,
      notes
    );
    res.json({ success: true, data });
  }
);

export const getCashWidget = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await cashService.getCashWidget(req.user.id);
    res.json({ success: true, data });
  }
);
