import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishFavoriteAdded, publishFavoriteRemoved } from '../events/publishers';

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

async function resolveFavoriteBusiness(referenceId: string, type: string) {
  // Pour un produit/service/formation/événement, on remonte jusqu'au business propriétaire
  // et jusqu'à l'utilisateur propriétaire (destinataire de la notification)
  try {
    if (type === 'BUSINESS') {
      const b = await prisma.business.findUnique({
        where: { id: referenceId },
        select: { id: true, name: true, ownerId: true },
      });
      return { businessId: b?.id || undefined, businessName: b?.name || undefined, ownerId: b?.ownerId || undefined };
    }
    if (type === 'PRODUCT') {
      const p = await prisma.product.findUnique({
        where: { id: referenceId },
        select: { businessId: true, business: { select: { name: true, ownerId: true } } },
      });
      return { businessId: p?.businessId || undefined, businessName: p?.business?.name || undefined, ownerId: p?.business?.ownerId || undefined };
    }
    if (type === 'SERVICE') {
      const s = await prisma.service.findUnique({
        where: { id: referenceId },
        select: { businessId: true, business: { select: { name: true, ownerId: true } } },
      });
      return { businessId: s?.businessId || undefined, businessName: s?.business?.name || undefined, ownerId: s?.business?.ownerId || undefined };
    }
    if (type === 'TRAINING') {
      const t = await prisma.training.findUnique({
        where: { id: referenceId },
        select: { businessId: true, business: { select: { name: true, ownerId: true } } },
      });
      return { businessId: t?.businessId || undefined, businessName: t?.business?.name || undefined, ownerId: t?.business?.ownerId || undefined };
    }
    if (type === 'EVENT') {
      const e = await prisma.event.findUnique({
        where: { id: referenceId },
        select: { businessId: true, business: { select: { name: true, ownerId: true } } },
      });
      return { businessId: e?.businessId || undefined, businessName: e?.business?.name || undefined, ownerId: e?.business?.ownerId || undefined };
    }
  } catch {
    // silencieux : ne jamais bloquer le favori si la résolution échoue
  }
  return { businessId: undefined, businessName: undefined, ownerId: undefined };
}

export async function addFavorite(userId: string, type: string, referenceId: string) {
  const existing = await prisma.favorite.findUnique({
    where: { userId_referenceId: { userId, referenceId } },
  });
  if (existing) throw new AppError('Already in favorites', 409);
  // Renseigner productId pour les favoris produits : getFavorites s'appuie dessus pour l'enrichissement
  const isProduct = type === 'PRODUCT';
  await prisma.favorite.create({
    data: { userId, type, referenceId, ...(isProduct ? { productId: referenceId } : {}) },
  });
  const { businessId, businessName, ownerId } = await resolveFavoriteBusiness(referenceId, type);
  // Notifier le propriétaire du business (pas l'acteur) — pattern publishBookingCreated
  publishFavoriteAdded({
    userId: ownerId || userId,
    referenceId,
    type,
    businessId,
    businessName,
  });
}

export async function removeFavorite(userId: string, favoriteId: string) {
  const fav = await prisma.favorite.findFirst({ where: { id: favoriteId, userId } });
  if (!fav) throw new AppError('Favorite not found', 404);
  await prisma.favorite.delete({ where: { id: favoriteId } });
  const { businessId, businessName, ownerId } = await resolveFavoriteBusiness(fav.referenceId, fav.type);
  publishFavoriteRemoved({
    userId: ownerId || userId,
    referenceId: fav.referenceId,
    type: fav.type,
    businessId,
    businessName,
  });
}
