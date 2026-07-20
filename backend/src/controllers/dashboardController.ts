import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as dashboard from '../services/dashboardService';

export const getClientDashboard = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await dashboard.getClientDashboardData(req.user.id);
    res.json(successResponse(result));
  }
);

export const getBusinessDashboard = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = req.query.businessId as string;
    if (!businessId) {
      throw new AppError('businessId requis', 400);
    }
    const result = await dashboard.getBusinessDashboardData(businessId);
    res.json(successResponse(result));
  }
);

export const getDeveloperDashboard = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await dashboard.getDeveloperDashboardData(req.user.id);
    res.json(successResponse(result));
  }
);

export const getAdminDashboard = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await dashboard.getAdminDashboardData();
    res.json(successResponse(result));
  }
);
