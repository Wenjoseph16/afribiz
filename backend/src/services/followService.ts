import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishFollowed, publishUnfollowed } from '../events/publishers';

export async function follow(
  followerId: string,
  target: { businessId?: string; developerId?: string }
) {
  if (!target.businessId && !target.developerId) {
    throw new AppError('businessId ou developerId requis', 400);
  }

  if (target.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: target.businessId, deletedAt: null },
    });
    if (!business) throw new AppError('Business non trouvé', 404);
    if (business.ownerId === followerId)
      throw new AppError('Vous ne pouvez pas vous suivre vous-même', 400);

    const existing = await prisma.follow.findUnique({
      where: { followerId_businessId: { followerId, businessId: target.businessId } },
    });
    if (existing) throw new AppError('Vous suivez déjà ce business', 409);

    const follow = await prisma.follow.create({
      data: { followerId, businessId: target.businessId },
    });

    publishFollowed({
      userId: business.ownerId,
      followerId,
      businessId: target.businessId,
      businessName: business.name,
    });
    return follow;
  }

  if (target.developerId) {
    const dev = await prisma.developerProfile.findUnique({ where: { id: target.developerId } });
    if (!dev) throw new AppError('Développeur non trouvé', 404);
    if (dev.userId === followerId)
      throw new AppError('Vous ne pouvez pas vous suivre vous-même', 400);

    const existing = await prisma.follow.findUnique({
      where: { followerId_developerId: { followerId, developerId: target.developerId } },
    });
    if (existing) throw new AppError('Vous suivez déjà ce développeur', 409);

    const follow = await prisma.follow.create({
      data: { followerId, developerId: target.developerId },
    });

    publishFollowed({
      userId: dev.userId,
      followerId,
      developerId: target.developerId,
      businessName: dev.companyName || 'Développeur',
    });
    return follow;
  }
}

export async function unfollow(followerId: string, followId: string) {
  const follow = await prisma.follow.findUnique({ where: { id: followId } });
  if (!follow) throw new AppError('Follow non trouvé', 404);
  if (follow.followerId !== followerId) throw new AppError('Non autorisé', 403);

  await prisma.follow.delete({ where: { id: followId } });

  if (follow.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: follow.businessId },
      select: { ownerId: true, name: true },
    });
    if (business) {
      publishUnfollowed({
        userId: business.ownerId,
        followerId,
        businessId: follow.businessId,
        businessName: business.name,
      });
    }
  }
  if (follow.developerId) {
    const dev = await prisma.developerProfile.findUnique({
      where: { id: follow.developerId },
      select: { userId: true, companyName: true },
    });
    if (dev) {
      publishUnfollowed({
        userId: dev.userId,
        followerId,
        developerId: follow.developerId,
        businessName: dev.companyName || 'Développeur',
      });
    }
  }

  return { message: 'Arrêté de suivre' };
}

export async function getFollowers(
  targetId: string,
  type: 'business' | 'developer',
  page = 1,
  limit = 20
) {
  const where = type === 'business' ? { businessId: targetId } : { developerId: targetId };
  const skip = (page - 1) * limit;

  const [followers, total] = await Promise.all([
    prisma.follow.findMany({
      where,
      include: {
        follower: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where }),
  ]);

  return {
    followers: followers.map((f) => f.follower),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFollowing(followerId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [following, total] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId },
      include: {
        business: { select: { id: true, name: true, slug: true, logo: true, type: true } },
        developer: { select: { id: true, companyName: true, logo: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.follow.count({ where: { followerId } }),
  ]);

  const items = following.map((f) => ({
    id: f.id,
    type: f.businessId ? 'BUSINESS' : 'DEVELOPER',
    target: f.business || f.developer,
    createdAt: f.createdAt,
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getFollowCount(targetId: string, type: 'business' | 'developer') {
  const where = type === 'business' ? { businessId: targetId } : { developerId: targetId };
  return prisma.follow.count({ where });
}

export async function isFollowing(
  followerId: string,
  target: { businessId?: string; developerId?: string }
) {
  if (target.businessId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_businessId: { followerId, businessId: target.businessId } },
      select: { id: true, createdAt: true },
    });
    return { isFollowing: !!follow, followId: follow?.id, createdAt: follow?.createdAt };
  }
  if (target.developerId) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_developerId: { followerId, developerId: target.developerId } },
      select: { id: true, createdAt: true },
    });
    return { isFollowing: !!follow, followId: follow?.id, createdAt: follow?.createdAt };
  }
  return { isFollowing: false };
}
