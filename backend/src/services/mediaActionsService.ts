import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

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
        select: { id: true, name: true, price: true, currency: true, images: true, slug: true, stock: true, businessId: true },
      });
      if (product) commerce = { type: 'PRODUCT', data: product, action: 'add_to_cart', label: 'Ajouter au panier' };
      break;
    }
    case 'SERVICE': {
      const service = await prisma.service.findUnique({
        where: { id: linkTargetId },
        select: { id: true, name: true, price: true, currency: true, images: true, businessId: true },
      });
      if (service) commerce = { type: 'SERVICE', data: service, action: 'book', label: 'Réserver maintenant' };
      break;
    }
    case 'MENU_ITEM': {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: linkTargetId },
        select: { id: true, name: true, price: true, currency: true, images: true, businessId: true },
      });
      if (menuItem) commerce = { type: 'MENU_ITEM', data: menuItem, action: 'order', label: 'Commander' };
      break;
    }
    case 'EVENT': {
      const event = await prisma.event.findUnique({
        where: { id: linkTargetId },
        select: { id: true, title: true, price: true, currency: true, coverImage: true, startDate: true, businessId: true },
      });
      if (event) commerce = { type: 'EVENT', data: event, action: 'purchase', label: 'Acheter un billet' };
      break;
    }
    case 'ROOM': {
      const room = await prisma.room.findUnique({
        where: { id: linkTargetId },
        select: { id: true, name: true, price: true, currency: true, images: true, businessId: true },
      });
      if (room) commerce = { type: 'ROOM', data: room, action: 'book', label: 'Réserver' };
      break;
    }
    case 'RENTAL': {
      const rental = await prisma.rental.findUnique({
        where: { id: linkTargetId },
        select: { id: true, name: true, price: true, currency: true, images: true, businessId: true },
      });
      if (rental) commerce = { type: 'RENTAL', data: rental, action: 'rent', label: 'Louer' };
      break;
    }
    case 'PROMOTION': {
      const prom = await prisma.promotion.findUnique({
        where: { id: linkTargetId },
        select: { id: true, title: true, promotionType: true, discountValue: true, businessId: true },
      });
      if (prom) commerce = { type: 'PROMOTION', data: prom, action: 'view', label: 'Voir l\'offre' };
      break;
    }
    case 'BUSINESS_PAGE': {
      commerce = { type: 'BUSINESS_PAGE', data: { id: business.id, name: business.name, slug: business.slug, logo: business.logo }, action: 'visit', label: 'Voir le commerce' };
      break;
    }
    case 'CUSTOM_LINK': {
      // Vérifier si le lien cible est un module développeur
      const moduleTarget = await prisma.developerModule.findUnique({
        where: { id: linkTargetId },
        select: { id: true, name: true, slug: true, description: true, logo: true, price: true, developerId: true },
      });
      if (moduleTarget) {
        commerce = { type: 'MODULE', data: moduleTarget, action: 'install', label: 'Installer le module' };
      } else {
        commerce = { type: 'CUSTOM_LINK', data: { url: media.linkUrl }, action: 'link', label: 'En savoir plus' };
      }
      break;
    }
  }

  return { media, commerce };
}

export async function addToCartFromMedia(userId: string, productId: string, quantity = 1) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Produit introuvable', 404);

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId },
  });

  const total = Number(product.price) * quantity;

  if (existing) {
    const newQty = existing.quantity + quantity;
    const newTotal = Number(existing.unitPrice) * newQty;
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty, total: newTotal },
    });
  }

  const images = product.images as string[] | null;
  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      name: product.name,
      quantity,
      unitPrice: product.price,
      total,
      image: images?.[0] || null,
    },
  });
}

export async function createOrderFromMedia(userId: string, productId: string, businessId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new AppError('Produit introuvable', 404);

  const orderCount = await prisma.order.count();
  const orderNumber = `ORDER-${Date.now()}-${orderCount + 1}`;

  return prisma.order.create({
    data: {
      buyerId: userId,
      businessId,
      orderNumber,
      status: 'PENDING',
      totalAmount: product.price,
      subtotal: product.price,
      items: {
        create: { productId, name: product.name, quantity: 1, unitPrice: product.price, total: product.price },
      },
    },
  });
}

export async function createBookingFromMedia(userId: string, serviceId: string, businessId: string, startDate?: string) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  const bookingCount = await prisma.booking.count();
  const bookingNumber = `BOOK-${Date.now()}-${bookingCount + 1}`;

  return prisma.booking.create({
    data: {
      clientId: userId,
      businessId,
      serviceId,
      bookingNumber,
      title: service?.name || 'Réservation depuis un média',
      status: 'PENDING',
      price: service?.price || 0,
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
