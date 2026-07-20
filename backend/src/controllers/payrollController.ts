import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as payrollService from '../services/employeeLeaves';

export const listPayrolls = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await payrollService.listPayrolls(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getPayroll = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const payroll = await payrollService.getPayroll(req.user.id, req.params.id);
  res.json({ success: true, data: payroll });
});

export const createPayroll = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const payroll = await payrollService.createPayroll(req.user.id, req.body);
  res.status(201).json({ success: true, data: payroll, message: 'Fiche de paie créée' });
});

export const updatePayrollStatus = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { status, notes } = req.body;
    const payroll = await payrollService.updatePayrollStatus(req.user.id, req.params.id, {
      status,
      notes,
    });
    res.json({ success: true, data: payroll, message: 'Statut de paie mis à jour' });
  }
);

export const deletePayroll = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await payrollService.deletePayroll(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const getPayrollStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const stats = await payrollService.getPayrollStats(req.user.id);
    res.json({ success: true, data: stats });
  }
);
