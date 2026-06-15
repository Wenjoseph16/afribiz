import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as liveService from '../services/liveService';
import { resolveBusinessAccess } from '../lib/businessAccess';

export const getActiveLives = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const { status, businessId, page, limit } = req.query;
  const data = await liveService.getActiveLives({
    status: status as string,
    businessId: businessId as string,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });
  res.json(successResponse(data));
});

export const getLiveById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await liveService.getLiveById(req.params.id);
  if (!data) { res.status(404).json({ success: false, error: 'Live non trouvé' }); return; }
  res.json(successResponse(data));
});

export const createLive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await liveService.createLive({ ...req.body, businessId: access.businessId });
  res.json(successResponse(data, 'Live créé'));
});

export const startLive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await liveService.startLive(req.params.id, access.businessId, req.body.streamUrl);
  res.json(successResponse(data, 'Live démarré'));
});

export const endLive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await liveService.endLive(req.params.id, access.businessId);
  res.json(successResponse(data, 'Live terminé'));
});

export const updateLiveStatus = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await liveService.updateLiveStatus(req.params.id, req.body.status, access.businessId);
  res.json(successResponse(data, 'Statut mis à jour'));
});

export const deleteLive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const live = await prisma.live.findFirst({ where: { id: req.params.id, businessId: access.businessId } });
  if (!live) { res.status(404).json({ success: false, error: 'Live non trouvé' }); return; }
  await prisma.live.delete({ where: { id: req.params.id } });
  res.json(successResponse(null, 'Live supprimé'));
});

export const addLiveProduct = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await liveService.addLiveProduct(req.params.id, access.businessId, req.body);
  res.json(successResponse(data, 'Produit ajouté au live'));
});

export const updateLiveProduct = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await liveService.updateLiveProduct(req.params.productId, access.businessId, req.body);
  res.json(successResponse(data, 'Produit mis à jour'));
});

export const removeLiveProduct = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  await liveService.removeLiveProduct(req.params.productId, access.businessId);
  res.json(successResponse(null, 'Produit retiré du live'));
});

export const getLiveChats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const data = await liveService.getLiveChats(req.params.id, limit);
  res.json(successResponse(data));
});

export const getLiveStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) { res.status(401).json({ success: false, error: 'Non authentifié' }); return; }
  const access = await resolveBusinessAccess({ userId: req.user.id, roles: req.user.roles, bodyBusinessId: req.body?.businessId });
  if (!access) { res.status(403).json({ success: false, error: 'Aucun business associé' }); return; }
  const data = await liveService.getLiveStats(access.businessId);
  res.json(successResponse(data));
});
