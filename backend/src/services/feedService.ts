import { FeedItemType, Prisma } from '@prisma/client';
import { prisma } from '../lib/db';

export async function createFeedItem(data: {
  businessId: string;
  type: FeedItemType;
  referenceId?: string;
  mediaUrl?: string;
  title?: string;
  description?: string;
  linkUrl?: string;
  isFeatured?: boolean;
  expiresAt?: Date;
}) {
  return prisma.feedItem.create({ data });
}

export async function getFeed(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      country: true,
      city: true,
      followers: { select: { businessId: true, developerId: true } },
      favorites: {
        where: { type: 'BUSINESS' },
        select: { referenceId: true },
        take: 20,
      },
    },
  });

  const followedBusinessIds =
    user?.followers?.filter((f) => f.businessId).map((f) => f.businessId!) || [];
  const favoritedBusinessIds = user?.favorites?.map((f) => f.referenceId) || [];

  const relevantBusinessIds = [...new Set([...followedBusinessIds, ...favoritedBusinessIds])];

  const where: Prisma.FeedItemWhereInput = {
    isActive: true,
    ...(relevantBusinessIds.length > 0 ? { businessId: { in: relevantBusinessIds } } : {}),
  };

  const feedItems = await prisma.feedItem.findMany({
    where: {
      ...where,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: {
      business: {
        select: { id: true, name: true, slug: true, logo: true, type: true },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    skip,
    take: limit,
  });

  const enriched = await enrichFeedItems(feedItems);

  const total = await prisma.feedItem.count({ where });

  return {
    items: enriched,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function enrichFeedItems(items: any[]) {
  return Promise.all(
    items.map(async (item) => {
      let details = null;
      if (item.referenceId) {
        switch (item.type) {
          case 'PRODUCT':
            details = await prisma.product.findUnique({
              where: { id: item.referenceId },
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                currency: true,
                images: true,
                rating: true,
              },
            });
            break;
          case 'SERVICE':
            details = await prisma.service.findUnique({
              where: { id: item.referenceId },
              select: {
                id: true,
                name: true,
                price: true,
                currency: true,
                images: true,
                rating: true,
                duration: true,
              },
            });
            break;
          case 'PROMOTION':
            details = await prisma.promotion.findUnique({
              where: { id: item.referenceId },
              select: {
                id: true,
                title: true,
                discountValue: true,
                promotionType: true,
                endsAt: true,
                image: true,
              },
            });
            break;
          case 'EVENT':
            details = await prisma.event.findUnique({
              where: { id: item.referenceId },
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                address: true,
                city: true,
                coverImage: true,
              },
            });
            break;
          case 'OFFER_FLASH':
            details = await prisma.offerFlash.findUnique({
              where: { id: item.referenceId },
              select: {
                id: true,
                title: true,
                flashPrice: true,
                originalPrice: true,
                endAt: true,
                image: true,
                discountPercent: true,
              },
            });
            break;
          case 'STORY':
            details = await prisma.story.findUnique({
              where: { id: item.referenceId },
              select: { id: true, mediaUrl: true, caption: true, mediaType: true, expiresAt: true },
            });
            break;
          case 'SHORT':
            details = await prisma.short.findUnique({
              where: { id: item.referenceId },
              select: {
                id: true,
                title: true,
                videoUrl: true,
                thumbnailUrl: true,
                duration: true,
                viewsCount: true,
              },
            });
            break;
          case 'RENTAL':
            details = await prisma.rental.findUnique({
              where: { id: item.referenceId },
              select: { id: true, name: true, price: true, currency: true, images: true },
            });
            break;
          case 'LIVE':
            details = await prisma.live.findUnique({
              where: { id: item.referenceId },
              select: {
                id: true,
                title: true,
                streamUrl: true,
                coverImage: true,
                status: true,
                scheduledAt: true,
              },
            });
            break;
        }
      }
      return { ...item, details };
    })
  );
}

export async function getTrendingFeed(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const items = await prisma.feedItem.findMany({
    where: {
      isActive: true,
      isFeatured: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: {
      business: {
        select: { id: true, name: true, slug: true, logo: true, type: true },
      },
    },
    orderBy: { sortOrder: 'asc' },
    skip,
    take: limit,
  });

  const total = await prisma.feedItem.count({
    where: { isActive: true, isFeatured: true },
  });

  const enriched = await enrichFeedItems(items);

  return {
    items: enriched,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
