import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import {
  publishCartItemAdded,
  publishCheckoutInitiated,
  publishCheckoutCompleted,
  publishOrderPlaced,
  publishNewClient,
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
  deliveryAddress?: string;
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

  const subtotal = data.items.reduce(
    (sum: number, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const total = subtotal;
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

  const order = await prisma.$transaction(async (tx) => {
    for (const item of data.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    const created = await tx.order.create({
      data: {
        orderNumber,
        buyerId: null,
        businessId,
        type: 'DELIVERY',
        source: 'WEB_SITE',
        status: 'PENDING',
        guestEmail: data.email,
        contactName: data.contactName || null,
        contactPhone: data.contactPhone || null,
        subtotal,
        totalAmount: total,
        currency: 'FCFA',
        deliveryAddress: data.deliveryAddress || null,
        deliveryLat: data.deliveryLat || null,
        deliveryLng: data.deliveryLng || null,
        notes: data.notes || null,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            serviceId: item.serviceId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.unitPrice * item.quantity,
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

  return order;
}

export async function checkout(
  userId: string,
  data: {
    type: string;
    deliveryAddress?: string;
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

  const subtotal = cart.items.reduce((sum: number, item: any) => sum + Number(item.total), 0);
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

  // ── Calcul RÉEL de la remise (coupon validé OU promo auto-appliquée) ──
  let discountAmount = 0;
  let promoNote = '';
  if (cart.coupon) {
    if (!businessId) throw new AppError('Aucun commerce dans votre panier', 400);
    // Re-validation au moment du checkout (le coupon a pu expirer / être épuisé)
    const coupon = await findValidCoupon(cart.coupon.code, businessId, subtotal, userId);
    discountAmount = computeCouponDiscount(coupon, subtotal);
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { useCount: { increment: 1 } },
    });
    await logPromotionApplied(businessId, {
      promotionId: coupon.promotionId,
      couponId: coupon.id,
      description: `Coupon ${coupon.code} appliqué au checkout (${discountAmount} FCFA)`,
      metadata: { subtotal, discountAmount },
    });
    promoNote = `Promo : ${coupon.code} (-${discountAmount} FCFA)`;
  } else if (businessId) {
    // Promotion créée par le business avec autoApply → elle s'applique réellement
    const auto = await getAutoApplyDiscount(businessId, cart.items, subtotal);
    if (auto) {
      discountAmount = auto.discount;
      await prisma.promotion.update({
        where: { id: auto.promotion.id },
        data: { usageCount: { increment: 1 } },
      });
      await logPromotionApplied(businessId, {
        promotionId: auto.promotion.id,
        description: `Promo auto « ${auto.promotion.title} » appliquée au checkout (${discountAmount} FCFA)`,
        metadata: { subtotal, discountAmount },
      });
      promoNote = `Promo : ${auto.promotion.title} (-${discountAmount} FCFA)`;
    }
  }

  const total = Math.max(0, subtotal - discountAmount);
  const orderNumber = generateOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    // Decrement stock for products
    for (const item of cart.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
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
        totalAmount: total,
        currency,
        deliveryAddress: data.deliveryAddress || null,
        deliveryLat: data.deliveryLat || null,
        deliveryLng: data.deliveryLng || null,
        notes: data.notes || null,
        internalNotes: promoNote || null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            serviceId: item.serviceId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: Number(item.total),
            notes: item.notes,
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
        await prisma.escrow.create({
          data: {
            businessId,
            orderId: order.id,
            amount: total,
            currency,
            status: 'HELD',
            feeRate: 0,
            fee: 0,
            notes: `Escrow créé lors du checkout (commande ${orderNumber})`,
          },
        });
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'ESCROW_HELD' },
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
        await saveTransaction({
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
