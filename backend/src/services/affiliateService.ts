import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findFirst({ where: { ownerId } });
  if (!business) throw new AppError('Business non trouvé pour cet utilisateur', 404);
  return business;
}

/** Résout le nom d'un article (tous types) pour l'affichage. */
async function resolveItemName(businessId: string, itemType: string, itemId: string) {
  try {
    if (itemType === 'PRODUCT') {
      const p = await prisma.product.findFirst({ where: { id: itemId, businessId } });
      return p?.name || itemId;
    }
    if (itemType === 'SERVICE') {
      const s = await prisma.service.findFirst({ where: { id: itemId, businessId } });
      return s?.name || itemId;
    }
    if (itemType === 'MENU_ITEM') {
      const m = await prisma.menuItem.findFirst({ where: { id: itemId, businessId } });
      return m?.name || itemId;
    }
    if (itemType === 'ROOM') {
      const r = await prisma.room.findFirst({ where: { id: itemId, businessId } });
      return r?.name || itemId;
    }
    if (itemType === 'EVENT') {
      const e = await prisma.event.findFirst({ where: { id: itemId, businessId } });
      return e?.title || itemId;
    }
    if (itemType === 'RENTAL') {
      const r = await prisma.rental.findFirst({ where: { id: itemId, businessId } });
      return r?.name || itemId;
    }
    if (itemType === 'TRAINING') {
      const t = await prisma.training.findFirst({ where: { id: itemId, businessId } });
      return t?.title || itemId;
    }
  } catch {
    /* item supprimé */
  }
  return itemId;
}

const SUPPORTED = ['PRODUCT', 'SERVICE', 'MENU_ITEM', 'ROOM', 'RENTAL', 'EVENT', 'TRAINING'];

function generateCode(): string {
  return 'AFF-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

/** Crée (ou met à jour) le lien d'affiliation d'un article. */
export async function createAffiliateLink(
  ownerId: string,
  data: { itemType: string; itemId: string; commissionPercent: number }
) {
  const business = await getBusinessByOwner(ownerId);
  if (!SUPPORTED.includes(data.itemType)) {
    throw new AppError(`Type d'article non supporté (${SUPPORTED.join(', ')})`, 400);
  }
  const percent = Math.min(100, Math.max(1, Number(data.commissionPercent) || 5));
  const link = await prisma.affiliateLink.upsert({
    where: {
      businessId_itemType_itemId: {
        businessId: business.id,
        itemType: data.itemType,
        itemId: data.itemId,
      },
    },
    update: { commissionPercent: percent, isActive: true, ownerId: ownerId || undefined },
    create: {
      businessId: business.id,
      itemType: data.itemType,
      itemId: data.itemId,
      code: generateCode(),
      commissionPercent: percent,
      ownerId,
    },
  });
  const name = await resolveItemName(business.id, data.itemType, data.itemId);
  return { ...link, itemName: name, link: `/r/${link.code}` };
}

export async function listAffiliateLinks(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const links = await prisma.affiliateLink.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
  return Promise.all(
    links.map(async (l) => ({
      ...l,
      itemName: await resolveItemName(business.id, l.itemType, l.itemId),
      link: `/r/${l.code}`,
    }))
  );
}

export async function deleteAffiliateLink(ownerId: string, linkId: string) {
  const business = await getBusinessByOwner(ownerId);
  const existing = await prisma.affiliateLink.findFirst({
    where: { id: linkId, businessId: business.id },
  });
  if (!existing) throw new AppError("Lien d'affiliation non trouvé", 404);
  await prisma.affiliateLink.delete({ where: { id: linkId } });
  return { success: true };
}

/** Public : que pointe ce lien ? + incrémente les clics. */
export async function resolveAffiliateLink(code: string) {
  const link = await prisma.affiliateLink.findUnique({ where: { code } });
  if (!link || !link.isActive) throw new AppError("Lien d'affiliation invalide ou inactif", 404);
  const updated = await prisma.affiliateLink.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } },
  });
  const name = await resolveItemName(updated.businessId, updated.itemType, updated.itemId);
  return { ...updated, itemName: name, link: `/r/${updated.code}` };
}

/**
 * Applique la commission d'affiliation quand une commande devient PAYÉE.
 * Boucle garantie : lien partagé → commande payée → commission créditée au
 * propriétaire du lien (zéro centime qui échappe au radar).
 */
export async function applyAffiliateOnPaid(orderId: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.refCode || order.paymentStatus !== 'PAID') return null;

    const link = await prisma.affiliateLink.findUnique({ where: { code: order.refCode } });
    if (!link || !link.isActive) return null;
    // Sécurité : le lien doit appartenir au business de la commande
    if (link.businessId !== order.businessId) return null;

    const commission = Math.round(
      (Number(order.totalAmount || 0) * Number(link.commissionPercent)) / 100
    );
    if (commission <= 0) return null;

    const updated = await prisma.affiliateLink.update({
      where: { id: link.id },
      data: {
        orders: { increment: 1 },
        commissionTotal: { increment: commission },
      },
    });
    return { linkId: link.id, commission, percent: Number(link.commissionPercent) };
  } catch (err) {
    // Non bloquant : un souci d'affiliation ne doit jamais casser le paiement
    console.warn('Affiliate apply skipped:', (err as Error).message);
    return null;
  }
}
