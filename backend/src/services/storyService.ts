import { prisma } from '../lib/db';
import { logger } from '../lib/logger';
import { AppError } from '../middlewares/errorHandler';

export interface StorySticker {
  id: string;
  type: 'PRODUCT' | 'PROMO' | 'LINK' | 'POLL' | 'QUESTION' | 'LOCATION' | 'HASHTAG';
  label: string;
  value: string;
  positionX: number;
  positionY: number;
  style?: Record<string, string>;
}

export interface CreateStoryInput {
  businessId: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
  mediaUrl: string;
  caption?: string;
  linkTargetType?: string;
  linkTargetId?: string;
  linkUrl?: string;
  stickers?: StorySticker[];
  isHighlight?: boolean;
  expiresInHours?: number;
}

export interface UpdateStoryInput {
  caption?: string;
  linkTargetType?: string;
  linkTargetId?: string;
  linkUrl?: string;
  stickers?: StorySticker[];
  isActive?: boolean;
  isHighlight?: boolean;
}

export interface CreateFeedItemInput {
  businessId: string;
  type: string;
  referenceId?: string;
  mediaUrl?: string;
  title?: string;
  description?: string;
  linkTargetType?: string;
  linkTargetId?: string;
  linkUrl?: string;
  isFeatured?: boolean;
  expiresAt?: Date;
}

export async function getActiveStories(userId?: string, limit = 50) {
  const stories = await prisma.story.findMany({
    where: {
      isActive: true,
      expiresAt: { gte: new Date() },
      business: { isActive: true, isVerified: true },
    },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true, type: true } },
      views: userId ? { where: { userId } } : false,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const grouped = new Map<string, { business: any; stories: typeof stories; allViewed: boolean }>();
  for (const story of stories) {
    const bizId = story.businessId;
    if (!grouped.has(bizId)) {
      grouped.set(bizId, {
        business: story.business,
        stories: [],
        allViewed: userId ? true : false,
      });
    }
    const group = grouped.get(bizId)!;
    group.stories.push(story);
    if (userId && story.views.length === 0) {
      group.allViewed = false;
    }
  }

  return Array.from(grouped.values());
}

export async function getBusinessStories(businessId: string, userId?: string) {
  return prisma.story.findMany({
    where: { businessId, isActive: true, expiresAt: { gte: new Date() } },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
      views: userId ? { where: { userId } } : false,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createStory(data: CreateStoryInput) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));

  const story = await prisma.story.create({
    data: {
      businessId: data.businessId,
      mediaType: data.mediaType as any,
      mediaUrl: data.mediaUrl,
      caption: data.caption,
      linkTargetType: (data.linkTargetType || null) as any,
      linkTargetId: data.linkTargetId || null,
      linkUrl: data.linkUrl || null,
      stickers: (data.stickers || []) as any,
      isHighlight: data.isHighlight || false,
      expiresAt,
    },
    include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
  });

  await prisma.feedItem.create({
    data: {
      businessId: data.businessId,
      type: 'STORY' as any,
      referenceId: story.id,
      mediaUrl: data.mediaUrl,
      title: data.caption,
      linkTargetType: (data.linkTargetType || null) as any,
      linkTargetId: data.linkTargetId || null,
      linkUrl: data.linkUrl || null,
      expiresAt,
    },
  });

  return story;
}

export async function updateStory(storyId: string, businessId: string, data: UpdateStoryInput) {
  const existing = await prisma.story.findFirst({ where: { id: storyId, businessId } });
  if (!existing) throw new AppError('Story non trouvée', 404);

  return prisma.story.update({
    where: { id: storyId },
    data: {
      ...(data.caption !== undefined && { caption: data.caption }),
      ...(data.linkTargetType !== undefined && { linkTargetType: data.linkTargetType as any }),
      ...(data.linkTargetId !== undefined && { linkTargetId: data.linkTargetId }),
      ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
      ...(data.stickers !== undefined && { stickers: data.stickers as any }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.isHighlight !== undefined && { isHighlight: data.isHighlight }),
    },
    include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
  });
}

export async function addStorySticker(storyId: string, businessId: string, sticker: StorySticker) {
  const existing = await prisma.story.findFirst({ where: { id: storyId, businessId } });
  if (!existing) throw new AppError('Story non trouvée', 404);

  const currentStickers = (existing.stickers as unknown as StorySticker[]) || [];
  currentStickers.push(sticker);

  return prisma.story.update({
    where: { id: storyId },
    data: { stickers: currentStickers as any },
  });
}

export async function removeStorySticker(storyId: string, businessId: string, stickerId: string) {
  const existing = await prisma.story.findFirst({ where: { id: storyId, businessId } });
  if (!existing) throw new AppError('Story non trouvée', 404);

  const currentStickers = (existing.stickers as unknown as StorySticker[]) || [];
  const filtered = currentStickers.filter((s) => s.id !== stickerId);

  return prisma.story.update({
    where: { id: storyId },
    data: { stickers: filtered as any },
  });
}

export async function getBusinessHighlights(businessId: string) {
  return prisma.story.findMany({
    where: { businessId, isHighlight: true, isActive: true },
    include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function viewStory(storyId: string, userId?: string, visitorId?: string) {
  if (!userId && !visitorId) return;
  const where: any = { storyId };
  if (userId) where.userId = userId;
  else if (visitorId) where.visitorId = visitorId;

  const existing = await prisma.storyView.findFirst({ where });
  if (existing) return;

  await prisma.storyView.create({ data: { storyId, userId, visitorId } });
  await prisma.story.update({ where: { id: storyId }, data: { viewsCount: { increment: 1 } } });
}

export async function recordStoryClick(storyId: string) {
  await prisma.story.update({ where: { id: storyId }, data: { clicksCount: { increment: 1 } } });
}

export async function deleteStory(storyId: string, businessId: string) {
  const story = await prisma.story.findFirst({ where: { id: storyId, businessId } });
  if (!story) throw new AppError('Story non trouvée', 404);
  await prisma.story.delete({ where: { id: storyId } });
}

export async function getFeedItems(params: {
  types?: string[];
  businessId?: string;
  page?: number;
  limit?: number;
}) {
  const { types, businessId, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
    OR: [{ expiresAt: { gte: new Date() } }, { expiresAt: null }],
  };

  if (types?.length) where.type = { in: types };
  if (businessId) where.businessId = businessId;

  const [items, total] = await Promise.all([
    prisma.feedItem.findMany({
      where,
      include: {
        business: {
          select: { id: true, name: true, slug: true, logo: true, type: true, city: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.feedItem.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createFeedItem(data: CreateFeedItemInput) {
  return prisma.feedItem.create({
    data: {
      businessId: data.businessId,
      type: data.type as any,
      referenceId: data.referenceId,
      mediaUrl: data.mediaUrl,
      title: data.title,
      description: data.description,
      linkTargetType: (data.linkTargetType || null) as any,
      linkTargetId: data.linkTargetId || null,
      linkUrl: data.linkUrl || null,
      isFeatured: data.isFeatured || false,
      expiresAt: data.expiresAt || null,
    },
    include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
  });
}

export async function deleteFeedItem(feedItemId: string, businessId: string) {
  const item = await prisma.feedItem.findFirst({ where: { id: feedItemId, businessId } });
  if (!item) throw new AppError('Feed item non trouvé', 404);
  await prisma.feedItem.delete({ where: { id: feedItemId } });
}

export async function expireOldStories() {
  const result = await prisma.story.updateMany({
    where: { expiresAt: { lt: new Date() }, isActive: true },
    data: { isActive: false },
  });
  if (result.count > 0) logger.info('StoryService: expire ' + result.count + ' stories');
  return result.count;
}

export async function expireOldFeedItems() {
  const result = await prisma.feedItem.updateMany({
    where: { expiresAt: { lt: new Date() }, isActive: true },
    data: { isActive: false },
  });
  return result.count;
}
