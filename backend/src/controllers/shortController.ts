import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
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
  if (!data) { res.status(404).json({ success: false, error: 'Short non trouvé' }); return; }
  res.json(successResponse(data));
});

export const createShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await shortService.createShort({ ...req.body, businessId: access.businessId });
  res.status(201).json(successResponse(data, 'Short créé'));
});

export const updateShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await shortService.updateShort(req.params.id, access.businessId, req.body);
  if (!data) { res.status(404).json({ success: false, error: 'Short non trouvé' }); return; }
  res.json(successResponse(data, 'Short mis à jour'));
});

export const deleteShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  await shortService.deleteShort(req.params.id, access.businessId);
  res.json(successResponse(null, 'Short supprimé'));
});

export const likeShort = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await shortService.likeShort(req.params.id, req.user.id);
  res.json(successResponse(data));
});

export const addComment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.body?.content) { res.status(400).json({ success: false, error: 'Contenu requis' }); return; }
  const data = await shortService.addComment(req.params.id, req.user?.id, req.user ? `${req.user.email}` : 'Anonyme', req.body.content);
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
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const data = await shortService.saveShort(req.params.id, req.user.id);
  res.json(successResponse(data));
});
