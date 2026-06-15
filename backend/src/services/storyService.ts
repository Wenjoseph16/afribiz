import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

export interface CreateStoryInput {
  businessId: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'TEXT';
  mediaUrl: string;
  caption?: string;
  linkTargetType?: string;
  linkTargetId?: string;
  linkUrl?: string;
  expiresInHours?: number;
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
      grouped.set(bizId, { business: story.business, stories: [], allViewed: userId ? true : false });
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
  if (!story) throw new Error('Story non trouvée');
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
        business: { select: { id: true, name: true, slug: true, logo: true, type: true, city: true } },
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
  if (!item) throw new Error('Feed item non trouvé');
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
