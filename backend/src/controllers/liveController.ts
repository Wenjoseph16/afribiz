import { Response } from 'express';
import { prisma } from '../lib/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
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
  if (!data) {
    throw new AppError('Live non trouvé', 404);
  }
  res.json(successResponse(data));
});

export const createLive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await liveService.createLive({ ...req.body, businessId: access.businessId });
  res.json(successResponse(data, 'Live créé'));
});

export const startLive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await liveService.startLive(req.params.id, access.businessId, req.body.streamUrl);
  res.json(successResponse(data, 'Live démarré'));
});

export const endLive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await liveService.endLive(req.params.id, access.businessId);
  res.json(successResponse(data, 'Live terminé'));
});

export const updateLiveStatus = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const access = await resolveBusinessAccess({
      userId: req.user.id,
      roles: req.user.roles,
      bodyBusinessId: req.body?.businessId,
    });
    if (!access) {
      throw new AppError('Aucun business associé', 403);
    }
    const data = await liveService.updateLiveStatus(
      req.params.id,
      req.body.status,
      access.businessId
    );
    res.json(successResponse(data, 'Statut mis à jour'));
  }
);

export const deleteLive = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const live = await prisma.live.findFirst({
    where: { id: req.params.id, businessId: access.businessId },
  });
  if (!live) {
    throw new AppError('Live non trouvé', 404);
  }
  await prisma.live.delete({ where: { id: req.params.id } });
  res.json(successResponse(null, 'Live supprimé'));
});

export const addLiveProduct = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await liveService.addLiveProduct(req.params.id, access.businessId, req.body);
  res.json(successResponse(data, 'Produit ajouté au live'));
});

export const updateLiveProduct = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const access = await resolveBusinessAccess({
      userId: req.user.id,
      roles: req.user.roles,
      bodyBusinessId: req.body?.businessId,
    });
    if (!access) {
      throw new AppError('Aucun business associé', 403);
    }
    const data = await liveService.updateLiveProduct(
      req.params.productId,
      access.businessId,
      req.body
    );
    res.json(successResponse(data, 'Produit mis à jour'));
  }
);

export const removeLiveProduct = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const access = await resolveBusinessAccess({
      userId: req.user.id,
      roles: req.user.roles,
      bodyBusinessId: req.body?.businessId,
    });
    if (!access) {
      throw new AppError('Aucun business associé', 403);
    }
    await liveService.removeLiveProduct(req.params.productId, access.businessId);
    res.json(successResponse(null, 'Produit retiré du live'));
  }
);

export const getLiveChats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
  const data = await liveService.getLiveChats(req.params.id, limit);
  res.json(successResponse(data));
});

export const getLiveStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await liveService.getLiveStats(access.businessId);
  res.json(successResponse(data));
});
