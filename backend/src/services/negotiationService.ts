import { NotificationType } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { computePrice } from './priceEngine';
import { recordOrderSale } from './cashService';
import { getIO } from './socket';
import { publishBossDiscountAlert } from '../events/publishers';
import { sendWhatsApp, sendSMS } from './NotificationChannels';

const TOKEN_TTL_HOURS = 48;
const MAX_OFFERS_PER_ITEM = 5;

// ============================================
// HELPERS
// ============================================

function generateToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

function generateOrderNumber(): string {
  const d = new Date();
  return (
    'CMD-NEG-' +
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    '-' +
    String(Math.floor(Math.random() * 99999)).padStart(5, '0')
  );
}

/** Résout le business depuis un article du catalogue (un article appartient à un seul commerce). */
async function resolveBusinessFromItem(
  itemType: string,
  itemId: string
): Promise<{ id: string; name: string; ownerId: string; settings: any }> {
  let businessId: string | null = null;
  if (itemType === 'PRODUCT') {
    const p = await prisma.product.findUnique({
      where: { id: itemId },
      select: { businessId: true },
    });
    businessId = p?.businessId || null;
  } else if (itemType === 'SERVICE') {
    const s = await prisma.service.findUnique({
      where: { id: itemId },
      select: { businessId: true },
    });
    businessId = s?.businessId || null;
  } else if (itemType === 'MENU_ITEM') {
    const m = await prisma.menuItem.findUnique({
      where: { id: itemId },
      select: { businessId: true },
    });
    businessId = m?.businessId || null;
  } else if (itemType === 'ROOM') {
    const r = await prisma.room.findUnique({ where: { id: itemId }, select: { businessId: true } });
    businessId = r?.businessId || null;
  } else if (itemType === 'RENTAL') {
    const r = await prisma.rental.findUnique({
      where: { id: itemId },
      select: { businessId: true },
    });
    businessId = r?.businessId || null;
  } else if (itemType === 'EVENT') {
    const e = await prisma.event.findUnique({
      where: { id: itemId },
      select: { businessId: true },
    });
    businessId = e?.businessId || null;
  } else if (itemType === 'TRAINING') {
    const t = await prisma.training.findUnique({
      where: { id: itemId },
      select: { businessId: true },
    });
    businessId = t?.businessId || null;
  }
  if (!businessId) throw new AppError('Article introuvable', 404);
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, ownerId: true, settings: true },
  });
  if (!business) throw new AppError('Commerce introuvable', 404);
  return business as any;
}

/** Notifie le business : in-app (signée) + socket temps réel. Jamais bloquant. */
async function notifyBusiness(
  business: { id: string; ownerId: string; name: string },
  title: string,
  description: string,
  link: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId: business.ownerId,
        type: NotificationType.PROMOTION,
        title,
        description,
        link,
        metadata: { businessId: business.id, source: 'negotiation' },
      },
    });
  } catch (e) {
    logger.warn(`Négociation: notif business échouée: ${(e as Error).message}`);
  }
  try {
    getIO()
      ?.to(`business:${business.id}`)
      .emit('negotiation:new', { businessId: business.id, title, description });
    getIO()
      ?.to(`user:${business.ownerId}`)
      .emit('negotiation:new', { businessId: business.id, title, description });
  } catch {
    /* socket non prêt : non bloquant */
  }
}

/** Notifie le client : WhatsApp/SMS si numéro fourni, email non géré ici, in-app si connecté. */
async function notifyClient(
  offer: {
    clientPhone?: string | null;
    clientEmail?: string | null;
    clientName?: string | null;
    id: string;
  },
  title: string,
  message: string
) {
  if (offer.clientPhone) {
    const full = String(offer.clientPhone).replace(/^\+/, '');
    const wa = full.length <= 12 ? `+${full}` : `+${full}`;
    sendWhatsApp({ to: wa, message, businessName: 'AfriBiz' }).catch(() => {});
    sendSMS({ to: wa, message }).catch(() => {});
  }
  logger.info(
    `[Négociation] Client ${offer.clientName || offer.clientPhone || offer.clientEmail || offer.id}: ${title}`
  );
}

// ============================================
// 1. LE CLIENT PROPOSE UN PRIX (public)
// ============================================

export async function createOffer(data: {
  itemType: string;
  itemId: string;
  proposedPrice: number;
  message?: string;
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
}) {
  if (!data.itemType || !data.itemId) throw new AppError('Article requis', 400);
  const proposedPrice = Math.max(0, Number(data.proposedPrice) || 0);
  if (proposedPrice <= 0) throw new AppError('Un prix proposé est requis', 400);

  const business = await resolveBusinessFromItem(data.itemType, data.itemId);

  // Négociable ? Le PriceEngine expose le toggle du business (mécanisme NEGOTIATION
  // ou champ allowsNegotiation) — le client ne peut jamais s'accorder un prix seul.
  const price = await computePrice(business.id, {
    itemType: data.itemType,
    itemId: data.itemId,
    quantity: 1,
  });
  if (!price.available) {
    throw new AppError(`${price.name || 'Article'}: ${price.reason || 'indisponible'}`, 400);
  }
  if (!price.negotiable) {
    throw new AppError("Cet article n'autorise pas la négociation", 400);
  }
  const basePrice = price.unitPrice;
  if (proposedPrice >= basePrice) {
    throw new AppError('Le prix proposé doit être inférieur au prix affiché', 400);
  }

  // Anti-spam : max 5 offres PENDING/COUNTERED par article
  const open = await prisma.negotiationOffer.count({
    where: {
      businessId: business.id,
      itemType: data.itemType,
      itemId: data.itemId,
      status: { in: ['PENDING', 'COUNTERED'] },
    },
  });
  if (open >= MAX_OFFERS_PER_ITEM) {
    throw new AppError(
      "Trop d'offres en attente sur cet article — le commerce doit répondre d'abord",
      429
    );
  }

  const offer = await prisma.negotiationOffer.create({
    data: {
      businessId: business.id,
      itemType: data.itemType,
      itemId: data.itemId,
      itemName: price.name || 'Article',
      basePrice,
      proposedPrice,
      message: data.message || null,
      clientName: data.clientName || null,
      clientPhone: data.clientPhone || null,
      clientEmail: data.clientEmail || null,
      status: 'PENDING',
    },
  });

  await notifyBusiness(
    business,
    `🤝 Nouvelle offre : ${proposedPrice} F au lieu de ${basePrice} F`,
    `${price.name} — ${data.message || 'Le client propose un prix.'}${data.clientName ? ` (${data.clientName})` : ''}`,
    `/dashboard/business/negotiations`
  );

  return offer;
}

// ============================================
// 2. LE BUSINESS GÈRE SES OFFRES
// ============================================

export async function listOffers(ownerId: string, businessId?: string | null) {
  const where: any = businessId ? { id: businessId, ownerId } : { ownerId };
  const business = await prisma.business.findFirst({ where, select: { id: true } });
  if (!business) throw new AppError('Business non trouvé', 404);
  const offers = await prisma.negotiationOffer.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return offers.map((o) => ({
    ...o,
    basePrice: Number(o.basePrice),
    proposedPrice: Number(o.proposedPrice),
    counterPrice: o.counterPrice != null ? Number(o.counterPrice) : null,
    agreedPrice: o.agreedPrice != null ? Number(o.agreedPrice) : null,
    expiresInHours: o.expiresAt
      ? Math.max(0, Math.round((o.expiresAt.getTime() - Date.now()) / 3_600_000))
      : null,
  }));
}

async function getOwnedOffer(ownerId: string, offerId: string) {
  const offer = await prisma.negotiationOffer.findUnique({ where: { id: offerId } });
  if (!offer) throw new AppError('Offre non trouvée', 404);
  const business = await prisma.business.findUnique({
    where: { id: offer.businessId },
    select: { ownerId: true, name: true, settings: true },
  });
  if (!business || business.ownerId !== ownerId) {
    throw new AppError('Offre non trouvée dans vos commerces', 403);
  }
  return { offer, business: business as any };
}

export async function getOffer(ownerId: string, offerId: string) {
  const { offer, business } = await getOwnedOffer(ownerId, offerId);
  return {
    ...offer,
    basePrice: Number(offer.basePrice),
    proposedPrice: Number(offer.proposedPrice),
    counterPrice: offer.counterPrice != null ? Number(offer.counterPrice) : null,
    agreedPrice: offer.agreedPrice != null ? Number(offer.agreedPrice) : null,
    businessName: business.name,
  };
}

/** Accepte l'offre → PRIX ACCORDÉ FIGÉ + lien éphémère unique (TTL 48h, 1 usage). */
export async function acceptOffer(ownerId: string, offerId: string) {
  const { offer, business } = await getOwnedOffer(ownerId, offerId);
  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    throw new AppError("Cette offre n'est plus en négociation", 400);
  }
  // Prix accepté : le prix du client, ou sa dernière contre-proposition acceptée par le client
  const agreedPrice =
    offer.status === 'COUNTERED' && offer.counterPrice != null
      ? Number(offer.counterPrice)
      : Number(offer.proposedPrice);
  if (agreedPrice <= 0 || agreedPrice >= Number(offer.basePrice)) {
    throw new AppError('Prix accordé invalide', 400);
  }

  const token = generateToken();
  const updated = await prisma.negotiationOffer.update({
    where: { id: offer.id },
    data: {
      status: 'ACCEPTED',
      agreedPrice,
      token,
      expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 3_600_000),
      usedAt: null,
    },
  });

  // Le client reçoit son lien personnalisé (prix accordé, catalogue intact)
  const link = `/checkout/negotiated/${token}`;
  await notifyClient(
    offer,
    '✅ Prix accepté !',
    `Le commerçant a accepté votre prix de ${agreedPrice} F pour « ${offer.itemName} » (au lieu de ${Number(offer.basePrice)} F).\nCliquez ici pour commander : ${link}\nCe lien est valable ${TOKEN_TTL_HOURS} h et ne peut être utilisé qu'une seule fois.`
  );

  return {
    ...updated,
    basePrice: Number(updated.basePrice),
    proposedPrice: Number(updated.proposedPrice),
    agreedPrice: Number(updated.agreedPrice),
    expiresAt: updated.expiresAt,
    link,
  };
}

/** Contre-proposition du business → le client décide. */
export async function counterOffer(
  ownerId: string,
  offerId: string,
  counterPrice: number,
  message?: string
) {
  const { offer, business } = await getOwnedOffer(ownerId, offerId);
  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    throw new AppError("Cette offre n'est plus en négociation", 400);
  }
  const price = Math.max(0, Number(counterPrice) || 0);
  if (price <= 0 || price >= Number(offer.basePrice)) {
    throw new AppError('Contre-proposition invalide (doit être < prix affiché)', 400);
  }
  const updated = await prisma.negotiationOffer.update({
    where: { id: offer.id },
    data: { status: 'COUNTERED', counterPrice: price, counterMessage: message || null },
  });
  await notifyClient(
    offer,
    '🤝 Contre-proposition du commerçant',
    `Le commerçant contre-propose ${price} F pour « ${offer.itemName} » (prix affiché ${Number(offer.basePrice)} F).${message ? `\nMessage : ${message}` : ''}`
  );
  return { ...updated, counterPrice: Number(updated.counterPrice) };
}

export async function declineOffer(ownerId: string, offerId: string) {
  const { offer } = await getOwnedOffer(ownerId, offerId);
  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    throw new AppError("Cette offre n'est plus en négociation", 400);
  }
  const updated = await prisma.negotiationOffer.update({
    where: { id: offer.id },
    data: { status: 'DECLINED' },
  });
  await notifyClient(
    offer,
    '❌ Offre refusée',
    `Le commerçant a refusé votre offre sur « ${offer.itemName} ».`
  );
  return updated;
}

// ============================================
// 3. LE LIEN ÉPHÉMÈRE (public)
// ============================================

/** Valide le lien : existe, ACCEPTED, non expiré, non utilisé. */
export async function resolveToken(token: string) {
  if (!token) throw new AppError('Lien manquant', 400);
  const offer = await prisma.negotiationOffer.findUnique({ where: { token } });
  if (!offer) throw new AppError('Lien invalide ou expiré', 404);
  if (offer.status !== 'ACCEPTED') throw new AppError('Lien invalide ou expiré', 404);
  if (offer.usedAt) throw new AppError('Ce lien a déjà été utilisé', 400);
  if (offer.expiresAt && offer.expiresAt < new Date()) {
    throw new AppError('Ce lien a expiré (48 h) — recontactez le commerçant', 400);
  }

  // Prix accordé FIGÉ : lu dans l'offre, jamais dans le catalogue ni dans le body
  const agreedPrice = Number(offer.agreedPrice);
  if (agreedPrice <= 0) throw new AppError('Prix accordé invalide', 400);

  // Vérifier la disponibilité actuelle de l'article (stock, fermeture…)
  const price = await computePrice(offer.businessId, {
    itemType: offer.itemType,
    itemId: offer.itemId,
    quantity: 1,
  });

  return {
    token,
    offerId: offer.id,
    businessId: offer.businessId,
    itemType: offer.itemType,
    itemId: offer.itemId,
    itemName: offer.itemName,
    basePrice: Number(offer.basePrice),
    agreedPrice,
    discountAmount: Math.max(0, Number(offer.basePrice) - agreedPrice),
    available: price.available,
    reason: price.reason || null,
    image: await resolveItemImage(offer.businessId, offer.itemType, offer.itemId),
    expiresAt: offer.expiresAt,
  };
}

// ============================================
// 4. LA COMMANDE NÉGOCIÉE (public) — LA BOUCLE
// ============================================

/**
 * Crée la commande au prix accordé (jamais un prix envoyé par le client).
 * Puis : caisse du jour (Brique A) + alerte boss (Brique B) — la boucle fermée.
 */
export async function createNegotiatedOrder(
  token: string,
  data: {
    paymentMethod?: string;
    contactName?: string;
    contactPhone?: string;
    deliveryAddress?: string;
    notes?: string;
  }
) {
  const resolved = await resolveToken(token);
  const offer = await prisma.negotiationOffer.findUnique({ where: { id: resolved.offerId } });
  if (!offer) throw new AppError('Offre non trouvée', 404);

  const business = await prisma.business.findUnique({
    where: { id: offer.businessId },
    select: { id: true, name: true, ownerId: true, settings: true },
  });
  if (!business) throw new AppError('Commerce introuvable', 404);

  const quantity = 1;
  const unitPrice = resolved.agreedPrice; // ← LE prix de l'offre, jamais du body
  const discountAmount = resolved.discountAmount;
  const total = unitPrice * quantity;

  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // Stock : décrémenté uniquement si produit, et seulement dans CE business
    if (offer.itemType === 'PRODUCT') {
      const product = await tx.product.findFirst({
        where: { id: offer.itemId, businessId: offer.businessId, deletedAt: null },
        select: { id: true, stock: true, name: true },
      });
      if (!product) throw new AppError('Produit introuvable dans ce commerce', 400);
      if ((product.stock ?? 0) < quantity) {
        throw new AppError(`Stock insuffisant pour ${product.name}`, 400);
      }
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: quantity } },
      });
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        businessId: offer.businessId,
        type: 'DELIVERY',
        source: 'WEB_SITE',
        status: 'PENDING',
        contactName: data.contactName || offer.clientName || null,
        contactPhone: data.contactPhone || offer.clientPhone || null,
        deliveryAddress: data.deliveryAddress || null,
        notes: data.notes || offer.message || null,
        internalNotes: `Négociation ${offer.id} — ${offer.itemName} : ${offer.basePrice} F → ${agreedPrice()} F (remise ${discountAmount} F)`,
        subtotal: total,
        discountAmount: discountAmount || null,
        deliveryFee: 0,
        totalAmount: total,
        currency: 'FCFA',
        items: {
          create: [
            {
              productId: offer.itemType === 'PRODUCT' ? offer.itemId : null,
              serviceId: offer.itemType === 'SERVICE' ? offer.itemId : null,
              menuItemId: offer.itemType === 'MENU_ITEM' ? offer.itemId : null,
              name: offer.itemName,
              quantity,
              unitPrice,
              total,
              notes: `Prix négocié (${offer.basePrice} F → ${unitPrice} F)`,
            },
          ],
        },
      },
      include: { items: true },
    });

    // Lien consommé : usage unique garanti (même transaction que la commande)
    await tx.negotiationOffer.update({
      where: { id: offer.id },
      data: { status: 'COMPLETED', usedAt: new Date(), orderId: created.id },
    });

    return created;
  });

  // ── PAIEMENT ──
  const paymentMethod = String(data.paymentMethod || 'CASH').toUpperCase();
  const isCash = paymentMethod === 'CASH' || paymentMethod === '';
  let paymentInfo: {
    status: string;
    providerRef: string | null;
    method: string;
    isDemo: boolean;
  } | null = null;

  if (isCash) {
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: 'PAID', paidAt: new Date(), paymentMethod: 'CASH' },
    });
    // Brique A : l'argent entre dans la caisse du jour au montant EXACT négocié
    await recordOrderSale(
      business.ownerId,
      {
        id: order.id,
        number: order.orderNumber,
        totalAmount: total,
        paymentMethod: 'CASH',
        businessId: order.businessId,
      },
      total,
      business.ownerId
    ).catch((e: any) => logger.warn(`Caisse négociée non tracée: ${e?.message || e}`));
    paymentInfo = { status: 'SUCCESS', providerRef: null, method: 'CASH', isDemo: false };
  } else {
    // Mobile Money / autres : on initie le paiement.
    // En mode démo (pas de clé FedaPay), la confirmation mobile est SIMULÉE
    // immédiatement (pattern public-bookings) : commande PAID + caisse du jour,
    // la boucle se ferme dans la même requête. En mode réel, le paiement reste
    // PENDING et le webhook FedaPay (applyFedaPayEvent) alimentera la caisse.
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentMethod, paymentStatus: 'PENDING' },
    });
    try {
      const { processMobileMoney, saveTransaction, isPaymentDemoMode } =
        await import('./paymentProcessor');
      const paymentResult = await processMobileMoney(
        paymentMethod,
        data.contactPhone || offer.clientPhone || '',
        total,
        `Commande négociée ${orderNumber}`
      );
      if (paymentResult) {
        const demoMode = isPaymentDemoMode();
        const effectiveStatus = demoMode ? 'SUCCESS' : paymentResult.status;
        await saveTransaction({
          businessId: offer.businessId,
          userId: business.ownerId,
          orderId: order.id,
          amount: total,
          currency: 'FCFA',
          provider: paymentMethod,
          providerRef: paymentResult.providerRef,
          status: effectiveStatus,
          fee: paymentResult.fee || 0,
        });
        paymentInfo = {
          status: effectiveStatus,
          providerRef: paymentResult.providerRef || null,
          method: paymentMethod,
          isDemo: demoMode,
        };
        // Démo confirmée immédiatement → commande payée + caisse du jour (Brique A)
        if (effectiveStatus === 'SUCCESS') {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID', paidAt: new Date() },
          });
          await recordOrderSale(
            business.ownerId,
            {
              id: order.id,
              number: order.orderNumber,
              totalAmount: total,
              paymentMethod,
              businessId: order.businessId,
            },
            total,
            business.ownerId
          ).catch((e: any) => logger.warn(`Caisse négociée non tracée: ${e?.message || e}`));
        }
      }
    } catch (e) {
      logger.warn(`Négociation: paiement initié en échec (${order.id}): ${(e as Error).message}`);
    }
  }

  // ── BRIQUE B : ALERTE BOSS (grosse remise) — la remise négociée est TOUJOURS
  // signée : qui (le client + le lien), quoi (l'article), combien (base → accordé).
  const baseAmount = Number(offer.basePrice);
  const finalAmount = total;
  const remise = Math.max(0, baseAmount - finalAmount);
  const threshold = Number((business.settings as any)?.discountAlertThreshold ?? 5000);
  if (remise >= threshold) {
    try {
      getIO()?.to(`user:${business.ownerId}`).emit('boss:discount-alert', {
        businessId: business.id,
        businessName: business.name,
        orderId: order.id,
        orderNumber: order.orderNumber,
        baseAmount,
        finalAmount,
        discountAmount: remise,
        performedBy: business.ownerId,
        performedByName: 'Négociation client',
        itemLabel: offer.itemName,
      });
    } catch {}
    try {
      publishBossDiscountAlert({
        userId: business.ownerId,
        businessId: business.id,
        businessName: business.name,
        orderId: order.id,
        orderNumber: order.orderNumber,
        baseAmount,
        finalAmount,
        discountAmount: remise,
        performedBy: business.ownerId,
        performedByName: 'Négociation client',
        itemLabel: offer.itemName,
      });
    } catch (e) {
      logger.warn(`Alerte boss négociation non envoyée: ${(e as Error).message}`);
    }
  }

  await notifyBusiness(
    business,
    `🛍️ Commande négociée ${order.orderNumber} (${finalAmount} F)`,
    `${offer.itemName} — remise de ${remise} F accordée via négociation`,
    `/dashboard/orders/${order.id}`
  );

  return {
    ...order,
    negotiated: {
      basePrice: baseAmount,
      agreedPrice: finalAmount,
      discountAmount: remise,
      itemName: offer.itemName,
    },
    payment: paymentInfo,
  };

  function agreedPrice() {
    return unitPrice;
  }
}

/** Récupère la première image de l'article (pour la fiche du lien éphémère). */
async function resolveItemImage(
  businessId: string,
  itemType: string,
  itemId: string
): Promise<string | null> {
  try {
    if (itemType === 'PRODUCT') {
      const p = await prisma.product.findFirst({
        where: { id: itemId, businessId },
        select: { images: true },
      });
      return p?.images?.[0] || null;
    }
    if (itemType === 'SERVICE') {
      const s = await prisma.service.findFirst({
        where: { id: itemId, businessId },
        select: { images: true },
      });
      return s?.images?.[0] || null;
    }
    if (itemType === 'ROOM') {
      const r = await prisma.room.findFirst({
        where: { id: itemId, businessId },
        select: { images: true },
      });
      return r?.images?.[0] || null;
    }
    if (itemType === 'RENTAL') {
      const r = await prisma.rental.findFirst({
        where: { id: itemId, businessId },
        select: { images: true },
      });
      return r?.images?.[0] || null;
    }
    if (itemType === 'EVENT') {
      const e = await prisma.event.findFirst({
        where: { id: itemId, businessId },
        select: { coverImage: true },
      });
      return (e as any)?.coverImage || null;
    }
    return null;
  } catch {
    return null;
  }
}
