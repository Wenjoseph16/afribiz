import { Request, Response, NextFunction } from 'express';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as developerService from '../services/developer';
import { config } from '../config/env';

export const activateDeveloperRole = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await developerService.activateDeveloperRole(req.user.id);

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, data: result, message: 'Rôle développeur activé avec succès' });
});

export const getMyDeveloperProfile = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const profile = await developerService.getDeveloperProfile(req.user.id);
  res.json({ success: true, data: profile });
});

export const updateDeveloperProfile = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const profile = await developerService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data: profile, message: 'Profil mis à jour avec succès' });
});

export const submitVerification = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await developerService.submitVerification(req.user.id, req.body);
  res.json({ success: true, data: result, message: 'Documents de vérification soumis avec succès' });
});

export const getDeveloperDashboard = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const dashboard = await developerService.getDeveloperDashboard(req.user.id);
  res.json({ success: true, data: dashboard });
});

export const getPublicDeveloperProfile = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { id } = req.params;
  const profile = await developerService.getPublicDeveloperProfile(id);
  res.json({ success: true, data: profile });
});
