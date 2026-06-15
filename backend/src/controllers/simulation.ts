import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { successResponse } from '../utils/response';
import * as simulationService from '../services/simulation';

export const getSimulationEnvironments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const envs = await simulationService.getSimulationEnvironments(req.user.id);
  res.json(successResponse({ environments: envs }));
});

export const testEndpoint = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { moduleSlug } = req.params;
  const { endpoint, method, body } = req.body;
  const result = await simulationService.testEndpoint(req.user.id, moduleSlug, endpoint, method || 'GET', body);
  res.json(successResponse(result));
});

export const getSimulationLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { moduleSlug } = req.query;
  const logs = await simulationService.getSimulationLogs(req.user.id, moduleSlug as string);
  res.json(successResponse({ logs }));
});

export const getMockData = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const { moduleSlug, dataType } = req.params;
  const data = await simulationService.getMockData(req.user.id, moduleSlug, dataType);
  res.json(successResponse({ data }));
});

export const getAvailableEndpoints = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const endpoints = await simulationService.getAvailableEndpoints();
  res.json(successResponse({ endpoints }));
});
