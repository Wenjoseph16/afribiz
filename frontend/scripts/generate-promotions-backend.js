const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', '..', 'backend', 'src');

const serviceContent = `import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('PROMOTIONS')) throw new AppError('Module Promotions non activ\u00e9', 403);
  return business;
}

function generateCode(prefix: string): string {
  return prefix + '-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ===================== INCLUDE =====================

const promoInclude = {
  coupons: { where: { status: 'ACTIVE' }, take: 5, orderBy: { createdAt: 'desc' } },
  bundles: { include: { items: true }, take: 5 },
  logs: { orderBy: { createdAt: 'desc' }, take: 10 },
} satisfies Prisma.PromotionInclude;

// ===================== PROMOTIONS =====================

export async function listPromotions(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, promotionType, isActive, isFeatured, search, dateFrom, dateTo } = filters;
  const where: Prisma.PromotionWhereInput = { businessId: business.id, deletedAt: null };
  if (promotionType) where.promotionType = promotionType as any;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';
  if (dateFrom || dateTo) {
    where.OR = [
      { startsAt: undefined as any },
      { startsAt: { gte: dateFrom ? new Date(dateFrom) : undefined, lte: dateTo ? new Date(dateTo + 'T23:59:59Z') : undefined } },
    ];
  }
  if (search) where.title = { contains: search, mode: 'insensitive' };
  const skip = (page - 1) * limit;
  const [promotions, total] = await Promise.all([
    prisma.promotion.findMany({ where, include: promoInclude, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.promotion.count({ where }),
  ]);
  return { promotions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPromotion(ownerId: string, promoId: string) {
  const business = await getBusinessByOwner(ownerId);
  const promo = await prisma.promotion.findFirst({ where: { id: promoId, businessId: business.id }, include: promoInclude });
  if (!promo) throw new AppError('Promotion non trouv\u00e9e', 404);
  return promo;
}

export async function createPromotion(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const promo = await prisma.promotion.create({
    data: {
      businessId: business.id,
      title: data.title,
      description: data.description || null,
      promotionType: data.promotionType || 'PERCENTAGE',
      discountValue: data.discountValue,
      code: data.code || generateCode('PROMO'),
      targetType: data.targetType || 'ALL',
      targetIds: data.targetIds || [],
      minOrderAmount: data.minOrderAmount || null,
      maxUsageCount: data.maxUsageCount || null,
      perCustomerLimit: data.perCustomerLimit || null,
      conditions: data.conditions || null,
      badgeLabel: data.badgeLabel || null,
      image: data.image || null,
      bannerImage: data.bannerImage || null,
      autoApply: data.autoApply || false,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      isFeatured: data.isFeatured || false,
    },
    include: promoInclude,
  });
  return promo;
}

export async function updatePromotion(ownerId: string, promoId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.promotion.findFirst({ where: { id: promoId, businessId: business.id } });
  if (!existing) throw new AppError('Promotion non trouv\u00e9e', 404);

  const upd: any = {};
  for (const key of ['title', 'description', 'promotionType', 'discountValue', 'code', 'targetType', 'targetIds', 'minOrderAmount', 'maxUsageCount', 'perCustomerLimit', 'conditions', 'badgeLabel', 'image', 'bannerImage', 'autoApply', 'isActive', 'isFeatured']) {
    if (data[key] !== undefined) upd[key] = data[key];
  }
  if (data.startsAt) upd.startsAt = new Date(data.startsAt);
  if (data.endsAt) upd.endsAt = new Date(data.endsAt);

  return prisma.promotion.update({ where: { id: promoId }, data: upd, include: promoInclude });
}

export async function deletePromotion(ownerId: string, promoId: string) {
  const business = await getBusinessByOwner(ownerId);
  await prisma.promotion.update({ where: { id: promoId, businessId: business.id }, data: { deletedAt: new Date() } });
}

// ===================== COUPONS =====================

export async function listCoupons(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status, search, promotionId } = filters;
  const where: any = { businessId: business.id };
  if (status) where.status = status;
  if (promotionId) where.promotionId = promotionId;
  if (search) where.OR = [
    { code: { contains: search, mode: 'insensitive' } },
    { client: { firstName: { contains: search, mode: 'insensitive' } } },
  ];
  const skip = (page - 1) * limit;
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({ where, include: { promotion: { select: { id: true, title: true } }, client: { select: { id: true, firstName: true, lastName: true } } }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.coupon.count({ where }),
  ]);
  return { coupons, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createCoupon(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const coupon = await prisma.coupon.create({
    data: {
      promotionId: data.promotionId || null,
      businessId: business.id,
      clientId: data.clientId || null,
      code: data.code || generateCode('CPN'),
      discountValue: data.discountValue || null,
      discountType: data.discountType || null,
      maxUses: data.maxUses || 1,
      minOrderAmount: data.minOrderAmount || null,
      newCustomerOnly: data.newCustomerOnly || false,
      vipOnly: data.vipOnly || false,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  return coupon;
}

// ===================== BUNDLES =====================

export async function listBundles(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, isActive } = filters;
  const where: any = { businessId: business.id, deletedAt: null };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  const skip = (page - 1) * limit;
  const [bundles, total] = await Promise.all([
    prisma.bundle.findMany({ where, include: { items: true, promotion: { select: { id: true, title: true } } }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.bundle.count({ where }),
  ]);
  return { bundles, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createBundle(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const items = data.items || [];
  const originalPrice = items.reduce((s: number, i: any) => s + Number(i.unitPrice) * (i.quantity || 1), 0);
  const bundlePrice = data.bundlePrice || originalPrice;

  const bundle = await prisma.bundle.create({
    data: {
      promotionId: data.promotionId || null,
      businessId: business.id,
      name: data.name,
      description: data.description || null,
      originalPrice,
      bundlePrice,
      savings: originalPrice - bundlePrice,
      image: data.image || null,
      items: { create: items.map((i: any) => ({ productId: i.productId, serviceId: i.serviceId, menuItemId: i.menuItemId, name: i.name, quantity: i.quantity || 1, unitPrice: i.unitPrice })) },
    },
    include: { items: true },
  });
  return bundle;
}

// ===================== CAMPAIGNS =====================

export async function listCampaigns(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status } = filters;
  const where: any = { businessId: business.id };
  if (status) where.status = status;
  const skip = (page - 1) * limit;
  const [campaigns, total] = await Promise.all([
    prisma.marketingCampaign.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.marketingCampaign.count({ where }),
  ]);
  return { campaigns, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createCampaign(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  return prisma.marketingCampaign.create({
    data: {
      businessId: business.id,
      promotionId: data.promotionId || null,
      name: data.name,
      description: data.description || null,
      channels: data.channels || ['WHATSAPP'],
      targetAudience: data.targetAudience || 'ALL',
      targetIds: data.targetIds || [],
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      message: data.message || null,
      imageUrl: data.imageUrl || null,
      linkUrl: data.linkUrl || null,
    },
  });
}

// ===================== LOYALTY =====================

export async function getLoyaltyProgram(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  let program = await prisma.loyaltyProgram.findUnique({ where: { businessId: business.id } });
  if (!program) {
    program = await prisma.loyaltyProgram.create({ data: { businessId: business.id } });
  }
  return program;
}

export async function updateLoyaltyProgram(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const upd: any = {};
  for (const key of ['isActive', 'pointsPerAmount', 'pointsValue', 'expiryDays', 'autoEnroll', 'tiers', 'bronzeMinPoints', 'silverMinPoints', 'goldMinPoints', 'platinumMinPoints', 'cashbackPercent', 'birthdayBonus', 'birthdayPromoId']) {
    if (data[key] !== undefined) upd[key] = data[key];
  }
  return prisma.loyaltyProgram.upsert({
    where: { businessId: business.id },
    create: { businessId: business.id, ...upd },
    update: upd,
  });
}

export async function getClientLoyalty(ownerId: string, clientId: string) {
  const business = await getBusinessByOwner(ownerId);
  let lp = await prisma.loyaltyPoints.findUnique({ where: { businessId_clientId: { businessId: business.id, clientId } } });
  if (!lp) {
    lp = await prisma.loyaltyPoints.create({ data: { businessId: business.id, clientId } });
  }
  return prisma.loyaltyPoints.findUnique({
    where: { id: lp.id },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
}

// ===================== STATS =====================

export async function getPromoStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id };

  const [activePromos, totalPromos, totalCoupons, activeCoupons, totalCampaigns, totalBundles, totalUsage, totalLoyaltyPoints] = await Promise.all([
    prisma.promotion.count({ where: { ...where, isActive: true, deletedAt: null } }),
    prisma.promotion.count({ where: { ...where, deletedAt: null } }),
    prisma.coupon.count({ where }),
    prisma.coupon.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.marketingCampaign.count({ where }),
    prisma.bundle.count({ where: { ...where, deletedAt: null } }),
    prisma.promotionLog.count({ where: { ...where, action: 'APPLIED' } }),
    prisma.loyaltyPoints.aggregate({ where: { ...where }, _sum: { points: true } }),
  ]);

  return { activePromos, totalPromos, totalCoupons, activeCoupons, totalCampaigns, totalBundles, totalUsage, totalLoyaltyPoints: totalLoyaltyPoints._sum.points || 0 };
}
`;

const controllerContent = `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as promoService from '../services/promotions';

// ===================== PROMOTIONS =====================

export const listPromotions = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await promoService.listPromotions(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getPromotion = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const promo = await promoService.getPromotion(req.user.id, req.params.id);
  res.json({ success: true, data: promo });
});

export const createPromotion = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const promo = await promoService.createPromotion(req.user.id, req.body);
  res.status(201).json({ success: true, data: promo, message: 'Promotion cr\u00e9\u00e9e' });
});

export const updatePromotion = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const promo = await promoService.updatePromotion(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: promo, message: 'Promotion mise \u00e0 jour' });
});

export const deletePromotion = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  await promoService.deletePromotion(req.user.id, req.params.id);
  res.json({ success: true, message: 'Promotion supprim\u00e9e' });
});

// ===================== COUPONS =====================

export const listCoupons = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await promoService.listCoupons(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const createCoupon = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const coupon = await promoService.createCoupon(req.user.id, req.body);
  res.status(201).json({ success: true, data: coupon, message: 'Coupon cr\u00e9\u00e9' });
});

// ===================== BUNDLES =====================

export const listBundles = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await promoService.listBundles(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const createBundle = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const bundle = await promoService.createBundle(req.user.id, req.body);
  res.status(201).json({ success: true, data: bundle, message: 'Pack cr\u00e9\u00e9' });
});

// ===================== CAMPAIGNS =====================

export const listCampaigns = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await promoService.listCampaigns(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const createCampaign = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const campaign = await promoService.createCampaign(req.user.id, req.body);
  res.status(201).json({ success: true, data: campaign, message: 'Campagne cr\u00e9\u00e9e' });
});

// ===================== LOYALTY =====================

export const getLoyaltyProgram = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const program = await promoService.getLoyaltyProgram(req.user.id);
  res.json({ success: true, data: program });
});

export const updateLoyaltyProgram = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const program = await promoService.updateLoyaltyProgram(req.user.id, req.body);
  res.json({ success: true, data: program, message: 'Programme fid\u00e9lit\u00e9 mis \u00e0 jour' });
});

export const getClientLoyalty = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const loyalty = await promoService.getClientLoyalty(req.user.id, req.params.clientId);
  res.json({ success: true, data: loyalty });
});

// ===================== STATS =====================

export const getPromoStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const stats = await promoService.getPromoStats(req.user.id);
  res.json({ success: true, data: stats });
});
`;

const routesContent = `import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listPromotions, getPromotion, createPromotion, updatePromotion, deletePromotion,
  listCoupons, createCoupon,
  listBundles, createBundle,
  listCampaigns, createCampaign,
  getLoyaltyProgram, updateLoyaltyProgram, getClientLoyalty,
  getPromoStats,
} from '../controllers/promotions';

const router = Router();

router.use(authMiddleware);

// Promotions
router.get('/promotions', listPromotions);
router.get('/promotions/:id', getPromotion);
router.post('/promotions', createPromotion);
router.patch('/promotions/:id', updatePromotion);
router.delete('/promotions/:id', deletePromotion);

// Coupons
router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);

// Bundles
router.get('/bundles', listBundles);
router.post('/bundles', createBundle);

// Campaigns
router.get('/campaigns', listCampaigns);
router.post('/campaigns', createCampaign);

// Loyalty
router.get('/loyalty/program', getLoyaltyProgram);
router.put('/loyalty/program', updateLoyaltyProgram);
router.get('/loyalty/clients/:clientId', getClientLoyalty);

// Stats
router.get('/stats', getPromoStats);

export default router;
`;

const files = [
  { path: path.join(backendDir, 'services', 'promotions.ts'), content: serviceContent },
  { path: path.join(backendDir, 'controllers', 'promotions.ts'), content: controllerContent },
  { path: path.join(backendDir, 'routes', 'promotions.ts'), content: routesContent },
];

for (const file of files) {
  fs.mkdirSync(path.dirname(file.path), { recursive: true });
  fs.writeFileSync(file.path, file.content, 'utf-8');
  console.log('Created:', file.path);
}

console.log('Module 9 backend generated');
