import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

type SaveItemInput = {
  type: 'OFFER_FLASH' | 'PROMOTION' | 'PRODUCT' | 'SERVICE';
  referenceId: string;
};

export async function saveItem(userId: string, data: SaveItemInput) {
  const type = data.type === 'OFFER_FLASH' ? 'OFFER_FLASH' : 'PROMOTION';
  const existing = await prisma.savedItem.findUnique({
    where: { userId_referenceId: { userId, referenceId: data.referenceId } },
  });
  if (existing) return existing;
  return prisma.savedItem.create({
    data: { userId, type, referenceId: data.referenceId },
  });
}

export async function unsaveItem(userId: string, savedItemId: string) {
  const item = await prisma.savedItem.findFirst({ where: { id: savedItemId, userId } });
  if (!item) throw new AppError('Élément non trouvé', 404);
  await prisma.savedItem.delete({ where: { id: savedItemId } });
  return { message: 'Élément retiré des favoris' };
}

export async function listSavedItems(
  userId: string,
  params: { type?: string; page?: number; limit?: number }
) {
  const where: any = { userId };
  if (params.type) where.type = params.type;
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    prisma.savedItem.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.savedItem.count({ where }),
  ]);
  const enriched = await enrichSavedItems(items);
  return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function checkSaved(userId: string, type: string, referenceId: string) {
  const item = await prisma.savedItem.findUnique({
    where: { userId_referenceId: { userId, referenceId } },
  });
  return { saved: !!item, id: item?.id || null };
}

export async function getSavedCount(referenceId: string) {
  const count = await prisma.savedItem.count({ where: { referenceId } });
  return { count };
}

async function enrichSavedItems(items: any[]) {
  return Promise.all(
    items.map(async (item) => {
      if (item.type === 'PROMOTION') {
        const promo = await prisma.promotion.findUnique({
          where: { id: item.referenceId },
          select: {
            id: true,
            title: true,
            description: true,
            image: true,
            discountValue: true,
            promotionType: true,
            endsAt: true,
          },
        });
        return { ...item, reference: promo };
      }
      if (item.type === 'OFFER_FLASH') {
        const offer = await prisma.offerFlash.findUnique({
          where: { id: item.referenceId },
          select: {
            id: true,
            title: true,
            description: true,
            image: true,
            flashPrice: true,
            originalPrice: true,
            discountPercent: true,
            endAt: true,
            isActive: true,
          },
        });
        return { ...item, reference: offer };
      }
      return item;
    })
  );
}
