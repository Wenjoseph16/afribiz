import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!business.modules.includes('PROMOTIONS')) throw new AppError('Module Promotions non activé', 403);
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
    const startsAt: any = {};
    if (dateFrom) startsAt.gte = new Date(dateFrom);
    if (dateTo) startsAt.lte = new Date(dateTo + 'T23:59:59Z');
    where.startsAt = startsAt;
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
  if (!promo) throw new AppError('Promotion non trouvée', 404);
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
  if (!existing) throw new AppError('Promotion non trouvée', 404);

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
  await prisma.promotion.update({ where: { id: promoId }, data: { deletedAt: new Date() } });
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
      isNewCustomer: data.isNewCustomer || false,
      isVipOnly: data.isVipOnly || false,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  return coupon;
}

// ===================== BUNDLES =====================

export async function listBundles(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, isActive } = filters;
  const where: any = { businessId: business.id };
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
      totalPrice: originalPrice,
      bundlePrice,
      savings: originalPrice - bundlePrice,
      image: data.image || null,
      items: { create: items.map((i: any) => ({ itemType: i.itemType || (i.productId ? 'PRODUCT' : i.menuItemId ? 'MENU_ITEM' : 'OTHER'), itemId: i.itemId || i.productId || i.menuItemId || i.serviceId || '', quantity: i.quantity || 1 })) },
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
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      message: data.message || null,
      image: data.image || null,
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

export async function redeemPoints(userId: string, businessId: string, points: number, reward?: { title?: string; type?: string }) {
  const lp = await prisma.loyaltyPoints.findUnique({
    where: { businessId_clientId: { businessId, clientId: userId } },
  });
  if (!lp) throw new AppError('Aucun point de fidélité trouvé pour ce commerce', 404);
  if (lp.totalPoints < points) throw new AppError('Points insuffisants', 400);

  const [updated] = await prisma.$transaction([
    prisma.loyaltyPoints.update({
      where: { id: lp.id },
      data: { totalPoints: { decrement: points } },
    }),
    prisma.loyaltyTransaction.create({
      data: {
        loyaltyId: lp.id,
        type: 'REDEEMED',
        points: -points,
        description: reward?.title || `Échange de ${points} points`,
        reference: `REDEEM_${Date.now()}`,
      },
    }),
  ]);

  const couponCode = `LOYALTY_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  return {
    remainingPoints: updated.totalPoints,
    redeemedPoints: points,
    reward: reward?.title || 'Récompense',
    couponCode,
    message: `Félicitations ! Vous avez échangé ${points} points. Utilisez le code ${couponCode} lors de votre prochain achat.`,
  };
}

// ===================== STATS =====================

export async function getPromoStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id };

  const [activePromos, totalPromos, totalCoupons, activeCoupons, totalCampaigns, totalBundles, totalUsage, totalLoyaltyPoints] = await Promise.all([
    prisma.promotion.count({ where: { ...where, isActive: true } }),
    prisma.promotion.count({ where: { ...where } }),
    prisma.coupon.count({ where }),
    prisma.coupon.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.marketingCampaign.count({ where }),
    prisma.bundle.count({ where }),
    prisma.promotionLog.count({ where: { ...where, action: 'APPLIED' } }),
    prisma.loyaltyPoints.aggregate({ where: { ...where }, _sum: { totalPoints: true } }),
  ]);

  return { activePromos, totalPromos, totalCoupons, activeCoupons, totalCampaigns, totalBundles, totalUsage, totalLoyaltyPoints: totalLoyaltyPoints._sum.totalPoints || 0 };
}
