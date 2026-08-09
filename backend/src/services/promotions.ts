import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishPromotionStarted, publishCampaignScheduled } from '../events/publishers';
import { autoShareToSocial } from './socialShareService';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, modules: true, settings: true },
  });
  if (!business) throw new AppError('Business not found', 404);
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
  const {
    page: rawPage = 1,
    limit: rawLimit = 20,
    promotionType,
    isActive,
    isFeatured,
    search,
    dateFrom,
    dateTo,
  } = filters;
  const page = Math.max(1, parseInt(String(rawPage), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(rawLimit), 10) || 20));
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
    prisma.promotion.findMany({
      where,
      include: promoInclude,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.promotion.count({ where }),
  ]);
  return { promotions, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPromotion(ownerId: string, promoId: string) {
  const business = await getBusinessByOwner(ownerId);
  const promo = await prisma.promotion.findFirst({
    where: { id: promoId, businessId: business.id },
    include: promoInclude,
  });
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
  publishPromotionStarted({
    userId: ownerId,
    businessId: business.id,
    promotionId: promo.id,
    promotionName: promo.title,
  });

  autoShareToSocial({
    type: 'PROMOTION',
    title: promo.title || '',
    description: promo.description || undefined,
    imageUrl: promo.image || promo.bannerImage || undefined,
    link: `/business/${business.name || ''}/promotions/${promo.id}`,
    businessId: business.id,
    businessName: business.name || '',
    ownerId,
  }).catch(() => {});

  return promo;
}

export async function updatePromotion(ownerId: string, promoId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.promotion.findFirst({
    where: { id: promoId, businessId: business.id },
  });
  if (!existing) throw new AppError('Promotion non trouvée', 404);

  const upd: any = {};
  for (const key of [
    'title',
    'description',
    'promotionType',
    'discountValue',
    'code',
    'targetType',
    'targetIds',
    'minOrderAmount',
    'maxUsageCount',
    'perCustomerLimit',
    'conditions',
    'badgeLabel',
    'image',
    'bannerImage',
    'autoApply',
    'isActive',
    'isFeatured',
  ]) {
    if (data[key] !== undefined) upd[key] = data[key];
  }
  if (data.startsAt) upd.startsAt = new Date(data.startsAt);
  if (data.endsAt) upd.endsAt = new Date(data.endsAt);

  return prisma.promotion.update({ where: { id: promoId }, data: upd, include: promoInclude });
}

export async function deletePromotion(ownerId: string, promoId: string) {
  await prisma.promotion.update({ where: { id: promoId }, data: { deletedAt: new Date() } });
}

// ===================== COUPONS =====================

export async function listCoupons(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page: rawPage = 1, limit: rawLimit = 20, status, search, promotionId } = filters;
  const page = Math.max(1, parseInt(String(rawPage), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(rawLimit), 10) || 20));
  const where: any = { businessId: business.id };
  if (status) where.status = status;
  if (promotionId) where.promotionId = promotionId;
  if (search)
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { client: { firstName: { contains: search, mode: 'insensitive' } } },
    ];
  const skip = (page - 1) * limit;
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: {
        promotion: { select: { id: true, title: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
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

// ===================== DISCOUNT ENGINE (partagé checkout classique + épargne) =====================
// C'est LA source de vérité du calcul des remises : le checkout du panier ET la
// validation d'une épargne utilisent ces fonctions. Avant, le calcul était dupliqué
// (et ignoré côté épargne), ce qui donnait des commandes qui ne respectaient pas les promos.

export function computeCouponDiscount(
  coupon: { discountType?: string | null; discountValue?: unknown } | null | undefined,
  subtotal: number
): number {
  if (!coupon) return 0;
  const type = (coupon.discountType || 'PERCENTAGE').toUpperCase();
  const value = Number(coupon.discountValue || 0);
  const raw = type === 'PERCENTAGE' ? subtotal * (value / 100) : value;
  if (!isFinite(raw) || raw <= 0) return 0;
  // La remise ne peut jamais dépasser le sous-total ni être négative
  return Math.max(0, Math.min(Math.round(raw), Math.max(0, Math.round(subtotal))));
}

/**
 * Valide un code promo pour UN commerce précis : le coupon appartient au business
 * (fini les coupons d'un commerce appliqués au panier d'un autre), il est actif,
 * non expiré, sous sa limite d'utilisations, réservé au bon client si ciblé,
 * et le montant minimum est atteint.
 */
export async function findValidCoupon(
  code: string,
  businessId: string,
  subtotal: number,
  clientId?: string | null
) {
  if (!code || !code.trim()) throw new AppError('Code promo requis', 400);
  const coupon = await prisma.coupon.findFirst({
    where: { code: { equals: code.trim(), mode: 'insensitive' } },
  });
  if (!coupon) throw new AppError('Code promo invalide', 404);
  if (coupon.businessId !== businessId) {
    throw new AppError("Ce code promo ne s'applique pas à ce commerce", 400);
  }
  if (coupon.status !== 'ACTIVE') throw new AppError("Ce code promo n'est plus actif", 400);
  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new AppError('Ce code promo a expiré', 400);
  if (coupon.maxUses && coupon.useCount >= coupon.maxUses) {
    throw new AppError("Ce code promo a atteint sa limite d'utilisations", 400);
  }
  if (coupon.clientId && clientId && coupon.clientId !== clientId) {
    throw new AppError('Ce code promo est réservé à un autre client', 403);
  }
  if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
    throw new AppError(
      `Montant minimum de commande non atteint (${Number(coupon.minOrderAmount)} FCFA)`,
      400
    );
  }
  return coupon;
}

/** Trace l'application d'une remise (alimente la stat « totalUsage » du dashboard marketing). */
export async function logPromotionApplied(
  businessId: string,
  data: {
    promotionId?: string | null;
    couponId?: string | null;
    description: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await prisma.promotionLog.create({
      data: {
        businessId,
        promotionId: data.promotionId || null,
        couponId: data.couponId || null,
        action: 'APPLIED',
        description: data.description,
        metadata: (data.metadata as any) || undefined,
      },
    });
  } catch {
    // Log non bloquant : la vente ne doit jamais échouer pour une trace
  }
}

/**
 * Promotions en « application automatique » (autoApply=true) actives maintenant :
 * une promotion créée par le business doit réellement s'appliquer au panier.
 * Retourne la meilleure remise (celle qui économise le plus au client).
 */
export async function getAutoApplyDiscount(
  businessId: string,
  items: Array<{ productId?: string | null; serviceId?: string | null; total?: unknown }>,
  subtotal: number
) {
  const now = new Date();
  const promos = await prisma.promotion.findMany({
    where: {
      businessId,
      isActive: true,
      autoApply: true,
      deletedAt: null,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    take: 10,
  });
  if (promos.length === 0) return null;

  let best: { promotion: (typeof promos)[number]; discount: number } | null = null;
  for (const promo of promos) {
    let applicableSubtotal = subtotal;
    if (promo.targetType !== 'ALL') {
      applicableSubtotal = items
        .filter((it) => {
          if (promo.targetType === 'PRODUCT' && it.productId && promo.targetIds.includes(it.productId)) return true;
          if (promo.targetType === 'SERVICE' && it.serviceId && promo.targetIds.includes(it.serviceId)) return true;
          return false;
        })
        .reduce((s, it) => s + Number(it.total || 0), 0);
    }
    if (applicableSubtotal <= 0) continue;
    if (promo.minOrderAmount && applicableSubtotal < Number(promo.minOrderAmount)) continue;
    if (promo.maxUsageCount && promo.usageCount >= promo.maxUsageCount) continue;
    const discount = computeCouponDiscount(
      { discountType: promo.promotionType, discountValue: promo.discountValue },
      applicableSubtotal
    );
    if (discount <= 0) continue;
    if (!best || discount > best.discount) best = { promotion: promo, discount };
  }
  return best;
}

// ===================== BUNDLES =====================

export async function listBundles(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page: rawPage = 1, limit: rawLimit = 20, isActive } = filters;
  const page = Math.max(1, parseInt(String(rawPage), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(rawLimit), 10) || 20));
  const where: any = { businessId: business.id };
  if (isActive !== undefined) where.isActive = isActive === 'true';
  const skip = (page - 1) * limit;
  const [bundles, total] = await Promise.all([
    prisma.bundle.findMany({
      where,
      include: { items: true, promotion: { select: { id: true, title: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bundle.count({ where }),
  ]);
  return { bundles, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createBundle(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const items = data.items || [];
  const originalPrice = items.reduce(
    (s: number, i: any) => s + Number(i.unitPrice) * (i.quantity || 1),
    0
  );
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
      items: {
        create: items.map((i: any) => ({
          itemType: i.itemType || (i.productId ? 'PRODUCT' : i.menuItemId ? 'MENU_ITEM' : 'OTHER'),
          itemId: i.itemId || i.productId || i.menuItemId || i.serviceId || '',
          quantity: i.quantity || 1,
        })),
      },
    },
    include: { items: true },
  });
  return bundle;
}

// ===================== CAMPAIGNS =====================

export async function listCampaigns(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page: rawPage = 1, limit: rawLimit = 20, status } = filters;
  const page = Math.max(1, parseInt(String(rawPage), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(rawLimit), 10) || 20));
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
  const campaign = await prisma.marketingCampaign.create({
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
  publishCampaignScheduled({ userId: ownerId, businessId: business.id, campaignId: campaign.id });
  return campaign;
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
  for (const key of [
    'isActive',
    'pointsPerAmount',
    'pointsValue',
    'expiryDays',
    'autoEnroll',
    'tiers',
    'bronzeMinPoints',
    'silverMinPoints',
    'goldMinPoints',
    'platinumMinPoints',
    'cashbackPercent',
    'birthdayBonus',
    'birthdayPromoId',
  ]) {
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
  let lp = await prisma.loyaltyPoints.findUnique({
    where: { businessId_clientId: { businessId: business.id, clientId } },
  });
  if (!lp) {
    lp = await prisma.loyaltyPoints.create({ data: { businessId: business.id, clientId } });
  }
  return prisma.loyaltyPoints.findUnique({
    where: { id: lp.id },
    include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
}

export async function redeemPoints(
  userId: string,
  businessId: string,
  points: number,
  reward?: { title?: string; type?: string }
) {
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

  const [
    activePromos,
    totalPromos,
    totalCoupons,
    activeCoupons,
    totalCampaigns,
    totalBundles,
    totalUsage,
    totalLoyaltyPoints,
  ] = await Promise.all([
    prisma.promotion.count({ where: { ...where, isActive: true } }),
    prisma.promotion.count({ where: { ...where } }),
    prisma.coupon.count({ where }),
    prisma.coupon.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.marketingCampaign.count({ where }),
    prisma.bundle.count({ where }),
    prisma.promotionLog.count({ where: { ...where, action: 'APPLIED' } }),
    prisma.loyaltyPoints.aggregate({ where: { ...where }, _sum: { totalPoints: true } }),
  ]);

  return {
    activePromos,
    totalPromos,
    totalCoupons,
    activeCoupons,
    totalCampaigns,
    totalBundles,
    totalUsage,
    totalLoyaltyPoints: totalLoyaltyPoints._sum.totalPoints || 0,
  };
}
