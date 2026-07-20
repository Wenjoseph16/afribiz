import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as shortService from '../services/shortService';
import { resolveBusinessAccess } from '../lib/businessAccess';

export const getShorts = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { businessId, page, limit } = req.query;
  const data = await shortService.getShorts({
    businessId: businessId as string,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  res.json(successResponse(data));
});

export const getShortById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await shortService.getShortById(req.params.id, req.user?.id);
  if (!data) {
    throw new AppError('Short non trouvé', 404);
  }
  res.json(successResponse(data));
});

export const createShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await shortService.createShort({ ...req.body, businessId: access.businessId });
  res.status(201).json(successResponse(data, 'Short créé'));
});

export const updateShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await shortService.updateShort(req.params.id, access.businessId, req.body);
  if (!data) {
    throw new AppError('Short non trouvé', 404);
  }
  res.json(successResponse(data, 'Short mis à jour'));
});

export const deleteShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  await shortService.deleteShort(req.params.id, access.businessId);
  res.json(successResponse(null, 'Short supprimé'));
});

export const likeShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await shortService.likeShort(req.params.id, req.user.id);
  res.json(successResponse(data));
});

export const addComment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.body?.content) {
    throw new AppError('Contenu requis', 400);
  }
  const data = await shortService.addComment(
    req.params.id,
    req.user?.id,
    req.user ? `${req.user.email}` : 'Anonyme',
    req.body.content
  );
  res.json(successResponse(data, 'Commentaire ajouté'));
});

export const getComments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await shortService.getComments(req.params.id);
  res.json(successResponse(data));
});

export const viewShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await shortService.viewShort(req.params.id, req.user?.id, req.ip);
  res.json(successResponse({ viewed: true }));
});

export const shareShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await shortService.shareShort(req.params.id);
  res.json(successResponse({ shared: true }));
});

export const saveShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const data = await shortService.saveShort(req.params.id, req.user.id);
  res.json(successResponse(data));
});
