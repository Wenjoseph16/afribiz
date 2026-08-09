import { NotificationType } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { getIO } from './socket';
import { processMobileMoney } from './paymentProcessor';
import { trackAnalyticsEvent } from './analyticsService';
import { publishOrderPlaced } from '../events/publishers';
import { ensureInvoiceForOrder } from './orders';
import { findValidCoupon, computeCouponDiscount, logPromotionApplied } from './promotions';
import { toDataURL } from 'qrcode';

const ESCROW_COMMISSION_RATE = 0.01; // 1% sur la libération (cohérent avec monetizationConfig)

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, name: true, slug: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business;
}

/**
 * Résout un item (tout le catalogue : produit, service, chambre, location,
 * événement/billet, formation) et vérifie qu'il appartient au business.
 */
async function resolveItem(businessId: string, itemType: string, itemId: string) {
  const SUPPORTED = ['PRODUCT', 'SERVICE', 'ROOM', 'RENTAL', 'EVENT', 'TRAINING'];
  if (!SUPPORTED.includes(itemType)) {
    throw new AppError(`Type d'article non supporté (${SUPPORTED.join(', ')})`, 400);
  }
  if (itemType === 'PRODUCT') {
    const p = await prisma.product.findFirst({ where: { id: itemId, businessId } });
    if (!p) throw new AppError('Produit non trouvé pour ce business', 404);
    return {
      name: p.name,
      image: (p.images && p.images[0]) || null,
      price: Number(p.price),
      currency: p.currency || 'FCFA',
    };
  }
  if (itemType === 'SERVICE') {
    const s = await prisma.service.findFirst({ where: { id: itemId, businessId } });
    if (!s) throw new AppError('Service non trouvé pour ce business', 404);
    return {
      name: s.name,
      image: (s.images && s.images[0]) || null,
      price: Number(s.price || 0),
      currency: s.currency || 'FCFA',
    };
  }
  if (itemType === 'ROOM') {
    const r = await prisma.room.findFirst({ where: { id: itemId, businessId } });
    if (!r) throw new AppError('Chambre non trouvée pour ce business', 404);
    return {
      name: r.name,
      image: (r.images && r.images[0]) || null,
      price: Number(r.price || 0),
      currency: r.currency || 'FCFA',
    };
  }
  if (itemType === 'RENTAL') {
    const r = await prisma.rental.findFirst({ where: { id: itemId, businessId } });
    if (!r) throw new AppError('Location non trouvée pour ce business', 404);
    return {
      name: r.name,
      image: (r.images && r.images[0]) || null,
      price: Number(r.price || 0),
      currency: r.currency || 'FCFA',
    };
  }
  if (itemType === 'EVENT') {
    const e = await prisma.event.findFirst({ where: { id: itemId, businessId } });
    if (!e) throw new AppError('Événement non trouvé pour ce business', 404);
    // Prix cible = billet le moins cher (épargner pour un billet d'événement)
    const tickets = await prisma.eventTicket.findMany({ where: { eventId: e.id } });
    const price =
      tickets.length > 0
        ? Math.min(...tickets.map((t) => Number(t.price || 0)))
        : Number(e.price || 0);
    return {
      name: e.title,
      image: e.coverImage || null,
      price,
      currency: e.currency || 'FCFA',
    };
  }
  // TRAINING
  const t = await prisma.training.findFirst({ where: { id: itemId, businessId } });
  if (!t) throw new AppError('Formation non trouvée pour ce business', 404);
  return {
    name: t.title,
    image: null,
    price: Number(t.price || 0),
    currency: 'FCFA',
  };
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
        // NB: le modèle Notification n'a pas de colonne businessId — on le garde
        // dans metadata pour le filtrage côté business sans casser la validation.
        metadata: businessId ? { businessId, source: 'layaway' } : { source: 'layaway' },
      },
    });
  } catch (err) {
    logger.warn('Layaway notification failed', { error: (err as Error).message });
  }
}

function emitUser(userId: string, event: string, data: unknown) {
  try {
    getIO()?.to(`user:${userId}`).emit(event, data);
  } catch {
    /* socket non prêt : non bloquant */
  }
}

function emitBusiness(businessId: string, event: string, data: unknown) {
  try {
    getIO()?.to(`business:${businessId}`).emit(event, data);
  } catch {
    /* socket non prêt : non bloquant */
  }
}

function computeProgress(saved: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((saved / target) * 100));
}

// ─────────────────────────────────────────────
// BUSINESS — OFFRES D'ÉPARGNE
// ─────────────────────────────────────────────

export async function createLayawayOffer(
  ownerId: string,
  data: { itemType: string; itemId: string; durationDays?: number; minInstallment?: number }
) {
  const business = await getBusinessByOwner(ownerId);
  const item = await resolveItem(business.id, data.itemType, data.itemId);
  // Un article sans prix ne peut pas être épargné : on refuse l'activation
  // dès maintenant pour éviter un badge « Épargne dispo » qui échoue au clic.
  if (!item.price || item.price <= 0) {
    throw new AppError(
      data.itemType === 'EVENT'
        ? "Cet événement n'a pas de billet/prix — ajoutez un billet avant d'activer l'épargne"
        : "Cet article n'a pas de prix — renseignez un prix avant d'activer l'épargne",
      400
    );
  }
  const durationDays = Math.max(7, Math.min(365, data.durationDays || 90));
  const minInstallment = Math.max(1000, data.minInstallment || 2000);

  const offer = await prisma.layawayOffer.upsert({
    where: { itemType_itemId: { itemType: data.itemType, itemId: data.itemId } },
    update: {
      businessId: business.id,
      durationDays,
      minInstallment,
      isActive: true,
    },
    create: {
      businessId: business.id,
      itemType: data.itemType,
      itemId: data.itemId,
      durationDays,
      minInstallment,
      isActive: true,
    },
  });

  trackAnalyticsEvent({
    businessId: business.id,
    userId: ownerId,
    type: 'layaway',
    category: 'commercial',
    eventName: 'LAYAWAY_OFFER_CREATED',
    properties: { itemType: data.itemType, itemId: data.itemId, durationDays },
  }).catch(() => {});

  return { offer, item };
}

export async function listLayawayOffers(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const offers = await prisma.layawayOffer.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
  // Enrichir chaque offre avec le nom/prix de l'item
  return Promise.all(
    offers.map(async (o) => {
      let item: { name: string; price: number; image?: string | null } = { name: o.itemId, price: 0 };
      try {
        item = await resolveItem(business.id, o.itemType, o.itemId);
      } catch {
        /* item supprimé : on garde l'id */
      }
      return { ...o, item };
    })
  );
}

export async function toggleLayawayOffer(ownerId: string, offerId: string, isActive: boolean) {
  const business = await getBusinessByOwner(ownerId);
  const offer = await prisma.layawayOffer.findFirst({ where: { id: offerId, businessId: business.id } });
  if (!offer) throw new AppError('Offre épargne non trouvée', 404);
  return prisma.layawayOffer.update({ where: { id: offer.id }, data: { isActive } });
}

export async function deleteLayawayOffer(ownerId: string, offerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const offer = await prisma.layawayOffer.findFirst({ where: { id: offerId, businessId: business.id } });
  if (!offer) throw new AppError('Offre épargne non trouvée', 404);
  const activePlans = await prisma.layawayPlan.count({ where: { offerId: offer.id, status: { in: ['ACTIVE', 'READY'] } } });
  if (activePlans > 0) throw new AppError('Impossible : des plans épargne sont en cours sur cet article', 400);
  await prisma.layawayOffer.delete({ where: { id: offer.id } });
  return { success: true };
}

export async function listBusinessLayawayPlans(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const plans = await prisma.layawayPlan.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
    include: { contributions: true, offer: true },
    take: 100,
  });
  return plans.map((p) => ({
    ...p,
    savedAmount: Number(p.savedAmount),
    targetAmount: Number(p.targetAmount),
    progress: computeProgress(Number(p.savedAmount), Number(p.targetAmount)),
  }));
}

export async function getBusinessLayawayStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const [totalPlans, activePlans, readyPlans, completedPlans, escrowAgg] = await Promise.all([
    prisma.layawayPlan.count({ where: { businessId: business.id } }),
    prisma.layawayPlan.count({ where: { businessId: business.id, status: 'ACTIVE' } }),
    prisma.layawayPlan.count({ where: { businessId: business.id, status: 'READY' } }),
    prisma.layawayPlan.count({ where: { businessId: business.id, status: 'COMPLETED' } }),
    prisma.layawayPlan.aggregate({ where: { businessId: business.id, status: { in: ['ACTIVE', 'READY'] } }, _sum: { savedAmount: true } }),
  ]);
  const totalEscrowed = Number(escrowAgg._sum.savedAmount || 0);
  return {
    totalPlans,
    activePlans,
    readyPlans,
    completedPlans,
    totalEscrowed,
    expectedRevenue: totalEscrowed,
    commissionAtRelease: Math.round(totalEscrowed * ESCROW_COMMISSION_RATE),
  };
}

// ─────────────────────────────────────────────
// PUBLIC / CLIENT — PLANS
// ─────────────────────────────────────────────

/** Offre active sur un article (utilisé par la fiche produit pour afficher le badge). */
export async function getActiveOffer(itemType: string, itemId: string) {
  return prisma.layawayOffer.findFirst({ where: { itemType, itemId, isActive: true } });
}

/** Offres actives pour plusieurs articles d'un même type (1 seul appel pour une grille de produits). */
export async function getActiveOffersForItems(itemType: string, itemIds: string[]) {
  const clean = itemIds.filter((id) => typeof id === 'string' && id.length > 0);
  if (clean.length === 0) return {};
  const offers = await prisma.layawayOffer.findMany({
    where: { itemType, itemId: { in: clean }, isActive: true },
  });
  const map: Record<string, any> = {};
  for (const o of offers) {
    map[o.itemId] = {
      id: o.id,
      durationDays: o.durationDays,
      minInstallment: Number(o.minInstallment),
      isActive: o.isActive,
    };
  }
  return map;
}

export async function createLayawayPlan(clientId: string, offerId: string) {
  const offer = await prisma.layawayOffer.findFirst({ where: { id: offerId, isActive: true } });
  if (!offer) throw new AppError('Offre épargne non disponible', 404);

  const existing = await prisma.layawayPlan.findFirst({
    where: { clientId, offerId, status: { in: ['ACTIVE', 'READY'] } },
  });
  if (existing) throw new AppError('Vous avez déjà un plan épargne actif sur cet article', 409);

  const item = await resolveItem(offer.businessId, offer.itemType, offer.itemId);
  const targetAmount = item.price;
  if (targetAmount <= 0) throw new AppError('Cet article ne peut pas être épargné (prix manquant)', 400);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + offer.durationDays);

  const plan = await prisma.layawayPlan.create({
    data: {
      businessId: offer.businessId,
      clientId,
      offerId: offer.id,
      itemType: offer.itemType,
      itemId: offer.itemId,
      itemName: item.name,
      itemImage: item.image,
      targetAmount,
      savedAmount: 0,
      minInstallment: offer.minInstallment,
      durationDays: offer.durationDays,
      status: 'ACTIVE',
      expiresAt,
    },
  });

  await prisma.layawayOffer.update({
    where: { id: offer.id },
    data: { planCount: { increment: 1 } },
  });

  // Notifier le business : un client commence à épargner sur son produit
  const owner = await prisma.business.findUnique({ where: { id: offer.businessId }, select: { ownerId: true } });
  if (owner?.ownerId) {
    await notify(
      owner.ownerId,
      offer.businessId,
      NotificationType.PROMOTION,
      '🎯 Nouveau plan épargne',
      `${item.name} — un client a commencé à épargner (${offer.durationDays} jours).`,
      '/dashboard/business/layaway'
    ).catch(() => {});
    emitBusiness(offer.businessId, 'layaway:plan-created', { planId: plan.id, itemName: item.name });
  }

  trackAnalyticsEvent({
    businessId: offer.businessId,
    userId: clientId,
    type: 'layaway',
    category: 'commercial',
    eventName: 'LAYAWAY_PLAN_CREATED',
    properties: { itemId: offer.itemId, itemType: offer.itemType, targetAmount },
  }).catch(() => {});

  return plan;
}

export async function listMyLayawayPlans(clientId: string) {
  const plans = await prisma.layawayPlan.findMany({
    where: { clientId },
    orderBy: { createdAt: 'desc' },
    include: { contributions: { orderBy: { createdAt: 'desc' } }, offer: true },
  });
  return plans.map((p) => ({
    ...p,
    savedAmount: Number(p.savedAmount),
    targetAmount: Number(p.targetAmount),
    minInstallment: Number(p.minInstallment),
    progress: computeProgress(Number(p.savedAmount), Number(p.targetAmount)),
    remaining: Math.max(0, Number(p.targetAmount) - Number(p.savedAmount)),
  }));
}

export async function getLayawayPlan(planId: string, clientId: string) {
  const plan = await prisma.layawayPlan.findFirst({
    where: { id: planId, clientId },
    include: { contributions: { orderBy: { createdAt: 'desc' } }, offer: true },
  });
  if (!plan) throw new AppError('Plan épargne non trouvé', 404);
  return {
    ...plan,
    savedAmount: Number(plan.savedAmount),
    targetAmount: Number(plan.targetAmount),
    progress: computeProgress(Number(plan.savedAmount), Number(plan.targetAmount)),
  };
}

// ─────────────────────────────────────────────
// COTISATIONS (argent → escrow)
// ─────────────────────────────────────────────

export async function contributeToLayaway(
  clientId: string,
  planId: string,
  data: { amount: number; method?: string; phone?: string }
) {
  const plan = await prisma.layawayPlan.findFirst({ where: { id: planId, clientId } });
  if (!plan) throw new AppError('Plan épargne non trouvé', 404);
  if (plan.status !== 'ACTIVE') throw new AppError('Ce plan ne peut plus recevoir de cotisations', 400);

  const saved = Number(plan.savedAmount);
  const target = Number(plan.targetAmount);
  const remaining = target - saved;
  if (remaining <= 0) throw new AppError('Plan déjà complet — validez votre achat', 400);

  const amount = Math.min(data.amount, remaining);
  // La cotisation qui complète le plan est toujours acceptée, même sous le minimum
  // (sinon un restant < minInstallment bloquerait le client à 95% d'épargne)
  if (amount < Number(plan.minInstallment) && amount < remaining) {
    throw new AppError(`Cotisation minimale : ${Number(plan.minInstallment)} FCFA`, 400);
  }

  const method = (data.method || 'MOBILE_MONEY').toUpperCase();
  const provider = method.startsWith('WAVE') ? 'WAVE' : method.startsWith('ORANGE') ? 'ORANGE' : method;

  // Paiement Mobile Money (simulé en dev, FedaPay en prod)
  let paymentRef = `LAY-${Date.now()}`;
  try {
    const mm = await processMobileMoney(provider, data.phone || '+2250000000000', amount, `Épargne ${plan.itemName}`);
    paymentRef = (mm as any)?.reference || (mm as any)?.providerRef || paymentRef;
  } catch (err) {
    logger.warn('Layaway payment provider failed, fallback simulation', { error: (err as Error).message });
  }

  // Transaction : escrow + payment + contribution + progression
  const result = await prisma.$transaction(async (tx) => {
    // 1. Escrow du plan (créé à la première cotisation, grossit ensuite)
    let escrow = plan.escrowId
      ? await tx.escrow.findUnique({ where: { id: plan.escrowId } })
      : null;
    if (!escrow) {
      escrow = await tx.escrow.create({
        data: {
          businessId: plan.businessId,
          amount,
          currency: 'FCFA',
          status: 'HELD',
          fee: 0,
          feeRate: 0,
          notes: `Épargne Achat — ${plan.itemName} (client sécurisé)`,
        },
      });
      await tx.layawayPlan.update({ where: { id: plan.id }, data: { escrowId: escrow.id } });
    } else {
      escrow = await tx.escrow.update({
        where: { id: escrow.id },
        data: { amount: { increment: amount } },
      });
    }

    // 2. Payment (argent du client → escrow)
    const payment = await tx.payment.create({
      data: {
        userId: clientId,
        businessId: plan.businessId,
        escrowId: escrow.id,
        amount,
        currency: 'FCFA',
        method: 'MOBILE_MONEY',
        status: 'COMPLETED',
        reference: paymentRef,
        description: `Cotisation épargne — ${plan.itemName}`,
        paidAt: new Date(),
      },
    });

    // 3. Contribution
    const contribution = await tx.layawayContribution.create({
      data: {
        planId: plan.id,
        amount,
        currency: 'FCFA',
        method,
        status: 'PAID',
        paymentId: payment.id,
        reference: paymentRef,
      },
    });

    // 4. Progression
    const newSaved = saved + amount;
    const isComplete = newSaved >= target;
    const updatedPlan = await tx.layawayPlan.update({
      where: { id: plan.id },
      data: {
        savedAmount: newSaved,
        status: isComplete ? 'READY' : 'ACTIVE',
      },
    });

    return { escrow, payment, contribution, newSaved, isComplete, updatedPlan };
  });

  // Notifications + socket
  if (result.isComplete) {
    await notify(
      clientId,
      plan.businessId,
      NotificationType.PAYMENT_RECEIVED,
      '🎉 Objectif atteint !',
      `${plan.itemName} — vous avez épargné 100%. Validez votre achat pour la livraison.`,
      '/dashboard/my-layaway'
    ).catch(() => {});
    emitUser(clientId, 'layaway:complete', { planId: plan.id, itemName: plan.itemName });
  } else {
    await notify(
      clientId,
      plan.businessId,
      NotificationType.PAYMENT_RECEIVED,
      '💚 Cotisation reçue',
      `${amount} FCFA ajoutés à votre épargne ${plan.itemName} (${result.newSaved}/${target} FCFA).`,
      '/dashboard/my-layaway'
    ).catch(() => {});
    emitUser(clientId, 'layaway:updated', {
      planId: plan.id,
      savedAmount: result.newSaved,
      progress: computeProgress(result.newSaved, target),
    });
  }
  const owner = await prisma.business.findUnique({ where: { id: plan.businessId }, select: { ownerId: true } });
  if (owner?.ownerId) {
    await notify(
      owner.ownerId,
      plan.businessId,
      NotificationType.PAYMENT_RECEIVED,
      '💰 Cotisation épargne reçue',
      `${amount} FCFA séquestrés sur ${plan.itemName} (total ${result.newSaved}/${target}).`,
      '/dashboard/business/layaway'
    ).catch(() => {});
    emitBusiness(plan.businessId, 'layaway:contribution', {
      planId: plan.id,
      itemName: plan.itemName,
      savedAmount: result.newSaved,
      progress: computeProgress(result.newSaved, target),
    });
  }

  trackAnalyticsEvent({
    businessId: plan.businessId,
    userId: clientId,
    type: 'layaway',
    category: 'payment',
    eventName: 'LAYAWAY_CONTRIBUTION',
    properties: { planId, amount, progress: computeProgress(result.newSaved, target) },
  }).catch(() => {});

  return {
    ...result,
    amount,
    progress: computeProgress(result.newSaved, target),
    remaining: Math.max(0, target - result.newSaved),
  };
}

// ─────────────────────────────────────────────
// ANNULATION — remboursement intégral (confiance)
// ─────────────────────────────────────────────

export async function cancelLayawayPlan(clientId: string, planId: string) {
  const plan = await prisma.layawayPlan.findFirst({ where: { id: planId, clientId } });
  if (!plan) throw new AppError('Plan épargne non trouvé', 404);
  if (!['ACTIVE', 'READY'].includes(plan.status)) throw new AppError('Ce plan ne peut pas être annulé', 400);

  const saved = Number(plan.savedAmount);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.layawayPlan.update({
      where: { id: plan.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    // Remboursement intégral de l'escrow (jamais chez le business)
    if (plan.escrowId) {
      await tx.escrow.update({
        where: { id: plan.escrowId },
        data: { status: 'REFUNDED', refundedAt: new Date(), notes: `Remboursement intégral épargne ${plan.itemName}` },
      });
      await tx.payment.updateMany({
        where: { escrowId: plan.escrowId },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });
    }
    await tx.layawayContribution.updateMany({
      where: { planId: plan.id },
      data: { status: 'REFUNDED' },
    });
    return updated;
  });

  await notify(
    clientId,
    plan.businessId,
    NotificationType.PAYMENT_REFUNDED,
    '↩️ Épargne annulée — remboursement intégral',
    `${saved} FCFA vous seront remboursés (0 frais). L'argent n'est jamais resté chez le vendeur.`,
    '/dashboard/my-layaway'
  ).catch(() => {});
  emitUser(clientId, 'layaway:cancelled', { planId: plan.id, refunded: saved });
  const owner = await prisma.business.findUnique({ where: { id: plan.businessId }, select: { ownerId: true } });
  if (owner?.ownerId) {
    await notify(
      owner.ownerId,
      plan.businessId,
      NotificationType.PAYMENT_REFUNDED,
      '↩️ Plan épargne annulé',
      `${plan.itemName} — ${saved} FCFA remboursés au client.`,
      '/dashboard/business/layaway'
    ).catch(() => {});
  }

  trackAnalyticsEvent({
    businessId: plan.businessId,
    userId: clientId,
    type: 'layaway',
    category: 'commercial',
    eventName: 'LAYAWAY_CANCELLED',
    properties: { planId, refunded: saved },
  }).catch(() => {});

  return result;
}

// ─────────────────────────────────────────────
// VALIDATION FINALE — commande + libération escrow
// ─────────────────────────────────────────────

export async function confirmLayawayCheckout(
  clientId: string,
  planId: string,
  options?: { checkIn?: string; checkOut?: string; guests?: number; couponCode?: string }
) {
  const plan = await prisma.layawayPlan.findFirst({ where: { id: planId, clientId } });
  if (!plan) throw new AppError('Plan épargne non trouvé', 404);
  if (plan.status !== 'READY') throw new AppError("Ce plan n'est pas complet (100% requis)", 400);

  const target = Number(plan.targetAmount);
  const saved = Number(plan.savedAmount);
  if (saved < target) throw new AppError("L'épargne n'est pas encore complète", 400);

  // ── Promotion : un code promo du business s'applique RÉELLEMENT à l'épargne ──
  // La remise est financée par le business : le client paie (target - remise), le
  // business reçoit (target - remise - commission), la remise revient au client.
  let coupon: any = null;
  let discountAmount = 0;
  if (options?.couponCode && options.couponCode.trim()) {
    coupon = await findValidCoupon(options.couponCode, plan.businessId, target, clientId);
    discountAmount = computeCouponDiscount(coupon, target);
  }
  const total = Math.max(0, target - discountAmount); // prix payé par le client

  const fee = Math.round(total * ESCROW_COMMISSION_RATE * 100) / 100;
  const netAmount = total - fee; // part business (remise + commission déduites)
  // Numéro unique garanti : orderNumber est contraint UNIQUE en base (P2002 sinon),
  // et le préfixe dérivé de l'id seul pouvait entrer en collision (ex. lw-plan-1 / lw-plan-10).
  const orderNumber = `CMD-LW-${String(plan.id).slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

  // Dates par défaut (chambre / location) : week-end prochain si non fournies
  const defaultCheckIn = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const checkIn = options?.checkIn ? new Date(options.checkIn) : defaultCheckIn;
  let checkOut = options?.checkOut ? new Date(options.checkOut) : new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new AppError('Dates de réservation invalides', 400);
  }
  if (checkOut <= checkIn) checkOut = new Date(checkIn.getTime() + 24 * 60 * 60 * 1000);
  if (checkIn < new Date(new Date().setHours(0, 0, 0, 0))) {
    throw new AppError("La date d'arrivée ne peut pas être dans le passé", 400);
  }
  const guests = Math.max(1, options?.guests || 1);

  // Pré-générer le billet (ref + QR) HORS transaction : si le QR échoue, la vente
  // se fait quand même (qrCode est nullable) au lieu de faire échouer toute la
  // conversion (commande + escrow + réservation) pour un simple artefact d'affichage.
  let ticketPrepared: { ticketRef?: string; qrData?: string; qrCode?: string } = {};
  if (plan.itemType === 'EVENT') {
    ticketPrepared.ticketRef = `TKT-LW-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    ticketPrepared.qrData = `EVENT:${plan.itemId}:TKT:${ticketPrepared.ticketRef}`;
    try {
      ticketPrepared.qrCode = await toDataURL(ticketPrepared.qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
      });
    } catch (err) {
      logger.warn('Layaway QR generation failed', { error: (err as Error).message });
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // 0. Réserve atomique du plan (READY → COMPLETED) : un seul confirm possible,
    //    même en cas de double clic ou de requêtes parallèles (anti-double commande/facture).
    const claimed = await tx.layawayPlan.updateMany({
      where: { id: plan.id, clientId, status: 'READY' },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
    if (claimed.count === 0) {
      throw new AppError('Ce plan a déjà été converti en commande', 409);
    }

    // 1. Commande (comme un checkout normal, statut CONFIRMED + payé).
    //    Type selon l'article : PICKUP pour un billet (retiré sur place), DELIVERY sinon.
    //    totalAmount = prix APRÈS remise ; subtotal = prix d'origine ; discountAmount tracé.
    const order = await tx.order.create({
      data: {
        businessId: plan.businessId,
        buyerId: clientId,
        orderNumber,
        type: plan.itemType === 'EVENT' ? 'PICKUP' : 'DELIVERY',
        source: 'WEB_SITE',
        status: 'CONFIRMED',
        totalAmount: total,
        subtotal: target,
        deliveryFee: 0,
        discountAmount,
        currency: 'FCFA',
        contactName: 'Client épargne',
        paymentMethod: 'Escrow sécurisé',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        createdAt: new Date(),
        notes:
          `Acheté via Épargne Achat (${plan.itemName}) — plan ${plan.id}` +
          (coupon ? ` | Promo ${coupon.code} (-${discountAmount} FCFA)` : ''),
        // Trace lisible par ensureInvoiceForOrder → la facture auto porte le promoCode
        internalNotes: coupon ? `Promo : ${coupon.code} (-${discountAmount} FCFA)` : null,
      } as any,
    });
    // Lier le bon type d'item à la ligne de commande (productId / serviceId / nom seul)
    await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: plan.itemType === 'PRODUCT' ? plan.itemId : null,
        serviceId: plan.itemType === 'SERVICE' ? plan.itemId : null,
        name: plan.itemName,
        quantity: 1,
        unitPrice: target,
        total: target,
      } as any,
    });

    // 1b. Réservation (chambre / location) — l'épargne devient une vraie réservation
    //     visible dans le module Bookings du business.
    let booking: any = null;
    if (plan.itemType === 'ROOM' || plan.itemType === 'RENTAL') {
      const bookingNumber = `RES-LW-${String(plan.id).slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      booking = await tx.booking.create({
        data: {
          bookingNumber,
          businessId: plan.businessId,
          clientId,
          title: plan.itemName,
          type: plan.itemType === 'ROOM' ? 'ROOM' : 'SERVICE',
          source: 'AFRIBIZ_SITE',
          status: 'CONFIRMED',
          roomId: plan.itemType === 'ROOM' ? plan.itemId : null,
          rentalId: plan.itemType === 'RENTAL' ? plan.itemId : null,
          startDate: checkIn,
          endDate: checkOut,
          checkIn,
          checkOut,
          guests,
          adults: guests,
          price: target,
          currency: 'FCFA',
          depositAmount: target,
          depositPaid: true,
          customerName: 'Client épargne',
          notes: `Acheté via Épargne Achat — plan ${plan.id} (escrow libéré)`,
        } as any,
      });
    }

    // 1c. Billet d'événement — l'épargne devient un vrai participant + billet (QR),
    //     le stock du billet le moins cher est décrémenté, les stats événement mises à jour.
    let participant: any = null;
    if (plan.itemType === 'EVENT') {
      const ticket = await tx.eventTicket.findFirst({
        where: {
          eventId: plan.itemId,
          isActive: true,
          saleStatus: 'ACTIVE',
          remaining: { gt: 0 },
        },
        orderBy: { price: 'asc' as const },
      });
      if (!ticket) throw new AppError('Aucun billet disponible pour cet événement', 409);
      const ticketRef = ticketPrepared.ticketRef!;
      participant = await tx.eventParticipant.create({
        data: {
          eventId: plan.itemId,
          ticketId: ticket.id,
          clientId,
          ticketRef,
          qrData: ticketPrepared.qrData,
          qrCode: ticketPrepared.qrCode || null,
          ticketType: ticket.type,
          price: target,
          currency: 'FCFA',
          firstName: 'Client',
          lastName: 'Épargne',
          isPaid: true,
          paidAt: new Date(),
          paymentMethod: 'Escrow sécurisé',
          status: 'REGISTERED',
          notes: `Acheté via Épargne Achat — plan ${plan.id} (escrow libéré)`,
        } as any,
      });
      await tx.eventTicket.update({
        where: { id: ticket.id },
        data: { remaining: { decrement: 1 } },
      });
      await tx.event.update({
        where: { id: plan.itemId },
        data: {
          ticketsSold: { increment: 1 },
          totalRevenue: { increment: target },
        },
      });
    }

    // 1d. Formation — l'épargne devient une VRAIE inscription (UserTraining) déjà payée,
    //     visible dans « Mes formations » du client et côté business.
    let enrollment: any = null;
    if (plan.itemType === 'TRAINING') {
      const existing = await tx.userTraining.findUnique({
        where: { userId_trainingId: { userId: clientId, trainingId: plan.itemId } },
      });
      if (existing) throw new AppError('Vous êtes déjà inscrit à cette formation', 409);
      enrollment = await tx.userTraining.create({
        data: {
          userId: clientId,
          trainingId: plan.itemId,
          status: 'NOT_STARTED',
          progress: 0,
          isPaid: true,
          paidAt: new Date(),
          amountPaid: target,
          paymentRef: order.id,
        },
      });
    }

    // 1e. Remise promo — l'argent revient au client (jamais au business) :
    //     tracé par un Payment REFUNDED + usageCount du coupon + PromotionLog.
    if (discountAmount > 0 && coupon) {
      await tx.payment.create({
        data: {
          userId: clientId,
          businessId: plan.businessId,
          orderId: order.id,
          amount: discountAmount,
          currency: 'FCFA',
          method: 'MOBILE_MONEY',
          status: 'REFUNDED',
          refundedAt: new Date(),
          reference: `PROMO-${coupon.code}`,
          description: `Remise promo ${coupon.code} — ${plan.itemName} (remboursée sur votre épargne)`,
        },
      });
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { useCount: { increment: 1 } },
      });
      await logPromotionApplied(plan.businessId, {
        promotionId: coupon.promotionId,
        couponId: coupon.id,
        description: `Coupon ${coupon.code} appliqué sur épargne ${plan.itemName} (${discountAmount} FCFA)`,
        metadata: { target, discountAmount, total, orderId: order.id },
      });
    }

    // 2. Libération de l'escrow → wallet du business (moins commission 1%)
    if (plan.escrowId) {
      const escrow = await tx.escrow.update({
        where: { id: plan.escrowId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
          releasedToWallet: true,
          fee,
          feeRate: ESCROW_COMMISSION_RATE * 100,
          netAmount,
          notes: `Libéré — ${plan.itemName}${coupon ? ` (promo ${coupon.code})` : ''}`,
        },
      });

      const wallet = await tx.wallet.upsert({
        where: { businessId: plan.businessId },
        update: { balance: { increment: netAmount } },
        create: { businessId: plan.businessId, balance: netAmount, currency: 'FCFA' },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'ESCROW_RELEASE',
          amount: netAmount,
          balanceBefore: Number(wallet.balance) - netAmount,
          balanceAfter: Number(wallet.balance),
          currency: 'FCFA',
          reference: order.id,
          description: `Libération Épargne Achat — ${plan.itemName} (commission ${fee} FCFA)`,
          metadata: { layawayPlanId: plan.id, escrowId: escrow.id },
          status: 'COMPLETED',
        },
      });

      // 2b. Commission plateforme tracée (cohérence revenus) : la commission 1%
      //     apparaît dans la compta du business et dans les stats plateforme.
      if (fee > 0) {
        await tx.financialLog.create({
          data: {
            businessId: plan.businessId,
            action: 'MANUAL_ADJUSTMENT',
            amount: -fee,
            description: `Commission AfriBiz 1% sur Épargne Achat — ${plan.itemName} (${total} FCFA)`,
            metadata: {
              commissionType: 'LAYAWAY_ESCROW_FEE',
              layawayPlanId: plan.id,
              orderId: order.id,
              escrowId: escrow.id,
              gross: total,
              discountAmount,
              fee,
              netAmount,
            },
          },
        });
      }
    }

    // 3. Lier la commande au plan (déjà réservé COMPLETED par l'étape 0)
    const updatedPlan = await tx.layawayPlan.update({
      where: { id: plan.id },
      data: { orderId: order.id },
    });

    return { order, updatedPlan, booking, participant, enrollment };
  });

  const owner = await prisma.business.findUnique({
    where: { id: plan.businessId },
    select: { id: true, name: true, ownerId: true },
  });

  // 1. Facture automatique — la commande épargne est déjà payée (escrow libéré) :
  //    facture créée directement PAID, liée via Invoice.orderId (non bloquant).
  try {
    const orderWithItems = await prisma.order.findUnique({
      where: { id: result.order.id },
      include: { items: true },
    });
    if (orderWithItems && owner) {
      await ensureInvoiceForOrder(orderWithItems as any, owner as any, 'CONFIRMED', true);
    }
  } catch (err) {
    logger.warn('Layaway invoice auto-creation failed', { error: (err as Error).message });
  }

  // 2. Flux commande standard — ciblé sur l'acheteur : notification « Commande passée »,
  //    points de fidélité (LoyaltyAutomation), tâches auto (advancedTasks) et
  //    rafraîchissement temps réel de la room business:{id} (businessRoomHandler).
  emitUser(clientId, 'layaway:checkout-confirmed', { planId: plan.id, orderId: result.order.id });
  // Montant ANNONCÉ = prix réellement payé (remise déduite) — cohérence avec la commande.
  publishOrderPlaced({
    userId: clientId,
    orderId: result.order.id,
    businessName: plan.itemName,
    amount: String(total),
    businessId: plan.businessId,
  });

  // 3. Notification propriétaire — message clair et actionnable (wallet + commission).
  if (owner?.ownerId) {
    if (plan.itemType === 'ROOM') {
      await notify(
        owner.ownerId,
        plan.businessId,
        NotificationType.ORDER_PLACED,
        '🏨 Nouvelle réservation épargne !',
        `${plan.itemName} réservée (${guests} pers.) — ${netAmount} FCFA libérés sur votre wallet.`,
        '/dashboard/bookings'
      ).catch(() => {});
      emitBusiness(plan.businessId, 'layaway:booking-created', {
        planId: plan.id,
        bookingId: result.booking?.id,
        itemName: plan.itemName,
      });
    } else if (plan.itemType === 'RENTAL') {
      await notify(
        owner.ownerId,
        plan.businessId,
        NotificationType.ORDER_PLACED,
        '🏕️ Nouvelle location épargne !',
        `${plan.itemName} louée — ${netAmount} FCFA libérés sur votre wallet.`,
        '/dashboard/bookings'
      ).catch(() => {});
      emitBusiness(plan.businessId, 'layaway:booking-created', {
        planId: plan.id,
        bookingId: result.booking?.id,
        itemName: plan.itemName,
      });
    } else if (plan.itemType === 'EVENT') {
      await notify(
        owner.ownerId,
        plan.businessId,
        NotificationType.ORDER_PLACED,
        '🎟️ Billet épargne vendu !',
        `${plan.itemName} — ${netAmount} FCFA libérés sur votre wallet (billet + QR généré).`,
        `/dashboard/events/${plan.itemId}`
      ).catch(() => {});
      emitBusiness(plan.businessId, 'layaway:ticket-created', {
        planId: plan.id,
        eventId: plan.itemId,
        participantId: result.participant?.id,
        ticketRef: result.participant?.ticketRef,
      });
    } else if (plan.itemType === 'TRAINING') {
      await notify(
        owner.ownerId,
        plan.businessId,
        NotificationType.ORDER_PLACED,
        '🎓 Inscription formation épargne !',
        `${plan.itemName} — ${netAmount} FCFA libérés sur votre wallet (client inscrit).`,
        '/dashboard/trainings/manage'
      ).catch(() => {});
      emitBusiness(plan.businessId, 'layaway:enrollment-created', {
        planId: plan.id,
        trainingId: plan.itemId,
        enrollmentId: result.enrollment?.id,
      });
    } else {
      await notify(
        owner.ownerId,
        plan.businessId,
        NotificationType.ORDER_PLACED,
        '💸 Vente Épargne Achat !',
        `${plan.itemName} vendu — ${netAmount} FCFA libérés sur votre wallet (commission 1%).`,
        `/dashboard/orders/${result.order.id}`
      ).catch(() => {});
    }
    emitBusiness(plan.businessId, 'layaway:completed', { planId: plan.id, orderId: result.order.id });
  }

  // 3b. Notification promo — le client sait exactement ce qu'il a économisé.
  if (discountAmount > 0 && coupon) {
    await notify(
      clientId,
      plan.businessId,
      NotificationType.PROMOTION,
      '🎉 Promo appliquée à votre épargne !',
      `${plan.itemName} — ${discountAmount} FCFA remboursés via le code ${coupon.code}. Total payé : ${total} FCFA.`,
      '/dashboard/my-layaway'
    ).catch(() => {});
    emitUser(clientId, 'layaway:discount-applied', {
      planId: plan.id,
      discount: discountAmount,
      code: coupon.code,
    });
  }

  // 4. Notification client — lien vers le vrai objet créé (réservation / billet).
  if (plan.itemType === 'ROOM') {
    await notify(
      clientId,
      plan.businessId,
      NotificationType.PAYMENT_RECEIVED,
      '🏨 Réservation confirmée !',
      `${plan.itemName} réservée du ${checkIn.toLocaleDateString('fr-FR')} au ${checkOut.toLocaleDateString('fr-FR')} — votre épargne a payé le séjour.`,
      '/dashboard/bookings'
    ).catch(() => {});
    emitUser(clientId, 'layaway:booking-confirmed', {
      planId: plan.id,
      bookingId: result.booking?.id,
      itemName: plan.itemName,
    });
  } else if (plan.itemType === 'RENTAL') {
    await notify(
      clientId,
      plan.businessId,
      NotificationType.PAYMENT_RECEIVED,
      '🏕️ Location confirmée !',
      `${plan.itemName} louée du ${checkIn.toLocaleDateString('fr-FR')} au ${checkOut.toLocaleDateString('fr-FR')} — payée par votre épargne.`,
      '/dashboard/my-rentals'
    ).catch(() => {});
    emitUser(clientId, 'layaway:booking-confirmed', {
      planId: plan.id,
      bookingId: result.booking?.id,
      itemName: plan.itemName,
    });
  } else if (plan.itemType === 'EVENT') {
    await notify(
      clientId,
      plan.businessId,
      NotificationType.PAYMENT_RECEIVED,
      '🎟️ Billet confirmé !',
      `${plan.itemName} — billet ${result.participant?.ticketRef} généré avec QR code (retrouvez-le dans Événements).`,
      '/dashboard/my-events'
    ).catch(() => {});
    emitUser(clientId, 'layaway:ticket-confirmed', {
      planId: plan.id,
      participantId: result.participant?.id,
      ticketRef: result.participant?.ticketRef,
    });
  } else if (plan.itemType === 'TRAINING') {
    await notify(
      clientId,
      plan.businessId,
      NotificationType.PAYMENT_RECEIVED,
      '🎓 Inscription confirmée !',
      `${plan.itemName} — vous êtes inscrit, la formation est débloquée (payée par votre épargne).`,
      '/dashboard/my-trainings'
    ).catch(() => {});
    emitUser(clientId, 'layaway:enrollment-confirmed', {
      planId: plan.id,
      trainingId: plan.itemId,
      enrollmentId: result.enrollment?.id,
    });
  }

  trackAnalyticsEvent({
    businessId: plan.businessId,
    userId: clientId,
    type: 'layaway',
    category: 'payment',
    eventName: 'LAYAWAY_COMPLETED',
    properties: { planId, orderId: result.order.id, amount: target, discount: discountAmount, total, fee },
  }).catch(() => {});

  logger.info(
    `Layaway completed: plan ${plan.id} -> order ${result.order.id} (${target} FCFA, promo ${discountAmount}, net ${netAmount})`
  );
  return {
    order: result.order,
    plan: result.updatedPlan,
    booking: result.booking,
    participant: result.participant,
    enrollment: result.enrollment,
    fee,
    netAmount,
    discountAmount,
  };
}
