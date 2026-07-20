import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { ModuleDemandService } from '../services/ModuleDemandService';

export const createDemand = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const data = {
      ...req.body,
      businessId: req.body.businessId || '',
    };
    const demand = await ModuleDemandService.create(data);
    res.status(201).json({ success: true, data: demand, message: 'Demande de module creee' });
  }
);

export const getDemand = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const demand = await ModuleDemandService.findById(req.params.id);
    res.json({ success: true, data: demand });
  }
);

export const getAllDemands = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { businessId, moduleType, status, search } = req.query;
    const demands = await ModuleDemandService.findAll({
      businessId: businessId as string,
      moduleType: moduleType as string,
      status: status as string,
      search: search as string,
    });
    res.json({ success: true, data: demands });
  }
);

export const updateDemandStatus = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { status } = req.body;
    const demand = await ModuleDemandService.updateStatus(req.params.id, status);
    res.json({ success: true, data: demand, message: 'Statut mis a jour' });
  }
);

export const deleteDemand = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const result = await ModuleDemandService.delete(req.params.id);
    res.json({ success: true, ...result });
  }
);

export const findMatches = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const matches = await ModuleDemandService.findMatches(req.params.id);
    res.json({ success: true, data: matches });
  }
);

export const autoMatch = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const matches = await ModuleDemandService.autoMatch(req.params.id);
    res.json({ success: true, data: matches, message: 'Matching automatique termine' });
  }
);

export const updateMatch = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
    const { status } = req.body;
    const match = await ModuleDemandService.updateMatchStatus(req.params.matchId, status);
    res.json({ success: true, data: match, message: 'Statut du match mis a jour' });
  }
);
