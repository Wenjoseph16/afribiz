import { prisma } from '../lib/db';

export async function getShorts(params?: { businessId?: string; page?: number; limit?: number }) {
  const { businessId, page = 1, limit = 10 } = params || {};
  const skip = (page - 1) * limit;
  const where: any = { isActive: true };
  if (businessId) where.businessId = businessId;

  const [items, total] = await Promise.all([
    prisma.short.findMany({
      where,
      include: {
        business: { select: { id: true, name: true, slug: true, logo: true, type: true, city: true } },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.short.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getShortById(shortId: string, userId?: string) {
  const short = await prisma.short.findUnique({
    where: { id: shortId },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true, type: true, city: true } },
      comments: { orderBy: { createdAt: 'desc' }, take: 20 },
      _count: { select: { likes: true, comments: true, views: true } },
    },
  });

  if (!short) return null;

  let isLiked = false;
  if (userId) {
    const like = await prisma.shortLike.findUnique({
      where: { shortId_userId: { shortId, userId } },
    });
    isLiked = !!like;
  }

  return { ...short, isLiked };
}

export async function createShort(data: {
  businessId: string;
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  linkTargetType?: string;
  linkTargetId?: string;
  linkUrl?: string;
}) {
  const short = await prisma.short.create({
    data: {
      businessId: data.businessId,
      title: data.title,
      description: data.description,
      videoUrl: data.videoUrl,
      thumbnailUrl: data.thumbnailUrl,
      duration: data.duration || 0,
      linkTargetType: (data.linkTargetType || null) as any,
      linkTargetId: data.linkTargetId || null,
      linkUrl: data.linkUrl || null,
    },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true, type: true } },
    },
  });

  // Ajouter au feed
  await prisma.feedItem.create({
    data: {
      businessId: data.businessId,
      type: 'SHORT',
      referenceId: short.id,
      mediaUrl: data.videoUrl,
      title: data.title,
      description: data.description,
      linkTargetType: (data.linkTargetType || null) as any,
      linkTargetId: data.linkTargetId || null,
      linkUrl: data.linkUrl || null,
    },
  });

  return short;
}

export async function updateShort(shortId: string, businessId: string, data: any) {
  const short = await prisma.short.findFirst({ where: { id: shortId, businessId } });
  if (!short) throw new Error('Short non trouvé');

  return prisma.short.update({
    where: { id: shortId },
    data: {
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      linkTargetType: data.linkTargetType,
      linkTargetId: data.linkTargetId,
      linkUrl: data.linkUrl,
    },
  });
}

export async function deleteShort(shortId: string, businessId: string) {
  const short = await prisma.short.findFirst({ where: { id: shortId, businessId } });
  if (!short) throw new Error('Short non trouvé');
  await prisma.short.delete({ where: { id: shortId } });
}

export async function likeShort(shortId: string, userId: string) {
  const existing = await prisma.shortLike.findUnique({
    where: { shortId_userId: { shortId, userId } },
  });
  if (existing) {
    await prisma.shortLike.delete({ where: { id: existing.id } });
    await prisma.short.update({ where: { id: shortId }, data: { likesCount: { decrement: 1 } } });
    return { liked: false };
  }
  await prisma.shortLike.create({ data: { shortId, userId } });
  await prisma.short.update({ where: { id: shortId }, data: { likesCount: { increment: 1 } } });
  return { liked: true };
}

export async function addComment(shortId: string, userId: string | undefined, userName: string, content: string) {
  const comment = await prisma.shortComment.create({
    data: { shortId, userId, userName, content },
  });
  await prisma.short.update({ where: { id: shortId }, data: { commentsCount: { increment: 1 } } });
  return comment;
}

export async function getComments(shortId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.shortComment.findMany({
      where: { shortId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shortComment.count({ where: { shortId } }),
  ]);
  return { items, total, page, limit };
}

export async function viewShort(shortId: string, userId?: string, visitorId?: string) {
  if (userId) {
    const existing = await prisma.shortView.findUnique({
      where: { shortId_userId: { shortId, userId } },
    });
    if (existing) return;
    await prisma.shortView.create({ data: { shortId, userId } });
  } else if (visitorId) {
    await prisma.shortView.create({ data: { shortId, visitorId } });
  }
  await prisma.short.update({ where: { id: shortId }, data: { viewsCount: { increment: 1 } } });
}

export async function shareShort(shortId: string) {
  await prisma.short.update({ where: { id: shortId }, data: { sharesCount: { increment: 1 } } });
}

export async function saveShort(shortId: string, userId: string) {
  const existing = await prisma.shortSave.findUnique({
    where: { shortId_userId: { shortId, userId } },
  });
  if (existing) {
    await prisma.shortSave.delete({ where: { id: existing.id } });
    return { saved: false };
  }
  await prisma.shortSave.create({ data: { shortId, userId } });
  return { saved: true };
}
