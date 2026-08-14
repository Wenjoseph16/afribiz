import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { computeCouponDiscount } from './promotions';
import { logger } from '../lib/logger';

/**
 * ============================================
 * PRICE ENGINE — le moteur de prix unique
 * ============================================
 * Toute remise affichée OU facturée passe par ICI, côté serveur.
 * Le client ne peut pas tricher : le unitPrice envoyé par le frontend
 * est IGNORÉ — le moteur recale toujours depuis le catalogue + les mécanismes.
 *
 * Règle de priorité (non cumulable par défaut) :
 *   négocié > flash > groupé > dégressif > promo > coupon
 * Le business peut marquer un mécanisme « cumulable » (config.cumulative)
 * pour qu'il s'empile sur la remise principale.
 */

export interface PriceItemInput {
  itemType: string; // PRODUCT | SERVICE | MENU_ITEM | ROOM | RENTAL | EVENT | TRAINING
  itemId: string;
  quantity?: number;
  /** Prix envoyé par le client (IGNORÉ pour les articles du catalogue) */
  clientPrice?: number;
  /** Coupon saisi (validé séparément par findValidCoupon au checkout) */
  couponCode?: string;
}

export interface PriceBreakdownEntry {
  mechanism: string;
  label: string;
  amount: number; // remise en FCFA (positive)
  cumulative?: boolean;
}

export interface PriceResult {
  itemType: string;
  itemId: string;
  name: string;
  basePrice: number; // prix catalogue
  unitPrice: number; // prix effectif (après remises)
  quantity: number;
  lineTotal: number;
  discountAmount: number;
  currency: string;
  breakdown: PriceBreakdownEntry[];
  available: boolean;
  reason?: string; // si indisponible (stock, promo expirée…)
  badges: string[];
  layawayOfferId?: string | null;
  groupBuyId?: string | null;
  promotional: boolean;
}

interface CatalogItem {
  id: string;
  name: string;
  price: number;
  currency: string;
  stock: number | null;
  categoryId: string | null;
  isPromotional?: boolean;
  promotionalPrice?: number | null;
  promotionEndsAt?: Date | null;
  allowsNegotiation?: boolean;
  images?: string[] | null;
}

/** Charge l'article depuis le bon modèle du catalogue. */
async function loadCatalogItem(
  businessId: string,
  itemType: string,
  itemId: string
): Promise<CatalogItem> {
  const base = { id: itemId, name: '', price: 0, currency: 'FCFA', stock: null, categoryId: null };

  if (itemType === 'PRODUCT') {
    const p = await prisma.product.findFirst({ where: { id: itemId, businessId, deletedAt: null } });
    if (!p) throw new AppError('Produit introuvable', 404);
    return {
      ...base,
      name: p.name,
      price: Number(p.price),
      currency: p.currency || 'FCFA',
      stock: p.stock,
      categoryId: p.categoryId,
      isPromotional: p.isPromotional,
      promotionalPrice: p.promotionalPrice != null ? Number(p.promotionalPrice) : null,
      promotionEndsAt: p.promotionEndsAt,
      allowsNegotiation: (p as any).allowsNegotiation,
      images: p.images,
    };
  }
  if (itemType === 'SERVICE') {
    const s = await prisma.service.findFirst({ where: { id: itemId, businessId } });
    if (!s) throw new AppError('Service introuvable', 404);
    return { ...base, name: s.name, price: Number(s.price || 0), currency: s.currency || 'FCFA', categoryId: (s as any).categoryId ?? null, images: s.images };
  }
  if (itemType === 'ROOM') {
    const r = await prisma.room.findFirst({ where: { id: itemId, businessId } });
    if (!r) throw new AppError('Chambre introuvable', 404);
    return { ...base, name: r.name, price: Number(r.price || 0), currency: r.currency || 'FCFA', categoryId: (r as any).categoryId ?? null, images: r.images };
  }
  if (itemType === 'RENTAL') {
    const r = await prisma.rental.findFirst({ where: { id: itemId, businessId } });
    if (!r) throw new AppError('Location introuvable', 404);
    return { ...base, name: r.name, price: Number(r.price || 0), currency: r.currency || 'FCFA', images: r.images };
  }
  if (itemType === 'EVENT') {
    const e = await prisma.event.findFirst({ where: { id: itemId, businessId } });
    if (!e) throw new AppError('Événement introuvable', 404);
    return { ...base, name: e.title, price: Number(e.price || 0), currency: e.currency || 'FCFA' };
  }
  if (itemType === 'TRAINING') {
    const t = await prisma.training.findFirst({ where: { id: itemId, businessId } });
    if (!t) throw new AppError('Formation introuvable', 404);
    return { ...base, name: t.title, price: Number(t.price || 0), currency: 'FCFA' };
  }
  if (itemType === 'MENU_ITEM') {
    const m = await prisma.menuItem.findFirst({ where: { id: itemId, businessId } });
    if (!m) throw new AppError('Plat introuvable', 404);
    return { ...base, name: m.name, price: Number(m.price || 0), currency: m.currency || 'FCFA' };
  }
  throw new AppError(`Type d'article non supporté: ${itemType}`, 400);
}

/** Achat groupé actif (prix de groupe atteint ou en cours) — TOUS les types d'articles. */
async function findActiveGroupBuy(businessId: string, itemType: string, itemId: string) {
  const now = new Date();
  // Rattachement universel : itemType + itemId (rétrocompat : productId seul).
  const gb = await prisma.groupBuy.findFirst({
    where: {
      businessId,
      isActive: true,
      // ACTIVE (seuil pas encore atteint → badge) ou REACHED (seuil atteint → prix groupe)
      status: { in: ['ACTIVE', 'REACHED'] },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
      AND: [
        {
          OR: [
            { itemType, itemId },
            { productId: itemId }, // rétrocompat (productId seul)
          ],
        },
      ],
    },
  });
  if (!gb) return null;
  const reached = gb.currentCount >= gb.minParticipants;
  return {
    id: gb.id,
    groupPrice: Number(gb.groupPrice),
    minParticipants: gb.minParticipants,
    currentCount: gb.currentCount,
    reached,
  };
}

/** Offre épargne active sur l'article (badge + bouton Épargner). */
async function findLayawayOffer(businessId: string, itemType: string, itemId: string) {
  const offer = await prisma.layawayOffer.findFirst({
    where: { businessId, itemType, itemId, isActive: true },
    select: { id: true, durationDays: true, minInstallment: true },
  });
  return offer;
}

/** Remise promo ciblée (entreprise / catégorie / article) — cumulable seulement si config.cumulative. */
async function findTargetedPromo(
  businessId: string,
  item: CatalogItem,
  basePrice: number
): Promise<{ promotion: any; discount: number } | null> {
  const now = new Date();
  const promos = await prisma.promotion.findMany({
    where: {
      businessId,
      isActive: true,
      deletedAt: null,
      autoApply: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    take: 20,
  });
  if (promos.length === 0) return null;

  let best: { promotion: any; discount: number } | null = null;
  for (const promo of promos) {
    let applies = promo.targetType === 'ALL';
    if (!applies && promo.targetType !== 'ALL' && promo.targetIds.includes(item.id)) {
      applies = true;
    }
    if (!applies) continue;
    if (promo.maxUsageCount && promo.usageCount >= promo.maxUsageCount) continue;
    const discount = computeCouponDiscount(
      { discountType: promo.promotionType, discountValue: promo.discountValue },
      basePrice
    );
    if (discount <= 0) continue;
    if (!best || discount > best.discount) best = { promotion: promo, discount };
  }
  return best;
}

/** Prix dégressifs par quantité (rattachés via CatalogAttachment DISCOUNT_TIER). */
async function findTierDiscount(
  businessId: string,
  itemType: string,
  itemId: string,
  quantity: number
): Promise<{ percent: number; minQuantity: number } | null> {
  const now = new Date();
  const att = await prisma.catalogAttachment.findFirst({
    where: {
      businessId,
      itemType,
      itemId,
      sourceType: 'DISCOUNT_TIER',
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
  });
  if (!att) return null;
  const config = (att.config as any) || {};
  const tiers: Array<{ minQuantity: number; percent: number }> = Array.isArray(config.tiers)
    ? config.tiers
    : [];
  let best: { minQuantity: number; percent: number } | null = null;
  for (const t of tiers) {
    if (quantity >= t.minQuantity && (!best || t.minQuantity > best.minQuantity)) best = t;
  }
  return best ? { percent: best.percent, minQuantity: best.minQuantity } : null;
}

/**
 * Calcule le prix effectif d'une ligne de commande.
 * TOUJOURS côté serveur — les prix envoyés par le client sont ignorés.
 */
export async function computePrice(
  businessId: string,
  input: PriceItemInput
): Promise<PriceResult> {
  const quantity = Math.max(1, Math.floor(input.quantity || 1));
  const item = await loadCatalogItem(businessId, input.itemType, input.itemId);
  const basePrice = item.price;
  const currency = item.currency || 'FCFA';
  const breakdown: PriceBreakdownEntry[] = [];
  const badges: string[] = [];

  let unitPrice = basePrice;
  let appliedMechanism: string | null = null;

  // 0. Négociation (mécanisme le plus fort) — réservée au Chantier 6 (lien éphémère + token).
  // Ici on ne fait que signaler que l'article est négociable ; aucun prix client n'est
  // accepté sans preuve d'accord business. Le client ne peut JAMAIS s'accorder un prix.
  if (item.allowsNegotiation) {
    badges.push('🤝 Négociable');
  }

  // 1. Prix flash (fenêtre de temps)
  if (!appliedMechanism && item.isPromotional && item.promotionalPrice != null && item.promotionalPrice > 0 && item.promotionalPrice < unitPrice) {
    if (!item.promotionEndsAt || item.promotionEndsAt >= new Date()) {
      unitPrice = item.promotionalPrice;
      appliedMechanism = 'FLASH';
      breakdown.push({ mechanism: 'FLASH', label: 'Prix flash', amount: basePrice - unitPrice });
      badges.push('⚡ Flash');
    }
  }

  // 2. Achat groupé (prix de groupe si seuil atteint)
  if (!appliedMechanism) {
    const group = await findActiveGroupBuy(businessId, input.itemType, input.itemId);
    if (group) {
      badges.push(`👥 ${group.currentCount}/${group.minParticipants}`);
      if (group.reached && group.groupPrice < unitPrice) {
        unitPrice = group.groupPrice;
        appliedMechanism = 'GROUP_BUY';
        breakdown.push({ mechanism: 'GROUP_BUY', label: 'Achat groupé', amount: basePrice - unitPrice });
      }
    }
  }

  // 3. Prix dégressifs par quantité
  if (!appliedMechanism) {
    const tier = await findTierDiscount(businessId, input.itemType, input.itemId, quantity);
    if (tier && tier.percent > 0) {
      const discount = Math.round((unitPrice * tier.percent) / 100);
      if (discount > 0) {
        unitPrice -= discount;
        appliedMechanism = 'TIER';
        breakdown.push({
          mechanism: 'TIER',
          label: `−${tier.percent}% dès ${tier.minQuantity} (quantité)`,
          amount: discount,
        });
        badges.push(`🔢 −${tier.percent}% dès ${tier.minQuantity}`);
      }
    }
  }

  // 4. Promotion ciblée
  if (!appliedMechanism) {
    const promo = await findTargetedPromo(businessId, item, unitPrice);
    if (promo) {
      unitPrice -= promo.discount;
      appliedMechanism = 'PROMO';
      breakdown.push({
        mechanism: 'PROMO',
        label: promo.promotion.title || 'Promotion',
        amount: promo.discount,
        cumulative: !!(promo.promotion as any).conditions?.cumulative,
      });
      badges.push(`🔖 ${promo.promotion.title || 'Promo'}`);
    }
  }

  // 5. Coupon (validé séparément au checkout — on ne fait que la remise ici)
  if (input.couponCode && input.couponCode.trim()) {
    try {
      const coupon = await prisma.coupon.findFirst({
        where: { code: { equals: input.couponCode.trim(), mode: 'insensitive' }, businessId },
      });
      if (coupon && coupon.status === 'ACTIVE' && (!coupon.expiresAt || coupon.expiresAt >= new Date())) {
        const discount = computeCouponDiscount(coupon, unitPrice);
        if (discount > 0) {
          unitPrice -= discount;
          breakdown.push({ mechanism: 'COUPON', label: `Coupon ${coupon.code}`, amount: discount, cumulative: true });
          badges.push(`🏷️ ${coupon.code}`);
        }
      }
    } catch (err) {
      logger.warn('PriceEngine coupon check failed', { error: (err as Error).message });
    }
  }

  // Disponibilité : stock suffisant ?
  let available = true;
  let reason: string | undefined;
  if (item.stock !== null && item.stock !== undefined && item.stock < quantity) {
    available = false;
    reason = `Stock insuffisant (${item.stock} disponible)`;
  }

  // Badge épargne
  let layawayOfferId: string | null = null;
  try {
    const lay = await findLayawayOffer(businessId, input.itemType, input.itemId);
    if (lay) {
      layawayOfferId = lay.id;
      badges.push('🔒 Épargner');
    }
  } catch {
    /* non bloquant */
  }

  const discountAmount = Math.max(0, basePrice - unitPrice);
  const lineTotal = unitPrice * quantity;

  return {
    itemType: input.itemType,
    itemId: input.itemId,
    name: item.name,
    basePrice,
    unitPrice,
    quantity,
    lineTotal,
    discountAmount,
    currency,
    breakdown,
    available,
    reason,
    badges,
    layawayOfferId,
    groupBuyId: null,
    promotional: appliedMechanism !== null,
  };
}
