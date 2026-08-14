import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { validateAttachmentConfig, CATALOG_ITEM_TYPES } from '../validators/catalogAttachment';

/**
 * ============================================
 * CATALOG ATTACHMENTS — service
 * ============================================
 * Le business rattache un mécanisme (taxe, quantité min/max, disponibilité
 * programmée, personnalisation, emballage cadeau, ventes croisées, créneau,
 * urgence stock, prix dégressifs…) à UN article ou à SON catalogue entier.
 * L'affichage (badges) ET le calcul (PriceEngine) lisent ces lignes.
 */

const ITEM_MODEL: Record<string, { model: any; nameField: string }> = {
  PRODUCT: { model: 'product', nameField: 'name' },
  SERVICE: { model: 'service', nameField: 'name' },
  MENU_ITEM: { model: 'menuItem', nameField: 'name' },
  ROOM: { model: 'room', nameField: 'name' },
  RENTAL: { model: 'rental', nameField: 'name' },
  EVENT: { model: 'event', nameField: 'title' },
  TRAINING: { model: 'training', nameField: 'title' },
};

async function assertItemExists(businessId: string, itemType: string, itemId: string) {
  if (!CATALOG_ITEM_TYPES.includes(itemType as any)) {
    throw new AppError(`Type d'article non pris en charge: ${itemType}`, 400);
  }
  const entry = ITEM_MODEL[itemType];
  const delegate = (prisma as any)[entry.model];
  const found = await delegate.findFirst({
    where: { id: itemId, businessId },
    select: { id: true },
  });
  if (!found) {
    throw new AppError(`Article introuvable dans votre catalogue (${itemType})`, 404);
  }
}

export async function createOrUpdateAttachment(
  ownerId: string,
  data: {
    itemType: string;
    itemId: string;
    sourceType: string;
    config?: unknown;
    startsAt?: string | null;
    endsAt?: string | null;
    isActive?: boolean;
  }
) {
  const business = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  if (!business) throw new AppError('Aucun business associé à ce compte', 404);

  await assertItemExists(business.id, data.itemType, data.itemId);
  const config = validateAttachmentConfig(data.sourceType, data.config);

  const existing = await prisma.catalogAttachment.findFirst({
    where: {
      businessId: business.id,
      itemType: data.itemType,
      itemId: data.itemId,
      sourceType: data.sourceType,
    },
  });

  const payload = {
    config,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
    isActive: data.isActive ?? true,
  };

  if (existing) {
    return prisma.catalogAttachment.update({ where: { id: existing.id }, data: payload });
  }
  return prisma.catalogAttachment.create({
    data: {
      businessId: business.id,
      itemType: data.itemType,
      itemId: data.itemId,
      sourceType: data.sourceType,
      ...payload,
    },
  });
}

export async function listAttachments(
  ownerId: string,
  filters: { itemType?: string; itemId?: string; sourceType?: string } = {}
) {
  const business = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  if (!business) throw new AppError('Aucun business associé à ce compte', 404);
  return prisma.catalogAttachment.findMany({
    where: {
      businessId: business.id,
      ...(filters.itemType ? { itemType: filters.itemType } : {}),
      ...(filters.itemId ? { itemId: filters.itemId } : {}),
      ...(filters.sourceType ? { sourceType: filters.sourceType } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateAttachment(ownerId: string, id: string, data: any) {
  const business = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  if (!business) throw new AppError('Aucun business associé à ce compte', 404);
  const att = await prisma.catalogAttachment.findFirst({
    where: { id, businessId: business.id },
  });
  if (!att) throw new AppError('Rattachement introuvable', 404);

  let config = att.config;
  if (data.config !== undefined) {
    config = validateAttachmentConfig(att.sourceType, data.config);
  }
  return prisma.catalogAttachment.update({
    where: { id },
    data: {
      ...(config ? { config } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.startsAt !== undefined
        ? { startsAt: data.startsAt ? new Date(data.startsAt) : null }
        : {}),
      ...(data.endsAt !== undefined
        ? { endsAt: data.endsAt ? new Date(data.endsAt) : null }
        : {}),
    },
  });
}

export async function removeAttachment(ownerId: string, id: string) {
  const business = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  if (!business) throw new AppError('Aucun business associé à ce compte', 404);
  const att = await prisma.catalogAttachment.findFirst({ where: { id, businessId: business.id } });
  if (!att) throw new AppError('Rattachement introuvable', 404);
  await prisma.catalogAttachment.delete({ where: { id } });
  return { deleted: true };
}
