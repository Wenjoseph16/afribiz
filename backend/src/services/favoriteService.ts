import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

export async function getFavorites(userId: string, type?: string) {
  const where: any = { userId };
  if (type) where.type = type;
  const favorites = await prisma.favorite.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          price: true,
          slug: true,
          businessId: true,
          currency: true,
          rating: true,
        },
      },
    },
  });
  return Promise.all(
    favorites.map(async (fav) => {
      if (fav.productId) return { ...fav, ref: fav.product, _type: 'product' };
      const refId = fav.referenceId;
      if (fav.type === 'BUSINESS') {
        const ref = await prisma.business.findUnique({
          where: { id: refId },
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            type: true,
            city: true,
            rating: true,
          },
        });
        return { ...fav, ref, _type: 'business' };
      }
      if (fav.type === 'SERVICE') {
        const ref = await prisma.service.findUnique({
          where: { id: refId },
          select: { id: true, name: true, price: true, currency: true, duration: true },
        });
        return { ...fav, ref, _type: 'service' };
      }
      if (fav.type === 'TRAINING') {
        const ref = await prisma.training.findUnique({
          where: { id: refId },
          select: { id: true, title: true, category: true, duration: true },
        });
        return { ...fav, ref, _type: 'training' };
      }
      if (fav.type === 'EVENT') {
        const ref = await prisma.event.findUnique({
          where: { id: refId },
          select: {
            id: true,
            title: true,
            startDate: true,
            price: true,
            images: true,
            address: true,
          },
        });
        return { ...fav, ref, _type: 'event' };
      }
      return { ...fav, ref: null, _type: (fav.type || '').toLowerCase() };
    })
  );
}

export async function addFavorite(userId: string, type: string, referenceId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_referenceId: { userId, referenceId } },
  });
  if (existing) throw new AppError('Already in favorites', 409);
  await prisma.favorite.create({ data: { userId, type, referenceId } });
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const fav = await prisma.favorite.findFirst({ where: { id: favoriteId, userId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  await prisma.favorite.delete({ where: { id: favoriteId } });
}
