import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

export async function getActiveLives(params?: { status?: string; businessId?: string; page?: number; limit?: number }) {
  const { status, businessId, page = 1, limit = 20 } = params || {};
  const skip = (page - 1) * limit;
  const where: any = {};
  if (status) where.status = status;
  if (businessId) where.businessId = businessId;

  const [items, total] = await Promise.all([
    prisma.live.findMany({
      where,
      include: {
        business: { select: { id: true, name: true, slug: true, logo: true, type: true } },
        _count: { select: { products: true, participants: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.live.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getLiveById(liveId: string, includeProducts = true, includeChat = true) {
  return prisma.live.findUnique({
    where: { id: liveId },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true, type: true, city: true } },
      products: includeProducts ? { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } : false,
      chats: includeChat ? { orderBy: { createdAt: 'desc' }, take: 50 } : false,
      _count: { select: { participants: true, reactions: true } },
    },
  });
}

export async function createLive(data: {
  businessId: string;
  title: string;
  description?: string;
  coverImage?: string;
  streamUrl?: string;
  hasEscrow?: boolean;
  scheduledAt?: string;
  products?: Array<{ name: string; description?: string; price: number; currency?: string; image?: string; stock?: number }>;
}) {
  const live = await prisma.live.create({
    data: {
      businessId: data.businessId,
      title: data.title,
      description: data.description,
      coverImage: data.coverImage,
      streamUrl: data.streamUrl,
      hasEscrow: data.hasEscrow || false,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: data.scheduledAt ? 'SCHEDULED' : 'LIVE',
    },
  });

  // Creer les produits lives
  if (data.products?.length) {
    await prisma.liveProduct.createMany({
      data: data.products.map((p, i) => ({
        liveId: live.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency || 'FCFA',
        image: p.image,
        stock: p.stock || 0,
        remainingStock: p.stock || 0,
        sortOrder: i,
      })),
    });
  }

  // Ajouter au feed
  await prisma.feedItem.create({
    data: {
      businessId: data.businessId,
      type: 'LIVE',
      referenceId: live.id,
      mediaUrl: data.coverImage,
      title: data.title,
      description: data.description,
      linkTargetType: 'CUSTOM_LINK',
      linkTargetId: live.id,
    },
  });

  return getLiveById(live.id);
}

export async function startLive(liveId: string, businessId: string, streamUrl?: string) {
  const live = await prisma.live.findFirst({ where: { id: liveId, businessId } });
  if (!live) throw new Error('Live non trouvé');
  if (live.status !== 'SCHEDULED') throw new Error('Le live doit être planifié pour être démarré');

  return prisma.live.update({
    where: { id: liveId },
    data: { status: 'LIVE', startedAt: new Date(), streamUrl: streamUrl || live.streamUrl },
  });
}

export async function endLive(liveId: string, businessId: string) {
  const live = await prisma.live.findFirst({ where: { id: liveId, businessId } });
  if (!live) throw new Error('Live non trouvé');

  return prisma.live.update({
    where: { id: liveId },
    data: { status: 'ENDED', endedAt: new Date() },
  });
}

export async function updateLiveStatus(liveId: string, status: string, businessId: string) {
  const live = await prisma.live.findFirst({ where: { id: liveId, businessId } });
  if (!live) throw new Error('Live non trouvé');

  const data: any = { status };
  if (status === 'LIVE') data.startedAt = new Date();
  if (status === 'ENDED') data.endedAt = new Date();

  return prisma.live.update({ where: { id: liveId }, data });
}

export async function addLiveProduct(liveId: string, businessId: string, data: any) {
  const live = await prisma.live.findFirst({ where: { id: liveId, businessId } });
  if (!live) throw new Error('Live non trouvé');

  return prisma.liveProduct.create({
    data: {
      liveId,
      productId: data.productId || null,
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency || 'FCFA',
      image: data.image,
      stock: data.stock || 0,
      remainingStock: data.stock || 0,
      sortOrder: data.sortOrder || 0,
    },
  });
}

export async function updateLiveProduct(productId: string, businessId: string, data: any) {
  const product = await prisma.liveProduct.findUnique({
    where: { id: productId },
    include: { live: { select: { businessId: true } } },
  });
  if (!product || product.live.businessId !== businessId) throw new Error('Produit non trouvé');

  return prisma.liveProduct.update({
    where: { id: productId },
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      currency: data.currency,
      image: data.image,
      stock: data.stock,
      remainingStock: data.remainingStock,
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    },
  });
}

export async function removeLiveProduct(productId: string, businessId: string) {
  const product = await prisma.liveProduct.findUnique({
    where: { id: productId },
    include: { live: { select: { businessId: true } } },
  });
  if (!product || product.live.businessId !== businessId) throw new Error('Produit non trouvé');
  await prisma.liveProduct.delete({ where: { id: productId } });
}

export async function joinLive(liveId: string, userId?: string, userName?: string) {
  const existing = userId ? await prisma.liveParticipant.findFirst({
    where: { liveId, userId, isActive: true },
  }) : null;

  if (!existing) {
    await prisma.liveParticipant.create({
      data: { liveId, userId, userName: userName || 'Anonyme' },
    });
    await prisma.live.update({
      where: { id: liveId },
      data: {
        viewerCount: { increment: 1 },
        viewerCountPeak: { increment: 1 },
      },
    });
  }
}

export async function leaveLive(liveId: string, userId?: string) {
  if (userId) {
    await prisma.liveParticipant.updateMany({
      where: { liveId, userId, isActive: true },
      data: { isActive: false, leftAt: new Date() },
    });
  }
  const current = await prisma.live.findUnique({ where: { id: liveId }, select: { viewerCount: true } });
  if (current && current.viewerCount > 0) {
    await prisma.live.update({
      where: { id: liveId },
      data: { viewerCount: { decrement: 1 } },
    });
  }
}

export async function sendChat(liveId: string, userId: string | undefined, userName: string, message: string) {
  return prisma.liveChat.create({
    data: { liveId, userId, userName, message },
  });
}

export async function sendReaction(liveId: string, userId: string | undefined, emoji: string) {
  return prisma.liveReaction.create({
    data: { liveId, userId, emoji },
  });
}

export async function getLiveChats(liveId: string, limit = 50) {
  return prisma.liveChat.findMany({
    where: { liveId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getLiveStats(businessId: string) {
  const [totalLives, activeLives, totalViewers, totalChats] = await Promise.all([
    prisma.live.count({ where: { businessId } }),
    prisma.live.count({ where: { businessId, status: 'LIVE' } }),
    prisma.live.aggregate({ where: { businessId }, _sum: { viewerCountPeak: true } }),
    prisma.liveChat.count({ where: { live: { businessId } } }),
  ]);

  return { totalLives, activeLives, totalViewers: totalViewers._sum.viewerCountPeak || 0, totalChats };
}
