import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';

type RecommendationType =
  | 'PRODUCT'
  | 'SERVICE'
  | 'BUSINESS'
  | 'EVENT'
  | 'PROMOTION'
  | 'OFFER_FLASH';

export async function getRecommendations(
  userId: string,
  type: RecommendationType,
  page = 1,
  limit = 20
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { country: true, city: true, id: true },
  });

  switch (type) {
    case 'PRODUCT':
      return getProductRecommendations(userId, user?.country, user?.city, page, limit);
    case 'SERVICE':
      return getServiceRecommendations(userId, user?.country, user?.city, page, limit);
    case 'BUSINESS':
      return getBusinessRecommendations(userId, user?.country, user?.city, page, limit);
    case 'EVENT':
      return getEventRecommendations(user?.country, user?.city, page, limit);
    case 'PROMOTION':
      return getPromotionRecommendations(user?.country, user?.city, page, limit);
    case 'OFFER_FLASH':
      return getOfferFlashRecommendations(user?.country, user?.city, page, limit);
    default:
      return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }
}

async function getProductRecommendations(
  userId: string,
  country?: string | null,
  city?: string | null,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const userFavorites = await prisma.favorite.findMany({
    where: { userId, type: 'PRODUCT' },
    select: { referenceId: true },
    take: 20,
  });

  const userOrders = await prisma.order.findMany({
    where: { buyerId: userId },
    select: { id: true },
    take: 10,
  });

  const orderItemProducts =
    userOrders.length > 0
      ? await prisma.orderItem.findMany({
          where: { orderId: { in: userOrders.map((o) => o.id) } },
          select: { productId: true },
          take: 30,
        })
      : [];

  const interactedProductIds = [
    ...userFavorites.map((f) => f.referenceId),
    ...(orderItemProducts.map((i) => i.productId).filter(Boolean) as string[]),
  ];

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(country ? { business: { country } } : {}),
  };

  if (interactedProductIds.length > 0) {
    where.id = { notIn: interactedProductIds };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          score: { select: { overallScore: true } },
        },
      },
      category: { select: { id: true, name: true } },
    },
    take: limit * 3,
  });

  const scored = products.map((p) => {
    const afriScore = p.business?.score?.overallScore || 0;
    const afriWeight = afriScore > 0 ? afriScore / 1000 : 0;
    const ratingWeight = (p.rating || 0) / 5;
    const orderWeight = Math.min((p.orderCount || 0) / 100, 1);
    const score =
      ratingWeight * 0.35 + orderWeight * 0.2 + afriWeight * 0.25 + (p.featured ? 0.2 : 0);
    return { ...p, _score: score };
  });

  const sorted = scored.sort((a, b) => b._score - a._score).slice(skip, skip + limit);
  const total = await prisma.product.count({ where });

  const items = sorted.map(({ _score, ...rest }) => rest);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getServiceRecommendations(
  userId: string,
  country?: string | null,
  city?: string | null,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const where: Prisma.ServiceWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(city ? { business: { city } } : country ? { business: { country } } : {}),
  };

  const services = await prisma.service.findMany({
    where,
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: [{ rating: 'desc' }, { bookingCount: 'desc' }],
    skip,
    take: limit,
  });

  const total = await prisma.service.count({ where });

  return {
    items: services,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getBusinessRecommendations(
  userId: string,
  country?: string | null,
  city?: string | null,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;

  const followedBusinessIds = await prisma.follow.findMany({
    where: { followerId: userId, businessId: { not: null } },
    select: { businessId: true },
  });
  const followedIds = followedBusinessIds.map((f) => f.businessId!).filter(Boolean);

  const where: Prisma.BusinessWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(followedIds.length > 0 ? { id: { notIn: followedIds } } : {}),
    ...(country ? { country } : {}),
  };

  const businesses = await prisma.business.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      type: true,
      city: true,
      country: true,
      rating: true,
      reviewCount: true,
      shortDescription: true,
      isVerified: true,
      isRecommended: true,
      score: { select: { overallScore: true } },
    },
    take: limit * 3,
  });

  const scored = businesses.map((b) => {
    const afriScore = b.score?.overallScore || 0;
    const score =
      (b.isRecommended ? 0.2 : 0) +
      ((b.rating || 0) / 5) * 0.2 +
      Math.min((b.reviewCount || 0) / 200, 1) * 0.15 +
      (afriScore / 1000) * 0.3 +
      (b.isVerified ? 0.15 : 0);
    return { ...b, _score: score };
  });

  const sorted = scored.sort((a, b) => b._score - a._score).slice(skip, skip + limit);
  const total = await prisma.business.count({ where });

  const items = sorted.map(({ _score, score, ...rest }) => rest);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getEventRecommendations(
  country?: string | null,
  city?: string | null,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Prisma.EventWhereInput = {
    isPublished: true,
    isActive: true,
    deletedAt: null,
    startDate: { gte: now },
    ...(country ? { business: { country } } : {}),
  };

  const events = await prisma.event.findMany({
    where,
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { startDate: 'asc' },
    skip,
    take: limit,
  });

  const total = await prisma.event.count({ where });

  return {
    items: events,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getPromotionRecommendations(
  country?: string | null,
  city?: string | null,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Prisma.PromotionWhereInput = {
    isActive: true,
    deletedAt: null,
    ...(country ? { business: { country } } : {}),
    OR: [{ startsAt: null }, { startsAt: { lte: now } }],
    AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
  };

  const promotions = await prisma.promotion.findMany({
    where,
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: limit,
  });

  const total = await prisma.promotion.count({ where });

  return {
    items: promotions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function getOfferFlashRecommendations(
  country?: string | null,
  city?: string | null,
  page = 1,
  limit = 20
) {
  const skip = (page - 1) * limit;
  const now = new Date();

  const where: Prisma.OfferFlashWhereInput = {
    isActive: true,
    startAt: { lte: now },
    endAt: { gte: now },
    ...(country ? { business: { country } } : {}),
  };

  const offers = await prisma.offerFlash.findMany({
    where,
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
    },
    orderBy: [{ isFeatured: 'desc' }, { discountPercent: 'desc' }],
    skip,
    take: limit,
  });

  const total = await prisma.offerFlash.count({ where });

  return {
    items: offers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
