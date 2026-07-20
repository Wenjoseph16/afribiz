import { Request, Response } from 'express';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as taxService from '../services/taxService';

export const listCountryTaxes = catchAsyncErrors(async (_req: Request, res: Response) => {
  const data = await taxService.listCountryTaxes();
  res.json({ success: true, data });
});

export const getCountryTax = catchAsyncErrors(async (req: Request, res: Response) => {
  const data = await taxService.getCountryTax(req.params.countryCode);
  res.json({ success: true, data });
});

export const createCountryTax = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await taxService.createCountryTax(req.body);
    res.status(201).json({ success: true, data });
  }
);

export const updateCountryTax = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await taxService.updateCountryTax(req.params.countryCode, req.body);
    res.json({ success: true, data });
  }
);

export const getBusinessConfig = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await taxService.getBusinessTaxConfig(req.user.id);
    res.json({ success: true, data });
  }
);

export const updateBusinessConfig = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const data = await taxService.updateBusinessTaxConfig(req.user.id, req.body);
    res.json({ success: true, data });
  }
);

export const listReports = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await taxService.getTaxReports(req.user.id);
  res.json({ success: true, data });
});

export const generateReport = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await taxService.generateTaxReport(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});
