import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { publishOrderPlaced, publishNewClient } from '../events/publishers';
import { computePrice } from './priceEngine';

export async function getMediaCommerceData(mediaType: 'STORY' | 'SHORT', mediaId: string) {
  let media: any;
  if (mediaType === 'STORY') {
    media = await prisma.story.findUnique({
      where: { id: mediaId },
      include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
    });
  } else {
    media = await prisma.short.findUnique({
      where: { id: mediaId },
      include: { business: { select: { id: true, name: true, slug: true, logo: true } } },
    });
  }
  if (!media) throw new AppError('Média introuvable', 404);

  const { linkTargetType, linkTargetId, business } = media;
  if (!linkTargetType || !linkTargetId) {
    return { media, commerce: null };
  }

  let commerce = null;
  switch (linkTargetType) {
    case 'PRODUCT': {
      const product = await prisma.product.findUnique({
        where: { id: linkTargetId },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          images: true,
          slug: true,
          stock: true,
          businessId: true,
        },
      });
      if (product) {
        const priced = await computePrice(business.id, {
          itemType: 'PRODUCT',
          itemId: product.id,
          quantity: 1,
        }).catch(() => null);
        commerce = {
          type: 'PRODUCT',
          data: { ...product, price: priced ? priced.unitPrice : product.price },
          action: 'add_to_cart',
          label: 'Ajouter au panier',
        };
      }
      break;
    }
    case 'SERVICE': {
      const service = await prisma.service.findUnique({
        where: { id: linkTargetId },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          images: true,
          businessId: true,
        },
      });
      if (service) {
        const priced = await computePrice(business.id, {
          itemType: 'SERVICE',
          itemId: service.id,
          quantity: 1,
        }).catch(() => null);
        commerce = {
          type: 'SERVICE',
          data: { ...service, price: priced ? priced.unitPrice : service.price },
          action: 'book',
          label: 'Réserver maintenant',
        };
      }
      break;
    }
    case 'MENU_ITEM': {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: linkTargetId },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          images: true,
          businessId: true,
        },
      });
      if (menuItem) {
        const priced = await computePrice(business.id, {
          itemType: 'MENU_ITEM',
          itemId: menuItem.id,
          quantity: 1,
        }).catch(() => null);
        commerce = {
          type: 'MENU_ITEM',
          data: { ...menuItem, price: priced ? priced.unitPrice : menuItem.price },
          action: 'order',
          label: 'Commander',
        };
      }
      break;
    }
    case 'EVENT': {
      const event = await prisma.event.findUnique({
        where: { id: linkTargetId },
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          coverImage: true,
          startDate: true,
          businessId: true,
        },
      });
      if (event) {
        const priced = await computePrice(business.id, {
          itemType: 'EVENT',
          itemId: event.id,
          quantity: 1,
        }).catch(() => null);
        commerce = {
          type: 'EVENT',
          data: { ...event, price: priced ? priced.unitPrice : event.price },
          action: 'purchase',
          label: 'Acheter un billet',
        };
      }
      break;
    }
    case 'ROOM': {
      const room = await prisma.room.findUnique({
        where: { id: linkTargetId },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          images: true,
          businessId: true,
        },
      });
      if (room) {
        const priced = await computePrice(business.id, {
          itemType: 'ROOM',
          itemId: room.id,
          quantity: 1,
        }).catch(() => null);
        commerce = {
          type: 'ROOM',
          data: { ...room, price: priced ? priced.unitPrice : room.price },
          action: 'book',
          label: 'Réserver',
        };
      }
      break;
    }
    case 'RENTAL': {
      const rental = await prisma.rental.findUnique({
        where: { id: linkTargetId },
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          images: true,
          businessId: true,
        },
      });
      if (rental) {
        const priced = await computePrice(business.id, {
          itemType: 'RENTAL',
          itemId: rental.id,
          quantity: 1,
        }).catch(() => null);
        commerce = {
          type: 'RENTAL',
          data: { ...rental, price: priced ? priced.unitPrice : rental.price },
          action: 'rent',
          label: 'Louer',
        };
      }
      break;
    }
    case 'PROMOTION': {
      const prom = await prisma.promotion.findUnique({
        where: { id: linkTargetId },
        select: {
          id: true,
          title: true,
          promotionType: true,
          discountValue: true,
          businessId: true,
        },
      });
      if (prom) commerce = { type: 'PROMOTION', data: prom, action: 'view', label: "Voir l'offre" };
      break;
    }
    case 'BUSINESS_PAGE': {
      commerce = {
        type: 'BUSINESS_PAGE',
        data: { id: business.id, name: business.name, slug: business.slug, logo: business.logo },
        action: 'visit',
        label: 'Voir le commerce',
      };
      break;
    }
    case 'CUSTOM_LINK': {
      // Vérifier si le lien cible est un module développeur
      const moduleTarget = await prisma.developerModule.findUnique({
        where: { id: linkTargetId },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          price: true,
          developerId: true,
        },
      });
      if (moduleTarget) {
        commerce = {
          type: 'MODULE',
          data: moduleTarget,
          action: 'install',
          label: 'Installer le module',
        };
      } else {
        commerce = {
          type: 'CUSTOM_LINK',
          data: { url: media.linkUrl },
          action: 'link',
          label: 'En savoir plus',
        };
      }
      break;
    }
  }

  return { media, commerce };
}

export async function addToCartFromMedia(userId: string, productId: string, quantity = 1) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Produit introuvable', 404);
  if (!product.businessId) throw new AppError('Produit sans commerce', 400);

  // Prix moteur (jamais le prix client) : promo, flash, tiers appliqués
  const priced = await computePrice(product.businessId, {
    itemType: 'PRODUCT',
    itemId: product.id,
    quantity,
  });
  const unitPrice = priced.unitPrice;

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  const total = unitPrice * quantity;

  if (existing) {
    const newQty = existing.quantity + quantity;
    const newTotal = unitPrice * newQty;
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, unitPrice, total: newTotal },
    });
  }

  const images = product.images as string[] | null;
  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      name: product.name,
      quantity,
      unitPrice,
      total,
      image: images?.[0] || null,
    },
  });
}

export async function createOrderFromMedia(
  userId: string,
  productId: string,
  businessId: string,
  quantity = 1,
  paymentMethod?: string
) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Produit introuvable', 404);
  if (!product.businessId) throw new AppError('Produit sans commerce', 400);

  if (product.stock !== null && product.stock < quantity) {
    throw new AppError('Stock insuffisant', 409);
  }

  // Prix moteur (jamais le prix client) : promo, flash, tiers appliqués
  const priced = await computePrice(product.businessId, {
    itemType: 'PRODUCT',
    itemId: product.id,
    quantity,
  });
  const unitPrice = priced.unitPrice;
  const total = unitPrice * quantity;
  const orderCount = await prisma.order.count();
  const orderNumber = `ORDER-${Date.now()}-${orderCount + 1}`;

  let order: any;
  await prisma.$transaction(async (tx) => {
    order = await tx.order.create({
      data: {
        buyerId: userId,
        businessId,
        orderNumber,
        status: 'PENDING',
        totalAmount: total,
        subtotal: total,
        paymentMethod: paymentMethod || null,
        items: {
          create: {
            productId,
            name: product.name,
            quantity,
            unitPrice: product.price,
            total,
          },
        },
      },
    });
    if (product.stock !== null) {
      await tx.product.update({
        where: { id: productId },
        data: { stock: product.stock - quantity },
      });
    }
    return order;
  });

  if (order) {
    // Notifier le business : nouvelle commande depuis une vidéo (temps réel + notification propriétaire)
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
        const client = await prisma.user.findUnique({
          where: { id: userId },
          select: { firstName: true, lastName: true },
        });
        publishNewClient({
          userId: biz.ownerId,
          businessId: biz.id,
          clientId: userId,
          clientName: [client?.firstName, client?.lastName].filter(Boolean).join(' ') || 'Client',
        });
      }
    } catch {
      // Notification non bloquante : la commande reste créée même si la notif échoue
    }
  }

  return order;
}

export async function createBookingFromMedia(
  userId: string,
  serviceId: string,
  businessId: string,
  startDate?: string
) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new AppError('Service introuvable', 404);
  const bookingCount = await prisma.booking.count();
  const bookingNumber = `BOOK-${Date.now()}-${bookingCount + 1}`;

  // Prix moteur (jamais le prix client) : promo, flash, tiers appliqués
  const priced = await computePrice(service.businessId, {
    itemType: 'SERVICE',
    itemId: service.id,
    quantity: 1,
  }).catch(() => null);
  const price = priced ? priced.unitPrice : Number(service.price || 0);

  return prisma.booking.create({
    data: {
      clientId: userId,
      businessId,
      serviceId,
      bookingNumber,
      title: service.name,
      status: 'PENDING',
      price,
      startDate: startDate ? new Date(startDate) : new Date(Date.now() + 86400000),
    },
  });
}

export async function installModuleFromMedia(userId: string, moduleId: string, businessId: string) {
  const moduleItem = await prisma.developerModule.findUnique({ where: { id: moduleId } });
  if (!moduleItem) throw new AppError('Module introuvable', 404);

  const existing = await prisma.developerModuleInstallation.findFirst({
    where: { moduleId, businessId },
  });
  if (existing) throw new AppError('Module déjà installé', 409);

  return prisma.developerModuleInstallation.create({
    data: { moduleId, businessId },
  });
}
