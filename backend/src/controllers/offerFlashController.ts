import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as offerFlashService from '../services/offerFlashService';
import { resolveBusinessAccess } from '../lib/businessAccess';

export const getActiveOffers = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { page, limit, businessId, featured } = req.query;
    const lat = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const lng = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const radius = req.query.radiusKm ? parseInt(req.query.radiusKm as string) : undefined;
    const data = await offerFlashService.getActiveOffers({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      businessId: businessId as string,
      latitude: lat,
      longitude: lng,
      radiusKm: radius,
      featured: featured === 'true',
    });
    res.json(successResponse(data));
  }
);

export const getOfferById = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const data = await offerFlashService.getOfferById(req.params.id);
  if (!data) throw new AppError('Offre introuvable', 404);
  res.json(successResponse(data));
});

export const createOffer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await offerFlashService.createOffer({ ...req.body, businessId: access.businessId });
  res.status(201).json(successResponse(data, 'Offre flash créée'));
});

export const updateOffer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const data = await offerFlashService.updateOffer(req.params.id, access.businessId, req.body);
  if (!data) throw new AppError('Offre introuvable', 404);
  res.json(successResponse(data));
});

export const deleteOffer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const access = await resolveBusinessAccess({
    userId: req.user.id,
    roles: req.user.roles,
    bodyBusinessId: req.body?.businessId,
  });
  if (!access) {
    throw new AppError('Aucun business associé', 403);
  }
  const deleted = await offerFlashService.deleteOffer(req.params.id, access.businessId);
  if (!deleted) throw new AppError('Offre introuvable', 404);
  res.json(successResponse({ deleted: true }));
});

export const claimOffer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const data = await offerFlashService.claimOffer(req.params.id, userId);
  if (!data) throw new AppError('Offre épuisée ou expirée', 400);
  res.json(successResponse(data));
});

export const getNearbyBusinesses = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const { latitude, longitude, radiusKm, type, page, limit } = req.query;
    if (!latitude || !longitude) {
      throw new AppError('Latitude et longitude requises', 400);
    }
    const data = await offerFlashService.getNearbyBusinesses({
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
      radiusKm: radiusKm ? parseInt(radiusKm as string) : undefined,
      type: type as string,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(successResponse(data));
  }
);
