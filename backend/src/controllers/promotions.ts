import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import * as promoService from '../services/promotions';
import * as marketingService from '../services/marketingCampaigns';

// ===================== PROMOTIONS =====================

export const listPromotions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await promoService.listPromotions(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getPromotion = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const promo = await promoService.getPromotion(req.user.id, req.params.id);
  res.json({ success: true, data: promo });
});

export const createPromotion = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const promo = await promoService.createPromotion(req.user.id, req.body);
    res.status(201).json({ success: true, data: promo, message: 'Promotion créée' });
  }
);

export const updatePromotion = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const promo = await promoService.updatePromotion(req.user.id, req.params.id, req.body);
    res.json({ success: true, data: promo, message: 'Promotion mise à jour' });
  }
);

export const deletePromotion = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    await promoService.deletePromotion(req.user.id, req.params.id);
    res.json({ success: true, message: 'Promotion supprimée' });
  }
);

// ===================== COUPONS =====================

export const listCoupons = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await promoService.listCoupons(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const createCoupon = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const coupon = await promoService.createCoupon(req.user.id, req.body);
  res.status(201).json({ success: true, data: coupon, message: 'Coupon créé' });
});

// ===================== BUNDLES =====================

export const listBundles = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await promoService.listBundles(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const createBundle = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const bundle = await promoService.createBundle(req.user.id, req.body);
  res.status(201).json({ success: true, data: bundle, message: 'Pack créé' });
});

// ===================== CAMPAIGNS =====================

export const listCampaigns = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const result = await promoService.listCampaigns(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const createCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const campaign = await promoService.createCampaign(req.user.id, req.body);
  res.status(201).json({ success: true, data: campaign, message: 'Campagne créée' });
});

export const sendCampaignWhatsApp = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { templateId } = req.body;
    if (!templateId) throw new AppError('templateId requis', 400);
    const result = await marketingService.sendCampaignViaWhatsApp(
      req.user.id,
      req.params.id,
      templateId
    );
    res.json({ success: true, data: result, message: 'Campagne envoyée via WhatsApp' });
  }
);

// ===================== LOYALTY =====================

export const getLoyaltyProgram = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const program = await promoService.getLoyaltyProgram(req.user.id);
    res.json({ success: true, data: program });
  }
);

export const updateLoyaltyProgram = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const program = await promoService.updateLoyaltyProgram(req.user.id, req.body);
    res.json({ success: true, data: program, message: 'Programme fidélité mis à jour' });
  }
);

export const getClientLoyalty = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const loyalty = await promoService.getClientLoyalty(req.user.id, req.params.clientId);
    res.json({ success: true, data: loyalty });
  }
);

export const redeemLoyaltyPoints = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await promoService.redeemPoints(
      req.user.id,
      req.body.businessId,
      req.body.points,
      {
        title: req.body.rewardTitle,
        type: req.body.rewardType,
      }
    );
    res.json({ success: true, data: result, message: 'Points échangés avec succès' });
  }
);

// ===================== STATS =====================

export const getPromoStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const stats = await promoService.getPromoStats(req.user.id);
  res.json({ success: true, data: stats });
});
