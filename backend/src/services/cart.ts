import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import {
  publishCartItemAdded,
  publishCheckoutInitiated,
  publishCheckoutCompleted,
  publishOrderPlaced,
  publishNewClient,
  publishPaymentReceived,
  publishPaymentFailed,
  publishEscrowCreated,
} from '../events/publishers';
import {
  processMobileMoney,
  processStripePayment,
  processFedaPayPayment,
  saveTransaction,
} from './paymentProcessor';
import {
  findValidCoupon,
  computeCouponDiscount,
  getAutoApplyDiscount,
  logPromotionApplied,
} from './promotions';
import { getEscrowCommissionRate } from './monetizationConfig';
import { syncClientFromOrder, recalculateAllDynamicSegments } from './crm';
import { logActivity } from './customer360';
import { computePrice } from './priceEngine';
import { logger } from '../lib/logger';

function generateOrderNumber(): string {
  const d = new Date();
  return (
    'CMD-' +
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    '-' +
    String(Math.floor(Math.random() * 99999)).padStart(5, '0')
  );
}

/**
 * Checkout intelligent : calcule le frais de livraison CÔTÉ SERVEUR depuis la zone
 * choisie par le client (le client ne peut pas inventer son propre tarif).
 * Livraison gratuite au-delà du seuil configuré par le business (minDeliveryAmount).
 */
async function resolveDeliveryFee(
  businessId: string | undefined,
  deliveryType: string,
  deliveryZoneId: string | undefined,
  subtotal: number
): Promise<{ fee: number; zoneName: string | null }> {
  if (!businessId || deliveryType !== 'DELIVERY' || !deliveryZoneId) {
    return { fee: 0, zoneName: null };
  }
  const zone = await prisma.deliveryZone.findUnique({ where: { id: deliveryZoneId } });
  if (!zone || zone.businessId !== businessId) {
    throw new AppError('Zone de livraison invalide pour ce commerce', 400);
  }
  let fee = Number(zone.fee);
  const settings = await prisma.businessSettings.findUnique({ where: { businessId } });
  if (settings?.minDeliveryAmount && subtotal >= Number(settings.minDeliveryAmount)) {
    fee = 0; // livraison offerte au-delà du seuil
  }
  return { fee, zoneName: zone.name };
}

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          stock: true,
          price: true,
          currency: true,
        },
      },
      service: { select: { id: true, name: true, price: true, currency: true, images: true } },
    },
  },
  coupon: {
    select: { id: true, code: true, discountType: true, discountValue: true, minOrderAmount: true },
  },
} as const;

async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: cartInclude,
    });
  }
  return cart;
}

export async function getCart(userId: string) {
  return getOrCreateCart(userId);
}

export async function addItem(
  userId: string,
  data: {
    productId?: string;
    variantId?: string;
    serviceId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image?: string;
    notes?: string;
  }
) {
  let cart = await getOrCreateCart(userId);
  const total = Number(data.unitPrice) * data.quantity;

  // Check if item already exists (same product/variant/service)
  const existing = cart.items.find((item) => {
    if (data.productId && item.productId === data.productId) return true;
    if (data.variantId && item.variantId === data.variantId) return true;
    if (data.serviceId && item.serviceId === data.serviceId) return true;
    return false;
  });

  if (existing) {
    const newQty = existing.quantity + data.quantity;
    const newTotal = Number(existing.unitPrice) * newQty;
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, total: newTotal, notes: data.notes || existing.notes },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: data.productId || null,
        variantId: data.variantId || null,
        serviceId: data.serviceId || null,
        name: data.name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        total,
        image: data.image || null,
        notes: data.notes || null,
      },
    });
  }

  cart = await getOrCreateCart(userId);

  publishCartItemAdded({
    userId,
    productId: data.productId,
    name: data.name,
    quantity: data.quantity,
  });

  return cart;
}

export async function updateItem(
  userId: string,
  itemId: string,
  data: { quantity: number; notes?: string }
) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Panier non trouvé', 404);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  });
  if (!item) throw new AppError('Article non trouvé dans le panier', 404);

  const total = Number(item.unitPrice) * data.quantity;
  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity: data.quantity, total, notes: data.notes },
  });

  return getOrCreateCart(userId);
}

export async function removeItem(userId: string, itemId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Panier non trouvé', 404);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  });
  if (!item) throw new AppError('Article non trouvé dans le panier', 404);

  await prisma.cartItem.delete({ where: { id: itemId } });

  return getOrCreateCart(userId);
}

export async function clearCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Panier non trouvé', 404);

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  return getOrCreateCart(userId);
}

export async function applyCoupon(userId: string, code: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Panier non trouvé', 404);

  const cartWithItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
  if (cartWithItems.length === 0) throw new AppError('Votre panier est vide', 400);
  const subtotal = cartWithItems.reduce((sum, item) => sum + Number(item.total), 0);

  // Résoudre le business du panier (1er produit ou service) pour valider que le
  // coupon appartient bien à CE commerce (un coupon d'un autre business = refus).
  let businessId: string | undefined;
  for (const item of cartWithItems) {
    if (item.productId) {
      const p = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { businessId: true },
      });
      if (p?.businessId) {
        businessId = p.businessId;
        break;
      }
    }
    if (item.serviceId) {
      const s = await prisma.service.findUnique({
        where: { id: item.serviceId },
        select: { businessId: true },
      });
      if (s) {
        businessId = s.businessId;
        break;
      }
    }
  }
  if (!businessId) throw new AppError('Aucun commerce dans votre panier', 400);

  const coupon = await findValidCoupon(code, businessId, subtotal, userId);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: coupon.id },
  });

  return getOrCreateCart(userId);
}

export async function removeCoupon(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw new AppError('Panier non trouvé', 404);

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: null },
  });

  return getOrCreateCart(userId);
}

export async function guestCheckout(data: {
  email: string;
  contactName: string;
  contactPhone?: string;
  type?: string;
  deliveryAddress?: string;
  deliveryZoneId?: string;
  scheduledAt?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  notes?: string;
  paymentMethod?: string;
  items: Array<{
    productId?: string;
    serviceId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image?: string;
  }>;
}) {
  if (!data.email) throw new AppError('Email requis pour la commande invité', 400);
  if (!data.items || data.items.length === 0) throw new AppError('Votre panier est vide', 400);

  const orderNumber = generateOrderNumber();

  let businessId: string | undefined;
  for (const item of data.items) {
    if (item.productId) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { businessId: true },
      });
      if (product?.businessId) {
        businessId = product.businessId;
        break;
      }
    }
    if (item.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId },
        select: { businessId: true },
      });
      if (service) {
        businessId = service.businessId;
        break;
      }
    }
  }

  // ── PRICE ENGINE : chaque ligne est recalculée côté serveur ──
  // Le client ne peut PAS choisir son prix : le unitPrice envoyé est ignoré
  // pour les articles du catalogue, et le moteur applique flash/groupé/tier/promo.
  // (Les commandes invité viennent toujours du site : tous les items ont un lien catalogue.)
  if (!businessId) throw new AppError('Aucun commerce dans votre panier', 400);

  const pricedLines: Array<{
    productId?: string;
    serviceId?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    image?: string;
    discountAmount: number;
    surchargeTotal?: number;
  }> = [];
  let computedSubtotal = 0;
  for (const item of data.items) {
    const itemType = item.productId ? 'PRODUCT' : 'SERVICE';
    const itemId = item.productId || item.serviceId!;
    const price = await computePrice(businessId, {
      itemType,
      itemId,
      quantity: item.quantity,
      clientPrice: Number(item.unitPrice) || 0,
      options: (item as any).options,
    });
    if (!price.available) {
      throw new AppError(
        `${price.name || item.name || 'Article'}: ${price.reason || 'indisponible'}`,
        400
      );
    }
    const surchargeTotal = price.surcharges.reduce((s, x) => s + x.amount, 0);
    pricedLines.push({
      productId: item.productId,
      serviceId: item.serviceId,
      name: price.name || item.name || 'Article',
      quantity: item.quantity,
      unitPrice: price.unitPrice,
      image: item.image,
      discountAmount: price.discountAmount,
      surchargeTotal,
    });
    computedSubtotal += price.unitPrice * item.quantity + surchargeTotal;
  }
  const subtotal = computedSubtotal;
  // Remise totale = somme des remises moteur par ligne (tracée sur la commande)
  const discountAmount = pricedLines.reduce((s, l) => s + (l.discountAmount || 0), 0);

  // Frais de livraison calculé côté serveur depuis la zone (impossible de tricher)
  const { fee: deliveryFee } = await resolveDeliveryFee(
    businessId,
    data.type || 'DELIVERY',
    data.deliveryZoneId,
    subtotal
  );
  const total = subtotal + deliveryFee;

  const order = await prisma.$transaction(async (tx) => {
    for (const line of pricedLines) {
      if (line.productId) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        buyerId: null,
        businessId,
        type: (data.type as any) || 'DELIVERY',
        source: 'WEB_SITE',
        status: 'PENDING',
        guestEmail: data.email,
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
        subtotal,
        discountAmount: discountAmount || null,
        deliveryFee,
        deliveryZoneId: data.deliveryZoneId || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        totalAmount: total,
        currency: 'FCFA',
        deliveryAddress: data.deliveryAddress || null,
        deliveryLat: data.deliveryLat || null,
        deliveryLng: data.deliveryLng || null,
        notes: data.notes || null,
        items: {
          create: pricedLines.map((line) => ({
            productId: line.productId || null,
            serviceId: line.serviceId || null,
            name: line.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            total: line.unitPrice * line.quantity,
          })),
        },
      },
      include: {
        items: true,
        business: { select: { id: true, name: true } },
      },
    });

    return created;
  });

  // Notifier le business : nouvelle commande invité (temps réel + notification propriétaire)
  if (businessId) {
    try {
      const biz = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, ownerId: true },
      });
      if (biz) {
        publishOrderPlaced({
          userId: biz.ownerId,
          orderId: order.id,
          businessName: biz.name,
          amount: total.toString(),
          businessId: biz.id,
        });
        publishNewClient({
          userId: biz.ownerId,
          businessId: biz.id,
          clientId: '',
          clientName: data.contactName || 'Client',
        });
      }
    } catch {
      // Notification non bloquante
    }
  }

  // Paiement invité : les commandes invité restaient sans traitement de paiement.
  // En mode démonstration (et en test), le paiement mobile money est simulé et
  // réussi, l'escrow est créé — le parcours complet fonctionne sans clé API.
  if (data.paymentMethod && data.paymentMethod !== 'CASH' && businessId) {
    try {
      if (data.paymentMethod === 'ESCROW') {
        const escrowRate = await getEscrowCommissionRate();
        await prisma.escrow.create({
          data: {
            businessId,
            orderId: order.id,
            amount: total,
            currency: 'FCFA',
            status: 'HELD',
            feeRate: escrowRate * 100,
            fee: 0,
            notes: `Escrow invité créé lors du checkout (commande ${orderNumber})`,
          },
        });
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'ESCROW_HELD' },
        });
      } else {
        const paymentResult = await processMobileMoney(
          data.paymentMethod,
          data.contactPhone || '',
          total,
          `Commande ${orderNumber}`
        );
        if (paymentResult) {
          await saveTransaction({
            businessId,
            orderId: order.id,
            amount: total,
            currency: 'FCFA',
            provider: data.paymentMethod,
            providerRef: paymentResult.providerRef,
            status: paymentResult.status,
            fee: paymentResult.fee || 0,
          });
          if (paymentResult.status === 'SUCCESS') {
            await prisma.order.update({
              where: { id: order.id },
              data: { paymentStatus: 'PAID', paidAt: new Date() },
            });
          }
        }
      }
    } catch {
      // Payment failed — order still created, mark as payment pending
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' },
      });
    }
  }

  return order;
}

export async function checkout(
  userId: string,
  data: {
    type: string;
    deliveryAddress?: string;
    deliveryZoneId?: string;
    scheduledAt?: string;
    deliveryLat?: number;
    deliveryLng?: number;
    contactPhone?: string;
    contactName?: string;
    notes?: string;
    paymentMethod: string;
  }
) {
  const cart = await getOrCreateCart(userId);
  if (cart.items.length === 0) throw new AppError('Votre panier est vide', 400);

  const currency = 'FCFA';

  // Résoudre le business du panier AVANT le calcul : la remise dépend du commerce
  // (le coupon doit appartenir au business, les promos auto-apply aussi).
  let businessId: string | undefined;
  for (const item of cart.items) {
    if (item.productId) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { businessId: true },
      });
      if (product?.businessId) {
        businessId = product.businessId;
        break;
      }
    }
    if (item.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId },
        select: { businessId: true },
      });
      if (service) {
        businessId = service.businessId;
        break;
      }
    }
  }

  if (!businessId) throw new AppError('Aucun commerce dans votre panier', 400);

  // ── PRICE ENGINE : chaque ligne du panier est RECALCULÉE côté serveur ──
  // Le prix stocké dans le panier au moment de l'ajout peut être périmé (promo
  // expirée, flash terminé, stock épuisé). Ici on reprend la vérité du catalogue
  // + les mécanismes actifs. Le client ne peut pas tricher sur les prix.
  const pricedLines: Array<{
    productId?: string | null;
    variantId?: string | null;
    serviceId?: string | null;
    name: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    surchargeTotal?: number;
    notes?: string | null;
    priceEngine: any;
  }> = [];
  let subtotal = 0;
  for (const item of cart.items as any[]) {
    if (!item.productId && !item.serviceId) {
      // Ligne libre (montant saisi au POS / service sur-mesure) : prix du panier conservé
      pricedLines.push({
        productId: item.productId,
        variantId: item.variantId,
        serviceId: item.serviceId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice) || 0,
        discountAmount: 0,
        notes: item.notes,
        priceEngine: null,
      });
      subtotal += (Number(item.unitPrice) || 0) * item.quantity;
      continue;
    }
    const itemType = item.productId ? 'PRODUCT' : 'SERVICE';
    const itemId = item.productId || item.serviceId;
    const price = await computePrice(businessId, {
      itemType,
      itemId,
      quantity: item.quantity,
      clientPrice: Number(item.unitPrice) || 0,
      options: (item as any).options,
    });
    if (!price.available) {
      throw new AppError(`${item.name || 'Article'}: ${price.reason || 'indisponible'}`, 400);
    }
    const surchargeTotal = price.surcharges.reduce((s, x) => s + x.amount, 0);
    pricedLines.push({
      productId: item.productId,
      variantId: item.variantId,
      serviceId: item.serviceId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: price.unitPrice,
      discountAmount: price.discountAmount,
      surchargeTotal,
      notes: item.notes,
      priceEngine: price,
    });
    subtotal += price.unitPrice * item.quantity + surchargeTotal;
  }

  // ── Remise totale : remises du PriceEngine (par ligne) + coupon ──
  // ATTENTION aux doubles comptes : le subtotal est DÉJÀ réduit par le moteur
  // (chaque ligne porte son unitPrice recalculé). Le total facturé ne soustrait
  // donc QUE le coupon par-dessus. Le discountAmount global de la commande = somme
  // des remises par ligne + coupon — tracé pour le boss (qui a accordé quoi).
  const engineDiscounts = pricedLines.reduce((s, l) => s + (l.discountAmount || 0), 0);
  let couponDiscount = 0;
  let discountAmount = engineDiscounts;
  let promoNote = '';
  if (cart.coupon) {
    // Re-validation au moment du checkout (le coupon a pu expirer / être épuisé)
    const coupon = await findValidCoupon(cart.coupon.code, businessId, subtotal, userId);
    couponDiscount = computeCouponDiscount(coupon, subtotal);
    discountAmount = engineDiscounts + couponDiscount;
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { useCount: { increment: 1 } },
    });
    await logPromotionApplied(businessId, {
      promotionId: coupon.promotionId,
      couponId: coupon.id,
      description: `Coupon ${coupon.code} appliqué au checkout (${couponDiscount} FCFA)`,
      metadata: { subtotal, discountAmount: couponDiscount },
    });
    promoNote = `Promo : ${coupon.code} (-${couponDiscount} FCFA)`;
  } else if (engineDiscounts > 0) {
    promoNote = `Remises automatiques (${engineDiscounts} FCFA)`;
  }

  // Frais de livraison calculé côté serveur depuis la zone (le client ne fixe pas le tarif)
  const { fee: deliveryFee } = await resolveDeliveryFee(
    businessId,
    data.type,
    data.deliveryZoneId,
    subtotal
  );
  const total = Math.max(0, subtotal - couponDiscount) + deliveryFee;
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // Decrement stock for products (prix recalculé par le PriceEngine)
    for (const line of pricedLines) {
      if (line.productId) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        buyerId: userId,
        businessId,
        type: (data.type as any) || 'DELIVERY',
        source: 'WEB_SITE',
        status: 'PENDING',
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
        subtotal,
        discountAmount,
        deliveryFee,
        deliveryZoneId: data.deliveryZoneId || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        totalAmount: total,
        currency,
        deliveryAddress: data.deliveryAddress || null,
        deliveryLat: data.deliveryLat || null,
        deliveryLng: data.deliveryLng || null,
        notes: data.notes || null,
        internalNotes: promoNote || null,
        items: {
          create: pricedLines.map((line) => ({
            productId: line.productId || null,
            variantId: line.variantId || null,
            serviceId: line.serviceId || null,
            name: line.name,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            total: line.unitPrice * line.quantity,
            notes: line.notes || null,
          })),
        },
      },
      include: {
        items: true,
        business: { select: { id: true, name: true } },
      },
    });

    return created;
  });

  // ── CRM : synchroniser le client (créé ou mis à jour dans le CRM business) ──
  // Un client connecté qui commande doit apparaître dans le CRM avec son total,
  // ses commandes, et être réintégré dans les segments dynamiques.
  if (businessId) {
    try {
      await syncClientFromOrder(businessId, userId, total);
      // Recalcul des segments dynamiques (ex. « VIP », « 30j actif ») en arrière-plan
      await recalculateAllDynamicSegments(businessId).catch(() => {});
      await logActivity(businessId, userId, 'ORDER_PLACED' as any, {
        description: `Commande ${order.orderNumber} passée (${total} FCFA)`,
        metadata: { orderId: order.id, amount: total },
      }).catch(() => {});
    } catch {
      // Le CRM ne bloque jamais la commande
    }
  }

  // Clear the cart after successful checkout
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: null, notes: null },
  });

  publishCheckoutInitiated({
    userId,
    itemCount: cart.items.length,
    totalAmount: total.toString(),
  });

  // Initiate payment if not cash on delivery
  if (data.paymentMethod && data.paymentMethod !== 'CASH' && businessId) {
    try {
      let paymentResult;
      if (data.paymentMethod === 'ESCROW') {
        // Commission escrow plateforme appliquée à la libération (net au wallet)
        const escrowRate = await getEscrowCommissionRate();
        const escrow = await prisma.escrow.create({
          data: {
            businessId,
            orderId: order.id,
            amount: total,
            currency,
            status: 'HELD',
            feeRate: escrowRate * 100,
            fee: 0,
            notes: `Escrow créé lors du checkout (commande ${orderNumber})`,
          },
        });
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'ESCROW_HELD' },
        });
        // Notifier l'acheteur : son paiement est sécurisé dans l'escrow
        publishEscrowCreated({
          userId,
          escrowId: escrow.id,
          amount: total.toString(),
          orderId: order.id,
        });
      } else if (data.paymentMethod === 'STRIPE') {
        paymentResult = await processStripePayment(
          total,
          'usd',
          data.paymentMethod,
          `Commande ${orderNumber}`
        );
      } else if (data.paymentMethod === 'FEDAPAY') {
        paymentResult = await processFedaPayPayment({
          amount: total,
          mode: 'mtn_open',
          description: `Commande ${orderNumber}`,
          customerPhone: data.contactPhone,
          customerName: data.contactName,
        });
      } else {
        // Mobile Money (TMONEY, FLOOZ, WAVE, MOOV_MONEY)
        paymentResult = await processMobileMoney(
          data.paymentMethod,
          data.contactPhone || '',
          total,
          `Commande ${orderNumber}`
        );
      }
      if (paymentResult) {
        const transaction = await saveTransaction({
          businessId,
          userId,
          orderId: order.id,
          amount: total,
          currency,
          provider: data.paymentMethod,
          providerRef: paymentResult.providerRef,
          status: paymentResult.status,
          fee: paymentResult.fee || 0,
        });
        if (paymentResult.status === 'SUCCESS') {
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'PAID', paidAt: new Date() },
          });
          // Notifier l'acheteur : paiement reçu
          publishPaymentReceived({
            userId,
            paymentId: transaction.id,
            businessName: order.business?.name || 'AfriBiz',
            amount: total.toString(),
            businessId,
          });
        } else {
          publishPaymentFailed({
            userId,
            paymentId: transaction.id,
            amount: total.toString(),
            reason: `Paiement ${data.paymentMethod} en attente de confirmation.`,
          });
        }
      }
    } catch {
      // Payment failed — order still created, mark as payment pending
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' },
      });
    }
  }

  publishCheckoutCompleted({
    userId,
    orderId: order.id,
    totalAmount: total.toString(),
  });

  // Notifier le business : nouvelle commande (temps réel via room business:{id} + notification propriétaire)
  if (businessId) {
    try {
      const biz = await prisma.business.findUnique({
        where: { id: businessId },
        select: { id: true, name: true, ownerId: true },
      });
      if (biz) {
        publishOrderPlaced({
          userId: biz.ownerId,
          orderId: order.id,
          businessName: biz.name,
          amount: total.toString(),
          businessId: biz.id,
        });
        publishNewClient({
          userId: biz.ownerId,
          businessId: biz.id,
          clientId: userId,
          clientName: data.contactName || 'Client',
        });
      }
    } catch {
      // Notification non bloquante : la commande reste créée même si la notif échoue
    }
  }

  return order;
}
