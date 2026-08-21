import { Prisma, PaymentMethod } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import {
  publishOrderPlaced,
  publishOrderStatusChanged,
  publishNewClient,
  publishPaymentReceived,
  publishPaymentFailed,
  publishInvoiceSent,
  publishInvoicePaid,
  publishSatisfactionSurvey,
  publishBossDiscountAlert,
} from '../events/publishers';
import { getIO } from './socket';
import { logger } from '../lib/logger';
import { trackAnalyticsEvent } from './analyticsService';
import { applyAffiliateOnPaid } from './affiliateService';
import { recordOrderSale } from './cashService';
import { computePrice } from './priceEngine';
import { hasBusinessModule, activeModuleAssignmentsSelect } from '../lib/businessModules';

async function getBusinessByOwner(ownerId: string, businessId?: string | null) {
  const where = businessId
    ? { id: businessId, ownerId, deletedAt: null }
    : { ownerId, deletedAt: null };
  const business = await prisma.business.findFirst({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      modules: true,
      settings: true,
      ...activeModuleAssignmentsSelect,
    },
  });
  if (!business) throw new AppError('Business not found', 404);
  if (!hasBusinessModule(business, 'ORDERS'))
    throw new AppError('Module Commandes non activ\u00e9', 403);
  return business;
}

// Mappe les méthodes de paiement du POS vers l'enum Payment (traçabilité comptable)
function mapToPaymentMethod(method?: string): PaymentMethod {
  switch (String(method || '').toUpperCase()) {
    case 'CASH':
      return 'CASH';
    case 'ESCROW':
      return 'ESCROW';
    case 'BANK_TRANSFER':
      return 'BANK_TRANSFER';
    case 'CREDIT_CARD':
    case 'CARD':
      return 'CREDIT_CARD';
    default:
      // WAVE, TMONEY, MTN, ORANGE, FLOOZ, STRIPE, FEDAPAY... → Mobile Money
      return 'MOBILE_MONEY';
  }
}

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

const orderInclude = {
  items: true,
  buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
  debts: true,
  deliveryZone: { select: { id: true, name: true, fee: true } },
  payments: true,
  // Facture auto (P4) : créée à la validation, passée PAID à la livraison
  invoice: { select: { id: true, invoiceNumber: true, status: true } },
} satisfies Prisma.OrderInclude;

// ===================== ORDERS =====================

export async function listBusinessOrders(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId, filters?.businessId);
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const { status, type, source, search, dateFrom, dateTo } = filters;
  const where: Prisma.OrderWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (type) where.type = type as any;
  if (source) where.source = source as any;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59Z');
  }
  if (search)
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { contactName: { contains: search, mode: 'insensitive' } },
      { contactPhone: { contains: search, mode: 'insensitive' } },
    ];
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);
  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getBusinessOrder(
  ownerId: string,
  orderId: string,
  businessId?: string | null
) {
  const business = await getBusinessByOwner(ownerId, businessId);
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId: business.id },
    include: orderInclude,
  });
  if (!order) throw new AppError('Commande non trouv\u00e9e', 404);
  return order;
}

/**
 * Alerte boss (Chantier 5) : si la remise d'une vente dépasse le seuil configuré
 * (BusinessSettings.discountAlertThreshold, défaut 5000 F), le boss reçoit une
 * alerte socket temps réel + notification in-app signée (qui/quoi/prix/remise).
 * Fire-and-forget : ne bloque JAMAIS la vente.
 */
async function maybeAlertBossOnBigDiscount(ownerId: string, order: any, business: any, data: any) {
  const baseAmount = Number(order.subtotal || 0);
  const finalAmount = Number(order.totalAmount || 0);
  const discountAmount = Math.max(0, baseAmount - finalAmount);
  if (discountAmount <= 0) return;

  const threshold = Number((business.settings as any)?.discountAlertThreshold ?? 5000);
  if (discountAmount < threshold) return;

  // Socket temps réel → téléphone du boss (room user:{id})
  getIO()
    ?.to(`user:${ownerId}`)
    .emit('boss:discount-alert', {
      businessId: business.id,
      businessName: business.name,
      orderId: order.id,
      orderNumber: order.orderNumber,
      baseAmount,
      finalAmount,
      discountAmount,
      performedBy: data.performedBy || ownerId,
      itemLabel: order.items?.[0]?.name || 'Article',
      at: new Date().toISOString(),
    });

  // Nom de l'utilisateur qui a vendu (pour la signature de l'alerte)
  let performedByName = 'Gérant';
  try {
    const user = await prisma.user.findUnique({
      where: { id: data.performedBy || ownerId },
      select: { firstName: true, lastName: true },
    });
    if (user) performedByName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Gérant';
  } catch {}

  publishBossDiscountAlert({
    userId: ownerId,
    businessId: business.id,
    businessName: business.name,
    orderId: order.id,
    orderNumber: order.orderNumber,
    baseAmount,
    finalAmount,
    discountAmount,
    performedBy: data.performedBy || ownerId,
    performedByName,
    itemLabel: order.items?.[0]?.name || 'Article',
  });
}

export async function createOrder(ownerId: string, data: any) {
  const business = await getBusinessByOwner(ownerId, data?.businessId);
  const orderNumber = generateOrderNumber();

  // ── ANTI-TRICHE (Chantier 5.5) : chaque ligne du catalogue est RECALCULÉE côté
  // serveur via le PriceEngine. Le `unitPrice` envoyé par le client est IGNORÉ pour
  // les articles du catalogue (produit, service, plat). Seules les lignes libres
  // (vente libre POS : montant tapé par le gérant, signé par ownerId) conservent
  // le prix saisi — c'est le métier du comptoir.
  const pricedLines: Array<{
    productId?: string | null;
    variantId?: string | null;
    menuItemId?: string | null;
    serviceId?: string | null;
    name: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    variantName?: string | null;
    sku?: string | null;
    notes?: string | null;
    priceEngine: any;
  }> = [];
  let subtotal = 0;
  for (const item of data.items || []) {
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    if (!item.productId && !item.serviceId && !item.menuItemId) {
      // Ligne libre (montant saisi au comptoir) : prix du gérant conservé
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      pricedLines.push({
        productId: item.productId,
        variantId: item.variantId,
        menuItemId: item.menuItemId,
        serviceId: item.serviceId,
        name: item.name,
        quantity,
        unitPrice,
        discountAmount: 0,
        variantName: item.variantName,
        sku: item.sku,
        notes: item.notes,
        priceEngine: null,
      });
      subtotal += unitPrice * quantity;
      continue;
    }
    const itemType = item.productId ? 'PRODUCT' : item.serviceId ? 'SERVICE' : 'MENU_ITEM';
    const itemId = item.productId || item.serviceId || item.menuItemId;
    const price = await computePrice(business.id, {
      itemType,
      itemId,
      quantity,
      clientPrice: Number(item.unitPrice) || 0,
      options: item.options,
    });
    if (!price.available) {
      throw new AppError(`${item.name || 'Article'}: ${price.reason || 'indisponible'}`, 400);
    }
    const surchargeTotal = price.surcharges.reduce((s: number, x: any) => s + x.amount, 0);
    pricedLines.push({
      productId: item.productId,
      variantId: item.variantId,
      menuItemId: item.menuItemId,
      serviceId: item.serviceId,
      name: item.name,
      quantity,
      unitPrice: price.unitPrice,
      discountAmount: price.discountAmount,
      variantName: item.variantName,
      sku: item.sku,
      notes: item.notes,
      priceEngine: price,
    });
    subtotal += price.unitPrice * quantity + surchargeTotal;
  }

  // Remise / taxe / livraison : bornées pour ne jamais produire un total négatif
  const tax = Math.max(0, Number(data.tax || 0));
  const deliveryFee = Math.max(0, Number(data.deliveryFee || 0));
  const discount = Math.min(Math.max(0, Number(data.discount || 0)), subtotal);
  const total = Math.max(0, subtotal + tax + deliveryFee - discount);

  // Execute stock decrement + order creation + debt creation atomically
  const order = await prisma.$transaction(async (tx) => {
    // Decrement product stock — uniquement les produits du business (anti-triche :
    // impossible de décrémenter le stock d'un autre commerce via un id étranger)
    for (const line of pricedLines) {
      if (line.productId) {
        const product = await tx.product.findFirst({
          where: { id: line.productId, businessId: business.id },
          select: { id: true, stock: true, name: true },
        });
        if (!product) {
          throw new AppError(
            `Produit introuvable dans ce commerce: ${line.name || line.productId}`,
            400
          );
        }
        if (product.stock < line.quantity) {
          throw new AppError('Stock insuffisant pour ' + product.name, 400);
        }
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { decrement: line.quantity } },
        });
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        businessId: business.id,
        buyerId: data.buyerId || null,
        type: data.type || 'DELIVERY',
        source: data.source || 'WALK_IN',
        status: data.status || 'PENDING',
        contactName: data.customerName || data.contactName || null,
        contactPhone: data.customerPhone || data.contactPhone || null,
        subtotal,
        taxAmount: tax,
        deliveryFee,
        discountAmount: discount,
        totalAmount: total,
        currency: data.currency || business.settings?.currency || 'FCFA',
        deliveryAddress: data.deliveryAddress,
        deliveryLat: data.deliveryLat,
        deliveryLng: data.deliveryLng,
        deliveryZoneId: data.deliveryZoneId,
        notes: data.notes,
        internalNotes: data.internalNotes,
        items: {
          create: pricedLines.map((line) => {
            const createData: any = {
              productId: line.productId || null,
              variantId: line.variantId || null,
              menuItemId: line.menuItemId || null,
              serviceId: line.serviceId || null,
              name: line.name,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              total: line.unitPrice * line.quantity,
              notes: line.notes || null,
            };
            // NOTE : variantName/sku ne sont PAS des colonnes OrderItem en base —
            // on ne les envoie jamais au create (Prisma rejetterait « Unknown argument »).
            // Le frontend les affiche via la relation variant/variante quand elle existe.
            return createData;
          }),
        },
      },
      include: orderInclude,
    });

    // ── POS (2027) : paiement, record Payment & dette intelligente ──
    // Modes supportés :
    //   - CASH/MOBILE_MONEY/... sans acompte  → payée en totalité (PAID)
    //   - acompte partiel (depositAmount < total) → record Payment + dette pour le reste
    //   - CREDIT                                → dette complète (le client emporte, paie plus tard)
    const paidAmount = Math.min(Number(data.depositAmount || 0), total);
    const isCredit = String(data.paymentMethod || '').toUpperCase() === 'CREDIT';
    const fullyPaid = !isCredit && (paidAmount >= total || !data.depositAmount);

    await tx.order.update({
      where: { id: created.id },
      data: {
        paymentMethod: data.paymentMethod || null,
        paymentStatus: isCredit ? 'UNPAID' : fullyPaid ? 'PAID' : 'PARTIAL',
        paidAt: fullyPaid ? new Date() : null,
      },
    });

    // Enregistrer le paiement réellement reçu (traçabilité comptable) —
    // même les règlements complets (espèces / mobile money) laissent une trace Payment
    if (!isCredit) {
      const paymentAmount = fullyPaid ? total : paidAmount;
      if (paymentAmount > 0) {
        await tx.payment.create({
          data: {
            userId: data.buyerId || ownerId,
            businessId: business.id,
            orderId: created.id,
            amount: paymentAmount,
            currency: data.currency || business.settings?.currency || 'FCFA',
            method: mapToPaymentMethod(data.paymentMethod),
            status: 'COMPLETED',
            isManual: true,
            paidAt: new Date(),
            description: `Paiement ${data.paymentMethod || 'CASH'} — ${orderNumber}`,
          },
        });

        // Caisse du jour (Chantier 4) : l'argent réellement encaissé entre dans
        // la caisse, signé par l'utilisateur qui encaisse — même hors-ligne
        // (l'action rejouée au flush retrace le mouvement sur la nouvelle commande).
        await recordOrderSale(
          ownerId,
          {
            id: created.id,
            number: orderNumber,
            totalAmount: total,
            paymentMethod: data.paymentMethod,
          },
          paymentAmount,
          ownerId,
          tx
        );
      }
    }

    // Dette : crédit complet (CREDIT) ou reste sur acompte partiel
    const remaining = total - paidAmount;
    if (remaining > 0 && (isCredit || data.depositAmount)) {
      await tx.debt.create({
        data: {
          orderId: created.id,
          businessId: business.id,
          buyerId: data.buyerId,
          totalAmount: remaining,
          remainingAmount: remaining,
          dueDate: data.debtDueDate
            ? new Date(data.debtDueDate)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          notes:
            data.debtNotes ||
            (isCredit
              ? 'Vente à crédit (POS)'
              : `Reste après acompte de ${paidAmount} ${data.currency || 'FCFA'}`),
        },
      });
    }

    return tx.order.findUnique({ where: { id: created.id }, include: orderInclude });
  });

  if (!order) throw new AppError('Failed to retrieve created order', 500);

  publishOrderPlaced({
    userId: order.buyerId || '',
    orderId: order.id,
    businessName: business.name,
    amount: order.totalAmount.toString(),
    businessId: order.businessId || business.id,
  });
  publishNewClient({
    userId: ownerId,
    businessId: order.businessId || business.id,
    clientId: order.buyerId || '',
    clientName: order.contactName || 'Client',
  });

  // Boss : alerte grosse remise (Chantier 5) — socket temps réel + notif in-app,
  // si la remise dépasse le seuil configuré par le boss (fire-and-forget, jamais bloquant)
  maybeAlertBossOnBigDiscount(ownerId, order, business, data).catch((e: any) =>
    logger.warn(`Alerte remise non envoyée: ${e?.message || e}`)
  );

  // Analytics — commande placée (fire-and-forget, non-bloquant, jamais de latence sur la réponse)
  trackAnalyticsEvent({
    businessId: order.businessId || business.id,
    userId: order.buyerId || undefined,
    type: 'order',
    category: 'commercial',
    eventName: 'ORDER_PLACED',
    value: Number(order.totalAmount) || 0,
    properties: { orderId: order.id, status: order.status, itemCount: order.items?.length ?? 0 },
  }).catch(() => {});

  return order;
}

/**
 * Facture automatique : créée à la validation de la commande (CONFIRMED/ACCEPTED),
 * marquée PAID à la livraison (DELIVERED). Liée via Invoice.orderId (unique).
 *
 * `prepaid` (ex. commandes Épargne Achat, déjà payées en escrow) : la facture est
 * créée directement PAID avec le montant réglé, et l'événement invoice.paid est publié.
 */
export async function ensureInvoiceForOrder(
  order: any,
  business: any,
  status: string,
  prepaid = false
) {
  try {
    const finalized = prepaid || ['DELIVERED', 'COMPLETED'].includes(status);
    const billable = finalized || ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY'].includes(status);
    if (!billable) return;

    const existing = await prisma.invoice.findUnique({
      where: { orderId: order.id },
      select: { id: true, status: true },
    });

    if (!existing) {
      const invoiceNumber =
        'FAC-' +
        new Date().getFullYear() +
        String(new Date().getMonth() + 1).padStart(2, '0') +
        String(new Date().getDate()).padStart(2, '0') +
        '-' +
        String(Math.floor(Math.random() * 99999)).padStart(5, '0');
      const items = (order.items || []).map((i: any) => ({
        description: i.name || '',
        quantity: i.quantity || 1,
        unitPrice: Number(i.unitPrice) || 0,
        total: Number(i.total) || 0,
      }));

      // Code promo visible sur la facture : extrait de la trace laissée au checkout
      // (internalNotes = `Promo : CODE (-X FCFA)` ou `Promo : <titre promo> (-X FCFA)`).
      // La remise n'est PAS ajoutée comme ligne négative dans invoiceItems : elle est
      // portée par discountAmount + promoCode et affichée dans la ligne dédiée « Remise »
      // (évite un doublon visuel dans le PDF et les vues frontend).
      const promoMatch = String(order.internalNotes || '').match(/Promo\s*:\s*([^\s(-]+)/i);
      const promoCode = promoMatch ? promoMatch[1].toUpperCase() : null;
      const discount = Number(order.discountAmount || 0);

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          businessId: order.businessId || business.id,
          clientId: order.buyerId || null,
          clientName: order.contactName || null,
          clientPhone: order.contactPhone || null,
          title: `Commande ${order.orderNumber || ''}`,
          items: items as any,
          subtotal: Number(order.subtotal || Number(order.totalAmount || 0) + discount || 0),
          taxAmount: Number(order.taxAmount || 0) || undefined,
          discountAmount: discount || undefined,
          promoCode,
          totalAmount: Number(order.totalAmount || 0),
          amountPaid: finalized ? Number(order.totalAmount || 0) : 0,
          currency: order.currency || 'FCFA',
          status: finalized ? 'PAID' : 'SENT',
          paidAt: finalized ? new Date() : undefined,
          // Pas d'échéance sur une facture déjà réglée
          dueDate: finalized ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          invoiceItems: { create: items },
        },
        select: { id: true, invoiceNumber: true },
      });
      if (finalized) {
        publishInvoicePaid(
          order.buyerId || business.ownerId || '',
          order.businessId || business.id,
          {
            invoiceId: invoice.id,
            clientName: order.contactName || 'Client',
            amount: Number(order.totalAmount || 0),
          }
        );
      } else {
        publishInvoiceSent(
          order.buyerId || business.ownerId || '',
          order.businessId || business.id,
          {
            invoiceId: invoice.id,
            clientName: order.contactName || 'Client',
            amount: Number(order.totalAmount || 0),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }
        );
      }
    } else if (finalized) {
      // Éviter un doublon « Facture payée » : une facture déjà PAID (ex. Épargne Achat,
      // réglée dès la création) ne doit pas republier l'événement quand la commande
      // passe simplement à DELIVERED.
      if (existing.status !== 'PAID') {
        await prisma.invoice.update({
          where: { id: existing.id },
          data: { status: 'PAID', amountPaid: Number(order.totalAmount || 0), paidAt: new Date() },
        });
        publishInvoicePaid(
          order.buyerId || business.ownerId || '',
          order.businessId || business.id,
          {
            invoiceId: existing.id,
            clientName: order.contactName || 'Client',
            amount: Number(order.totalAmount || 0),
          }
        );
      }
    }
  } catch (e) {
    // Facture non bloquante : la commande reste valide même si la facture échoue
    console.warn('[orders] ensureInvoiceForOrder:', (e as Error).message);
  }
}

export async function updateOrderStatus(
  ownerId: string,
  orderId: string,
  status: string,
  reason?: string
) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\u00e9e', 404);

  const now = new Date();
  const upd: any = { status: status as any };
  switch (status) {
    case 'ACCEPTED':
      upd.acceptedAt = now;
      break;
    case 'PREPARING':
      upd.preparingAt = now;
      break;
    case 'READY':
      upd.readyAt = now;
      break;
    case 'DELIVERED':
      upd.deliveredAt = now;
      upd.deliveryStatus = 'DELIVERED';
      upd.paymentStatus = 'PAID';
      upd.paidAt = now;
      break;
    case 'COMPLETED':
      upd.completedAt = now;
      break;
    case 'REFUSED':
      upd.refusedAt = now;
      upd.refuseReason = reason || 'Refus\u00e9e';
      break;
    case 'CANCELLED':
      upd.cancelledAt = now;
      upd.cancelReason = reason || 'Annul\u00e9e';
      break;
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: upd,
    include: orderInclude,
  });

  publishOrderStatusChanged({
    userId: order.buyerId || '',
    orderId: order.id,
    status: status.toLowerCase(),
    businessName: business.name,
    businessId: order.businessId || business.id,
  });

  // Analytics — changement de statut (fire-and-forget, non-bloquant)
  trackAnalyticsEvent({
    businessId: order.businessId || business.id,
    userId: order.buyerId || undefined,
    type: 'order',
    category: 'commercial',
    eventName: 'ORDER_STATUS_CHANGED',
    properties: { orderId: order.id, status },
  }).catch(() => {});

  // Facture automatique : créée à la validation, marquée PAID à la livraison
  await ensureInvoiceForOrder(updated, business, status);

  // Enquête de satisfaction : envoyée UNE SEULE FOIS au client quand la commande
  // est livrée. Couvre les commandes classiques ET les commandes Épargne Achat
  // (elles passent toutes par ici pour devenir DELIVERED).
  if (status === 'DELIVERED' && order.buyerId) {
    try {
      // Marquage atomique : un seul envoi même en cas de requêtes parallèles
      const marked = await prisma.order.updateMany({
        where: { id: order.id, satisfactionSurveySentAt: null },
        data: { satisfactionSurveySentAt: new Date() },
      });
      if (marked.count > 0) {
        publishSatisfactionSurvey({
          userId: order.buyerId,
          orderId: order.id,
          businessName: business.name,
        });
      }
    } catch (err) {
      console.warn('[orders] satisfaction survey send failed:', (err as Error).message);
    }
  }

  return updated;
}

export async function updateDeliveryStatus(
  ownerId: string,
  orderId: string,
  deliveryStatus: string,
  notes?: string
) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\u00e9e', 404);
  const data: any = { deliveryStatus: deliveryStatus as any };
  if (notes) data.notes = notes;
  return prisma.order.update({ where: { id: orderId }, data, include: orderInclude });
}

export async function updateOrderPayment(ownerId: string, orderId: string, data: any) {
  const business = await getBusinessByOwner(ownerId);
  const order = await prisma.order.findFirst({ where: { id: orderId, businessId: business.id } });
  if (!order) throw new AppError('Commande non trouv\u00e9e', 404);
  const upd: any = {};
  if (data.paymentMethod) upd.paymentMethod = data.paymentMethod;
  if (data.paymentStatus) upd.paymentStatus = data.paymentStatus;
  // Order model stores payment status and paidAt; amounts/payments are tracked in Payment records
  if (data.paymentStatus === 'PAID') upd.paidAt = new Date();
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: upd,
    include: orderInclude,
  });

  // Boucle affiliation : une commande marquée PAYÉE depuis le dashboard crédite
  // la commission au propriétaire du lien (zéro centime qui échappe au radar).
  if (data.paymentStatus === 'PAID') {
    applyAffiliateOnPaid(orderId).catch(() => {});
    // Caisse du jour (Chantier 4) : l'encaissement (ex. COD réglé au comptoir)
    // entre dans la caisse — idempotent par montant (jamais de doublon).
    recordOrderSale(
      ownerId,
      { id: order.id, number: order.orderNumber, paymentMethod: order.paymentMethod },
      Number(order.totalAmount || 0),
      ownerId
    ).catch(() => null);
  }

  return updated;
}

export async function deleteOrder(ownerId: string, orderId: string) {
  const business = await getBusinessByOwner(ownerId);
  // mark as cancelled instead of deleting
  await prisma.order.update({
    where: { id: orderId, businessId: business.id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
}

export async function getOrderStats(ownerId: string) {
  const business = await getBusinessByOwner(ownerId);
  const where = { businessId: business.id } as any;

  const statuses = [
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ];
  const statusCounts = await Promise.all(
    statuses.map((s) => prisma.order.count({ where: { ...where, status: s as any } }))
  );

  const [totalRevenue, todayRevenue, popularType] = await Promise.all([
    prisma.order.aggregate({
      where: { ...where, status: { in: ['DELIVERED'] as any } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        ...where,
        status: { in: ['DELIVERED'] as any },
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ['type'],
      where,
      _count: true,
      orderBy: { _count: { type: 'desc' } },
      take: 1,
    }),
  ]);

  const r: any = {};
  statuses.forEach((s, i) => (r[s.toLowerCase()] = statusCounts[i]));
  r.total = statusCounts.reduce((a, b) => a + b, 0);
  r.totalRevenue = totalRevenue._sum.totalAmount || 0;
  r.todayRevenue = todayRevenue._sum.totalAmount || 0;
  r.mostPopularType = popularType[0]?.type || null;
  return r;
}

// ===================== DEBTS =====================

export async function listDebts(ownerId: string, filters: any) {
  const business = await getBusinessByOwner(ownerId);
  const { page = 1, limit = 20, status, search } = filters;
  const where: Prisma.DebtWhereInput = { businessId: business.id };
  if (status) where.status = status as any;
  if (search)
    where.OR = [
      { order: { contactName: { contains: search, mode: 'insensitive' } } },
      { order: { contactPhone: { contains: search, mode: 'insensitive' } } },
    ];
  const skip = (page - 1) * limit;
  const [debts, total] = await Promise.all([
    prisma.debt.findMany({
      where,
      include: { order: { include: { items: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.debt.count({ where }),
  ]);
  return { debts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function payDebt(ownerId: string, debtId: string, amount: number) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouv\u00e9e', 404);

  return prisma.$transaction(async (tx) => {
    const current = await tx.debt.findUnique({ where: { id: debtId } });
    if (!current) throw new AppError('Dette non trouv\u00e9e', 404);

    const newPaid = Number(current.amountPaid) + Number(amount);
    const remaining = Number(current.totalAmount) - newPaid;
    const upd: any = { amountPaid: newPaid, remainingAmount: Math.max(0, remaining) };
    if (remaining <= 0) upd.status = 'SETTLED';
    else upd.status = 'PARTIALLY_PAID';

    return tx.debt.update({ where: { id: debtId }, data: upd });
  });
}

export async function settleDebt(ownerId: string, debtId: string) {
  const business = await getBusinessByOwner(ownerId);
  const debt = await prisma.debt.findFirst({ where: { id: debtId, businessId: business.id } });
  if (!debt) throw new AppError('Dette non trouv\u00e9e', 404);

  return prisma.$transaction(async (tx) => {
    const current = await tx.debt.findUnique({ where: { id: debtId } });
    if (!current) throw new AppError('Dette non trouv\u00e9e', 404);
    return tx.debt.update({
      where: { id: debtId },
      data: { status: 'SETTLED', remainingAmount: 0, amountPaid: current.totalAmount },
    });
  });
}
