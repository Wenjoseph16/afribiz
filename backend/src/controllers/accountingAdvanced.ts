import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as accountingService from '../services/accounting';

export const getBalanceSheetCtrl = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const bilan = await accountingService.getBalanceSheet(req.user.id, year);
  res.json({ success: true, data: bilan });
});

export const getIncomeStatementCtrl = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const result = await accountingService.getIncomeStatement(req.user.id, year);
  res.json({ success: true, data: result });
});

export const exportAccountingCSVCtrl = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const result = await accountingService.exportAccountingCSV(req.user.id, year);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
  res.send(result.csv);
});
