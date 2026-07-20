import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as accountingService from '../services/accounting';

export const listExpenses = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await accountingService.listExpenses(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getExpense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const expense = await accountingService.getExpense(req.user.id, req.params.id);
  res.json({ success: true, data: expense });
});

export const createExpense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const expense = await accountingService.createExpense(req.user.id, req.body);
  res.status(201).json({ success: true, data: expense, message: 'Dépense enregistrée' });
});

export const updateExpense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const expense = await accountingService.updateExpense(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: expense, message: 'Dépense mise à jour' });
});

export const deleteExpense = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await accountingService.deleteExpense(req.user.id, req.params.id);
  res.json({ success: true, message: 'Dépense supprimée' });
});

export const getAccountingStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const stats = await accountingService.getAccountingStats(req.user.id);
    res.json({ success: true, data: stats });
  }
);

export const getMonthlyReportCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const report = await accountingService.getMonthlyReport(req.user.id, year, month);
    res.json({ success: true, data: report });
  }
);

export const getAccountingSummaryCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const summary = await accountingService.getAccountingSummary(req.user.id);
    res.json({ success: true, data: summary });
  }
);

export const getRecentTransactionsCtrl = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const limit = parseInt(req.query.limit as string) || 5;
    const result = await accountingService.getRecentTransactions(req.user.id, limit);
    res.json({ success: true, data: result });
  }
);
