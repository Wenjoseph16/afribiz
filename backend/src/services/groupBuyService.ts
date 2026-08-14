import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { getIO } from './socket';
import { publishOrderPlaced } from '../events/publishers';
import { syncClientFromOrder, recalculateAllDynamicSegments } from './crm';
import { logActivity } from './customer360';
import { trackAnalyticsEvent } from './analyticsService';

async function getBusinessId(ownerId: string) {
  const b = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  if (!b) throw new AppError('Business non trouvé', 404);
  return b.id;
}

function generateOrderNumber(): string {
  const d = new Date();
  return (
    'CMD-GB-' +
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    '-' +
    String(Math.floor(Math.random() * 99999)).padStart(5, '0')
  );
}

function emitBusiness(businessId: string, event: string, data: unknown) {
  try {
    getIO()?.to(`business:${businessId}`).emit(event, data);
  } catch {
    /* socket non prêt : non bloquant */
  }
}

function emitUser(userId: string, event: string, data: unknown) {
  try {
    getIO()?.to(`user:${userId}`).emit(event, data);
  } catch {
    /* socket non prêt : non bloquant */
  }
}

async function notify(
  userId: string,
  businessId: string | null,
  type: NotificationType,
  title: string,
  description: string,
  link: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        description,
        link,
        metadata: businessId ? { businessId, source: 'group_buy' } : { source: 'group_buy' },
      },
    });
  } catch (err) {
    logger.warn('GroupBuy notification failed', { error: (err as Error).message });
  }
}

export async function listGroupBuys(ownerId: string) {
  const businessId = await getBusinessId(ownerId);
  const groups = await prisma.groupBuy.findMany({
    where: { businessId },
    include: {
      _count: { select: { participants: true } },
      participants: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { createdAt: 'desc' },
  });
  return groups.map((g) => ({
    ...g,
    price: Number(g.price),
    groupPrice: Number(g.groupPrice),
    savings: g.savings ? Number(g.savings) : null,
    progress: g.minParticipants > 0 ? Math.min(100, Math.round((g.currentCount / g.minParticipants) * 100)) : 0,
  }));
}

export async function getGroupBuy(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const gb = await prisma.groupBuy.findFirst({
    where: { id, businessId },
    include: { participants: { orderBy: { createdAt: 'desc' } } },
  });
  if (!gb) throw new AppError('Achat groupé non trouvé', 404);
  return {
    ...gb,
    price: Number(gb.price),
    groupPrice: Number(gb.groupPrice),
    savings: gb.savings ? Number(gb.savings) : null,
    progress: gb.minParticipants > 0 ? Math.min(100, Math.round((gb.currentCount / gb.minParticipants) * 100)) : 0,
    participants: gb.participants.map((p) => ({
      ...p,
      amount: Number(p.amount),
    })),
  };
}

// Types d'articles rattachables à un achat groupé (tous les catalogues)
const GROUP_BUY_ITEM_TYPES = ['PRODUCT', 'SERVICE', 'MENU_ITEM', 'ROOM', 'RENTAL', 'EVENT', 'TRAINING'];

/**
 * Résout le nom réel d'un article depuis la base (n'importe quel type).
 * Retourne null si l'article n'existe pas.
 */
async function resolveGroupBuyItemName(businessId: string, itemType: string | null, itemId: string | null): Promise<string | null> {
  if (!itemType || !itemId) return null;
  try {
    switch (itemType) {
      case 'PRODUCT': {
        const p = await prisma.product.findFirst({ where: { id: itemId, businessId, deletedAt: null }, select: { name: true } });
        return p?.name ?? null;
      }
      case 'SERVICE': {
        const s = await prisma.service.findFirst({ where: { id: itemId, businessId }, select: { name: true } });
        return s?.name ?? null;
      }
      case 'MENU_ITEM': {
        const m = await prisma.menuItem.findFirst({ where: { id: itemId, businessId }, select: { name: true } });
        return m?.name ?? null;
      }
      case 'ROOM': {
        const r = await prisma.room.findFirst({ where: { id: itemId, businessId }, select: { name: true } });
        return r?.name ?? null;
      }
      case 'RENTAL': {
        const r = await prisma.rental.findFirst({ where: { id: itemId, businessId }, select: { name: true } });
        return r?.name ?? null;
      }
      case 'EVENT': {
        const e = await prisma.event.findFirst({ where: { id: itemId, businessId }, select: { title: true } });
        return e?.title ?? null;
      }
      case 'TRAINING': {
        const t = await prisma.training.findFirst({ where: { id: itemId, businessId }, select: { title: true } });
        return t?.title ?? null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export async function createGroupBuy(
  ownerId: string,
  data: {
    title: string;
    description?: string;
    productId?: string; // rétrocompat
    itemType?: string;
    itemId?: string;
    price: number;
    groupPrice: number;
    minParticipants: number;
    maxParticipants?: number;
    discountPercent: number;
    endAt?: string;
    whatsappGroup?: string;
  }
) {
  const businessId = await getBusinessId(ownerId);
  // Rétrocompat : productId devient itemType='PRODUCT' + itemId
  const itemType = data.itemType || (data.productId ? 'PRODUCT' : null);
  const itemId = data.itemId || data.productId || null;
  if (itemType && !GROUP_BUY_ITEM_TYPES.includes(itemType)) {
    throw new AppError('Type d\'article non pris en charge pour l\'achat groupé', 400);
  }
  if (itemType && itemId) {
    const realName = await resolveGroupBuyItemName(businessId, itemType, itemId);
    if (!realName) throw new AppError('Article introuvable dans votre catalogue', 404);
  }
  // Guard: le prix groupe doit être strictement inférieur au prix normal
  const price = Number(data.price || 0);
  const groupPrice = Number(data.groupPrice || 0);
  if (price <= 0) throw new AppError('Prix normal requis', 400);
  if (groupPrice <= 0 || groupPrice >= price) {
    throw new AppError('Le prix groupe doit être inférieur au prix normal', 400);
  }
  const savings = price - groupPrice;
  const gb = await prisma.groupBuy.create({
    data: {
      businessId,
      title: data.title,
      description: data.description || null,
      productId: itemType === 'PRODUCT' ? itemId : null,
      itemType,
      itemId,
      price,
      groupPrice,
      currency: 'FCFA',
      minParticipants: Math.max(2, data.minParticipants || 5),
      maxParticipants: data.maxParticipants || null,
      currentCount: 0,
      discountPercent: data.discountPercent || Math.round((savings / price) * 100),
      savings,
      startAt: new Date(),
      endAt: data.endAt ? new Date(data.endAt) : null,
      status: 'ACTIVE',
      whatsappGroup: data.whatsappGroup || null,
      isActive: true,
    } as any,
  });

  // Notifier : l'achat groupé est en ligne (le business rejoint par le réseau)
  const owner = await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true } });
  if (owner?.ownerId) {
    await notify(
      owner.ownerId,
      businessId,
      NotificationType.PROMOTION,
      '🛒 Achat groupé en ligne',
      `${gb.title} — seuil : ${gb.minParticipants} participants, économie ${savings} FCFA/unité.`,
      '/dashboard/group-buys'
    ).catch(() => {});
  }
  return gb;
}

export async function updateGroupBuy(ownerId: string, id: string, data: any) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.groupBuy.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Achat groupé non trouvé', 404);
  if (existing.status !== 'ACTIVE') throw new AppError('Seuls les achats groupés ACTIVE peuvent être modifiés', 400);
  const upd: any = { ...data };
  if (data.price !== undefined || data.groupPrice !== undefined) {
    const price = Number(data.price ?? existing.price);
    const groupPrice = Number(data.groupPrice ?? existing.groupPrice);
    if (groupPrice >= price) throw new AppError('Le prix groupe doit être inférieur au prix normal', 400);
    upd.savings = price - groupPrice;
  }
  if (data.endAt) upd.endAt = new Date(data.endAt);
  return prisma.groupBuy.update({ where: { id }, data: upd });
}

export async function deleteGroupBuy(ownerId: string, id: string) {
  const businessId = await getBusinessId(ownerId);
  const existing = await prisma.groupBuy.findFirst({ where: { id, businessId } });
  if (!existing) throw new AppError('Achat groupé non trouvé', 404);
  return prisma.groupBuy.delete({ where: { id } });
}

export async function addParticipant(
  ownerId: string,
  data: {
    groupBuyId: string;
    userId?: string;
    name: string;
    phone?: string;
    email?: string;
    quantity: number;
    amount: number;
  }
) {
  const businessId = await getBusinessId(ownerId);
  const gb = await prisma.groupBuy.findFirst({ where: { id: data.groupBuyId, businessId } });
  if (!gb) throw new AppError('Achat groupé non trouvé', 404);
  if (gb.status !== 'ACTIVE') throw new AppError("Cet achat groupé n'accepte plus de participants", 400);
  if (gb.maxParticipants && gb.currentCount >= gb.maxParticipants) {
    throw new AppError("Nombre maximum de participants atteint", 400);
  }

  const quantity = Math.max(1, data.quantity || 1);
  const amount = Number(data.amount || 0);
  if (amount <= 0) throw new AppError('Montant du participant requis', 400);

  // ⚠️ Anti-doublon : un même client connecté ne peut pas participer 2×
  if (data.userId) {
    const dup = await prisma.groupBuyParticipant.findFirst({
      where: { groupBuyId: gb.id, userId: data.userId },
    });
    if (dup) throw new AppError('Vous participez déjà à cet achat groupé', 409);
  }

  const participant = await prisma.groupBuyParticipant.create({
    data: {
      groupBuyId: gb.id,
      userId: data.userId || null,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      quantity,
      amount,
      status: 'PENDING',
    } as any,
  });

  // ⚠️ Incrément atomique : évite la course entre deux participants simultanés
  const updated = await prisma.groupBuy.update({
    where: { id: gb.id },
    data: {
      currentCount: { increment: 1 },
      // Transition ACTIVE -> REACHED atomique dès que le seuil est atteint
      ...(gb.status === 'ACTIVE' && gb.currentCount + 1 >= gb.minParticipants
        ? { status: 'REACHED' }
        : {}),
    },
  });
  const newCount = updated.currentCount;
  const reached = newCount >= gb.minParticipants;

  // ── Seuil atteint : le prix groupe est débloqué pour tous ──
  if (reached && gb.status === 'ACTIVE') {
    const owner = await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true, name: true } });
    if (owner?.ownerId) {
      await notify(
        owner.ownerId,
        businessId,
        NotificationType.PROMOTION,
        '🎉 Seuil atteint !',
        `${gb.title} — ${newCount}/${gb.minParticipants} participants. Le prix groupe est débloqué : validez les commandes.`,
        `/dashboard/group-buys/${gb.id}`
      ).catch(() => {});
    }
    emitBusiness(businessId, 'groupbuy:reached', { groupBuyId: gb.id, currentCount: newCount, minParticipants: gb.minParticipants });

    // Chaque participant (connecté) est notifié : il peut valider son achat au prix groupe
    const participants = await prisma.groupBuyParticipant.findMany({
      where: { groupBuyId: gb.id, userId: { not: null } },
    });
    for (const p of participants) {
      if (p.userId) {
        await notify(
          p.userId,
          businessId,
          NotificationType.PROMOTION,
          '🛒 Prix groupe débloqué !',
          `${gb.title} — validez votre achat à ${Number(gb.groupPrice).toLocaleString('fr-FR')} FCFA avant la fin de l'offre.`,
          '/dashboard/group-buys'
        ).catch(() => {});
        emitUser(p.userId, 'groupbuy:reached', { groupBuyId: gb.id, groupPrice: Number(gb.groupPrice) });
      }
    }
  }

  trackAnalyticsEvent({
    businessId,
    userId: data.userId || undefined,
    type: 'group_buy',
    category: 'marketing',
    eventName: 'GROUP_BUY_PARTICIPANT_ADDED',
    properties: { groupBuyId: gb.id, currentCount: newCount, minParticipants: gb.minParticipants, reached },
  }).catch(() => {});

  return { participant, groupBuy: updated, reached };
}

export async function removeParticipant(ownerId: string, participantId: string) {
  const businessId = await getBusinessId(ownerId);
  const p = await prisma.groupBuyParticipant.findFirst({
    where: { id: participantId, groupBuy: { businessId } },
  });
  if (!p) throw new AppError('Participant non trouvé', 404);
  await prisma.groupBuyParticipant.delete({ where: { id: participantId } });
  await prisma.groupBuy.update({
    where: { id: p.groupBuyId },
    data: { currentCount: { decrement: 1 } },
  });
  return { success: true };
}

/**
 * Convertit la participation d'un client connecté en VRAIE commande.
 * - La commande porte le prix GROUPE (groupPrice × quantité), remise tracée.
 * - Le produit est lié à la ligne de commande ; le client est sync dans le CRM.
 * - Statut CONFIRMED + paiement attendu (le participant règle ensuite, ou déjà
 *   payé si amount encaissé au moment de la participation).
 */
export async function confirmParticipantOrder(ownerId: string, participantId: string) {
  const businessId = await getBusinessId(ownerId);
  const p = await prisma.groupBuyParticipant.findFirst({
    where: { id: participantId, groupBuy: { businessId } },
    include: { groupBuy: true },
  });
  if (!p) throw new AppError('Participant non trouvé', 404);
  if (p.status !== 'PENDING') throw new AppError('Cette participation est déjà traitée', 400);
  if (!p.userId) throw new AppError('Seul un participant connecté peut confirmer sa commande', 400);
  if (p.groupBuy.status === 'ACTIVE') {
    throw new AppError("Le seuil n'est pas encore atteint — le prix groupe n'est pas débloqué", 400);
  }
  if (p.groupBuy.status === 'CANCELLED') {
    throw new AppError("Cet achat groupé a été annulé — la commande ne peut pas être validée", 400);
  }

  const price = Number(p.groupBuy.price);
  const groupPrice = Number(p.groupBuy.groupPrice);
  const quantity = p.quantity || 1;
  const subtotal = price * quantity;
  const discount = Math.max(0, subtotal - Number(p.amount));
  const total = Number(p.amount);

  const orderNumber = generateOrderNumber();
  const order = await prisma.$transaction(async (tx) => {
    // Réserve atomique : un seul confirm par participant
    const claimed = await tx.groupBuyParticipant.updateMany({
      where: { id: participantId, status: 'PENDING' },
      data: { status: 'PAID', paidAt: new Date(), paymentRef: `GB-${orderNumber}` },
    });
    if (claimed.count === 0) throw new AppError('Participation déjà traitée', 409);

    const itemType = p.groupBuy.itemType || (p.groupBuy.productId ? 'PRODUCT' : null);
    const itemId = p.groupBuy.itemId || p.groupBuy.productId || null;
    const created = await tx.order.create({
      data: {
        orderNumber,
        businessId,
        buyerId: p.userId!,
        type: 'DELIVERY',
        source: 'WEB_SITE',
        status: 'CONFIRMED',
        totalAmount: total,
        subtotal,
        discountAmount: discount,
        currency: 'FCFA',
        contactName: p.name,
        contactPhone: p.phone || null,
        paymentMethod: 'Mobile Money',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        internalNotes: `Achat groupé ${p.groupBuy.title} (-${discount} FCFA)`,
        items: {
          create: [
            {
              productId: itemType === 'PRODUCT' ? itemId : null,
              serviceId: itemType === 'SERVICE' ? itemId : null,
              name: p.groupBuy.title,
              quantity,
              unitPrice: groupPrice,
              total,
            },
          ],
        },
      } as any,
    });
    // Décrément du stock UNIQUEMENT si produit physique lié
    if (itemType === 'PRODUCT' && itemId) {
      await tx.product.update({
        where: { id: itemId },
        data: { stock: { decrement: quantity } },
      });
    }
    return created;
  });

  // ── Flux business : CRM + notifications + analytics ──
  try {
    await syncClientFromOrder(businessId, p.userId!, total);
    await recalculateAllDynamicSegments(businessId).catch(() => {});
    await logActivity(businessId, p.userId!, 'ORDER_PLACED' as any, {
      description: `Commande achat groupé ${p.groupBuy.title} (${total} FCFA)`,
      metadata: { orderId: order.id, groupBuyId: p.groupBuyId, amount: total },
    }).catch(() => {});
  } catch {
    /* le CRM ne bloque jamais la vente */
  }

  const owner = await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true, name: true } });
  if (owner?.ownerId) {
    publishOrderPlaced({
      userId: owner.ownerId,
      orderId: order.id,
      businessName: owner.name,
      amount: String(total),
      businessId,
    });
    await notify(
      owner.ownerId,
      businessId,
      NotificationType.ORDER_PLACED,
      '🛒 Nouvelle commande achat groupé !',
      `${p.name} a validé ${p.groupBuy.title} (${quantity} × ${groupPrice.toLocaleString('fr-FR')} FCFA = ${total.toLocaleString('fr-FR')} FCFA).`,
      `/dashboard/orders/${order.id}`
    ).catch(() => {});
    emitBusiness(businessId, 'groupbuy:order-created', { orderId: order.id, participantId: p.id });
  }

  // Le client est notifié que sa commande est confirmée
  await notify(
    p.userId!,
    businessId,
    NotificationType.ORDER_PLACED,
    '✅ Commande achat groupé confirmée',
    `${p.groupBuy.title} — ${total.toLocaleString('fr-FR')} FCFA (économie ${discount.toLocaleString('fr-FR')} FCFA). Commande #${orderNumber}.`,
    `/dashboard/orders/${order.id}`
  ).catch(() => {});
  emitUser(p.userId!, 'groupbuy:order-confirmed', { orderId: order.id, total });

  trackAnalyticsEvent({
    businessId,
    userId: p.userId,
    type: 'group_buy',
    category: 'payment',
    eventName: 'GROUP_BUY_ORDER_CREATED',
    properties: { groupBuyId: p.groupBuyId, orderId: order.id, subtotal, discount, total },
  }).catch(() => {});

  logger.info(`GroupBuy order created: ${orderNumber} (${total} FCFA, remise ${discount})`);
  return {
    order,
    discount,
    subtotal,
    total,
    orderNumber,
    message: `Commande créée — économie de ${discount.toLocaleString('fr-FR')} FCFA grâce à l'achat groupé !`,
  };
}
