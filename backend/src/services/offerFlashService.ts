import { prisma } from '../lib/db';

export async function getActiveOffers(params?: {
  page?: number;
  limit?: number;
  businessId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  featured?: boolean;
}) {
  const { page = 1, limit = 20, businessId, latitude, longitude, radiusKm, featured } = params || {};
  const now = new Date();
  const where: any = {
    isActive: true,
    startAt: { lte: now },
    endAt: { gte: now },
  };
  if (businessId) where.businessId = businessId;
  if (featured) where.isFeatured = true;

  const hasGeo = !!(latitude && longitude && radiusKm);

  const allItems = await prisma.offerFlash.findMany({
    where,
    include: {
      business: {
        select: { id: true, name: true, slug: true, logo: true, type: true, city: true, latitude: true, longitude: true, rating: true },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { endAt: 'asc' }],
  });

  // Filter by distance if geo provided
  const filtered = hasGeo
    ? allItems.filter((item: any) => {
        const bLat = item.latitude ?? item.business?.latitude;
        const bLng = item.longitude ?? item.business?.longitude;
        if (!bLat || !bLng) return false;
        return haversineDistance(latitude!, longitude!, bLat, bLng) <= radiusKm!;
      })
    : allItems;

  const total = filtered.length;
  const skip = (page - 1) * limit;
  const items = filtered.slice(skip, skip + limit);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getOfferById(offerId: string) {
  return prisma.offerFlash.findFirst({
    where: { id: offerId },
    include: {
      business: {
        select: { id: true, name: true, slug: true, logo: true, type: true, city: true, latitude: true, longitude: true, rating: true, phone: true, description: true },
      },
    },
  });
}

export async function createOffer(data: {
  businessId: string;
  title: string;
  description?: string;
  image?: string;
  discountPercent: number;
  originalPrice?: number;
  flashPrice?: number;
  currency?: string;
  quantity: number;
  maxPerCustomer?: number;
  terms?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  startAt: string;
  endAt: string;
}) {
  const offer = await prisma.offerFlash.create({
    data: {
      businessId: data.businessId,
      title: data.title,
      description: data.description,
      image: data.image,
      discountPercent: data.discountPercent,
      originalPrice: data.originalPrice ? data.originalPrice : null,
      flashPrice: data.flashPrice ? data.flashPrice : null,
      currency: data.currency || 'FCFA',
      quantity: data.quantity,
      maxPerCustomer: data.maxPerCustomer || 1,
      terms: data.terms,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      radiusKm: data.radiusKm || 5,
      startAt: new Date(data.startAt),
      endAt: new Date(data.endAt),
    },
  });

  // Add to feed
  try {
    await prisma.feedItem.create({
      data: {
        businessId: data.businessId,
        type: 'OFFER_FLASH' as any,
        referenceId: offer.id,
        mediaUrl: data.image,
        title: data.title,
        description: data.description,
        linkUrl: null,
        expiresAt: new Date(data.endAt),
        isActive: true,
      },
    });
  } catch (e) {
    // feed item is optional
  }

  return offer;
}

export async function updateOffer(offerId: string, businessId: string, data: any) {
  const existing = await prisma.offerFlash.findFirst({ where: { id: offerId, businessId } });
  if (!existing) return null;

  const updateData: any = { ...data };
  if (data.startAt) updateData.startAt = new Date(data.startAt);
  if (data.endAt) updateData.endAt = new Date(data.endAt);
  if (data.flashPrice !== undefined) updateData.flashPrice = data.flashPrice;
  if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice;

  return prisma.offerFlash.update({
    where: { id: offerId },
    data: updateData,
  });
}

export async function deleteOffer(offerId: string, businessId: string) {
  const existing = await prisma.offerFlash.findFirst({ where: { id: offerId, businessId } });
  if (!existing) return false;
  await prisma.offerFlash.delete({ where: { id: offerId } });
  return true;
}

export async function claimOffer(offerId: string) {
  const offer = await prisma.offerFlash.findFirst({
    where: { id: offerId, isActive: true, endAt: { gte: new Date() } },
  });
  if (!offer) return null;
  if (offer.soldCount >= offer.quantity) return null;

  return prisma.offerFlash.update({
    where: { id: offerId },
    data: { soldCount: { increment: 1 } },
  });
}

export async function getNearbyBusinesses(params: {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  type?: string;
  page?: number;
  limit?: number;
}) {
  const { latitude, longitude, radiusKm = 10, type, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;
  const where: any = { isActive: true, latitude: { not: null }, longitude: { not: null } };
  if (type) where.type = type;

  const allBusinesses = await prisma.business.findMany({
    where,
    select: {
      id: true, name: true, slug: true, logo: true, type: true, city: true,
      latitude: true, longitude: true, rating: true, reviewCount: true, shortDescription: true,
    },
  });

  // Filter by distance
  const withDistance = allBusinesses
    .map((b: any) => ({
      ...b,
      distance: haversineDistance(latitude, longitude, b.latitude!, b.longitude!),
    }))
    .filter(b => b.distance <= radiusKm)
    .sort((a: any, b: any) => a.distance - b.distance);

  const total = withDistance.length;
  const items = withDistance.slice(skip, skip + limit);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

