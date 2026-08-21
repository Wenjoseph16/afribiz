import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as layawayService from '../services/layawayService';

// ── BUSINESS : offres d'épargne ──

export const createOffer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const { itemType, itemId, durationDays, minInstallment } = req.body;
  if (!itemType || !itemId) {
    return res.status(400).json(successResponse(null, 'itemType et itemId requis'));
  }
  const result = await layawayService.createLayawayOffer(req.user.id, {
    itemType,
    itemId,
    durationDays,
    minInstallment,
  });
  res.status(201).json(successResponse(result, 'Épargne Achat activée sur cet article'));
});

export const createOffersBatch = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new Error('Non authentifié');
    const { itemType, scope, categoryIds, itemIds, durationDays, minInstallment } = req.body;
    if (!itemType) {
      return res.status(400).json(successResponse(null, 'itemType requis'));
    }
    const result = await layawayService.createLayawayOffersBatch(req.user.id, {
      itemType,
      scope,
      categoryIds,
      itemIds,
      durationDays,
      minInstallment,
    });
    res
      .status(201)
      .json(
        successResponse(
          result,
          `${result.activated} épargne(s) activée(s)${result.skipped ? `, ${result.skipped} sans prix ignorée(s)` : ''}`
        )
      );
  }
);

export const listOffers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const offers = await layawayService.listLayawayOffers(req.user.id);
  res.json(successResponse({ offers }));
});

export const toggleOffer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const { isActive } = req.body;
  const offer = await layawayService.toggleLayawayOffer(req.user.id, req.params.id, !!isActive);
  res.json(successResponse(offer, isActive ? 'Épargne Achat activée' : 'Épargne Achat désactivée'));
});

export const deleteOffer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  await layawayService.deleteLayawayOffer(req.user.id, req.params.id);
  res.json(successResponse(null, 'Offre épargne supprimée'));
});

export const businessPlans = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const plans = await layawayService.listBusinessLayawayPlans(req.user.id);
  res.json(successResponse({ plans }));
});

export const businessStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const stats = await layawayService.getBusinessLayawayStats(req.user.id);
  res.json(successResponse(stats));
});

// ── CLIENT / PUBLIC : plans ──

export const activeOffer = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const itemType = String(req.query.itemType || '');
  const itemId = String(req.query.itemId || '');
  const offer = await layawayService.getActiveOffer(itemType, itemId);
  res.json(successResponse(offer));
});

export const activeOffersBatch = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const itemType = String(req.query.itemType || '');
    const itemIds = String(req.query.itemIds || '')
      .split(',')
      .map((s) => s.trim());
    const offers = await layawayService.getActiveOffersForItems(itemType, itemIds);
    res.json(successResponse({ offers }));
  }
);

export const createPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const { offerId } = req.body;
  if (!offerId) return res.status(400).json(successResponse(null, 'offerId requis'));
  const plan = await layawayService.createLayawayPlan(req.user.id, offerId);
  res
    .status(201)
    .json(successResponse(plan, 'Plan épargne créé — votre argent est sécurisé en escrow'));
});

export const myPlans = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const plans = await layawayService.listMyLayawayPlans(req.user.id);
  res.json(successResponse({ plans }));
});

export const getPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const plan = await layawayService.getLayawayPlan(req.params.id, req.user.id);
  res.json(successResponse(plan));
});

export const contribute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const { amount, method, phone } = req.body;
  if (!amount || amount <= 0)
    return res.status(400).json(successResponse(null, 'Montant invalide'));
  const result = await layawayService.contributeToLayaway(req.user.id, req.params.id, {
    amount,
    method,
    phone,
  });
  res.json(successResponse(result, 'Cotisation reçue et sécurisée en escrow'));
});

export const cancelPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new Error('Non authentifié');
  const plan = await layawayService.cancelLayawayPlan(req.user.id, req.params.id);
  res.json(successResponse(plan, 'Plan annulé — remboursement intégral en cours'));
});

export const confirmCheckout = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new Error('Non authentifié');
    const { checkIn, checkOut, guests } = req.body;
    const result = await layawayService.confirmLayawayCheckout(req.user.id, req.params.id, {
      checkIn,
      checkOut,
      guests,
    });
    res.json(successResponse(result, 'Réservation/billet créé et escrow libéré au business'));
  }
);
