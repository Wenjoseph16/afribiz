import { prisma } from '../lib/db';
import { searchIdsByText } from '../lib/fulltext';
import type { MarketplaceSearchParams, MarketplaceResult } from '../types/service';

// ============================================
// HAVERSINE DISTANCE (km)
// ============================================
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// ============================================
// MAIN SEARCH
// ============================================
export async function searchMarketplace(params: MarketplaceSearchParams) {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;
  const perTypeLimit = Math.max(limit, limit * 3);
  const q = params.q?.trim();
  const activeTypes = params.type
    ? params.type.split(',')
    : ['business', 'product', 'service', 'menu', 'event', 'rental', 'developer', 'module'];

  const results: MarketplaceResult[] = [];
  let total = 0;

  // Parse geo params
  const userLat = params.lat ? parseFloat(params.lat as string) : undefined;
  const userLng = params.lng ? parseFloat(params.lng as string) : undefined;
  const proximityKm = params.proximity ? parseInt(params.proximity as string) : undefined;

  interface WhereClause {
    isActive?: boolean;
    deletedAt?: null;
    id?: { in: string[] };
    [key: string]: unknown;
  }

  // ---- BUSINESSES ----
  if (activeTypes.includes('business')) {
    const where: WhereClause = { isActive: true, deletedAt: null };
    if (q) {
      const ids = await searchIdsByText('Business', ['name', 'description', 'city'], q, '"isActive" = true AND "deletedAt" IS NULL');
      where.id = ids.length > 0 ? { in: ids } : { in: [] };
    }
    if (params.category) where.type = params.category;
    if (params.country) where.country = params.country;
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' };
    if (params.verified) where.isVerified = true;
    if (params.premium) where.isPremium = true;
    if (params.minRating) where.rating = { gte: params.minRating };
    // Availability: delivery
    if (params.availability && params.availability.includes('delivery')) {
      where.modules = { has: 'DELIVERIES' };
    }
    if (params.availability && params.availability.includes('booking')) {
      where.modules = { has: 'BOOKINGS' };
    }

    const defaultOrderBy = { rating: 'desc' as const };
    const orderBy =
      params.sort === 'newest'
        ? { createdAt: 'desc' as const }
        : params.sort === 'popular'
          ? { reviewCount: 'desc' as const }
          : defaultOrderBy;

    const [data, count] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy,
        take: perTypeLimit,
        select: {
          id: true, name: true, slug: true, type: true, description: true,
          shortDescription: true, logo: true, coverImage: true, city: true,
          country: true, rating: true, reviewCount: true, isVerified: true,
          isPremium: true, isNew: true, isTopSeller: true, isRecommended: true,
          modules: true, latitude: true, longitude: true,
        },
      }),
      prisma.business.count({ where }),
    ]);

    // Calculate distances if user location provided
    let processedData = data.map((b) => {
      const item: any = { ...b, _type: 'business' as const };
      if (userLat && userLng && b.latitude && b.longitude) {
        const dist = haversineDistance(userLat, userLng, b.latitude, b.longitude);
        item.distance = dist;
        item.distanceFormatted = formatDistance(dist);
      }
      return item;
    });

    // Filter by proximity
    if (proximityKm && userLat && userLng) {
      processedData = processedData.filter((b) => b.distance !== undefined && b.distance <= proximityKm);
    }

    // Sort by distance if user location provided
    if (userLat && userLng) {
      processedData.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    processedData.forEach((b) => results.push(b));
    total += proximityKm && userLat ? processedData.length : count;
  }

  // ---- MODULES ----
  if (activeTypes.includes('module')) {
    const where: WhereClause = { status: 'PUBLISHED' };
    if (q) {
      const ids = await searchIdsByText('DeveloperModule', ['name', 'description', 'fullDescription'], q, "\"status\" = 'PUBLISHED'");
      where.id = ids.length > 0 ? { in: ids } : { in: [] };
    }
    if (params.category) where.category = params.category;
    if (params.minRating) where.rating = { gte: params.minRating };

    const defaultOrderBy = { rating: 'desc' as const };
    const orderBy =
      params.sort === 'newest'
        ? { createdAt: 'desc' as const }
        : params.sort === 'popular'
          ? { totalInstalls: 'desc' as const }
          : defaultOrderBy;

    const [data, count] = await Promise.all([
      prisma.developerModule.findMany({
        where,
        orderBy,
        take: perTypeLimit,
        select: {
          id: true, name: true, slug: true, category: true, description: true,
          logo: true, pricingType: true, price: true, currency: true,
          rating: true, reviewCount: true, totalInstalls: true, version: true,
          developer: { select: { id: true } },
        },
      }),
      prisma.developerModule.count({ where }),
    ]);
    data.forEach((m) => results.push({ ...m, _type: 'module' as const }));
    total += count;
  }

  // ---- DEVELOPERS ----
  if (activeTypes.includes('developer')) {
    const where: WhereClause = { isActive: true };
    if (q) {
      const textIds = await searchIdsByText('DeveloperProfile', ['companyName', 'description', 'city', 'country'], q, '"isActive" = true');
      where.OR = [
        { id: textIds.length > 0 ? { in: textIds } : { in: [] } },
        { skills: { has: q } },
      ];
    }
    if (params.country) where.country = params.country;
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' };
    if (params.minRating) where.rating = { gte: params.minRating };

    const orderBy = params.sort === 'popular' ? { reviewCount: 'desc' as const } : { rating: 'desc' as const };

    const [data, count] = await Promise.all([
      prisma.developerProfile.findMany({
        where,
        orderBy,
        take: perTypeLimit,
        select: {
          id: true, companyName: true, logo: true,
          skills: true, rating: true, reviewCount: true, city: true, country: true,
          verificationStatus: true,
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      }),
      prisma.developerProfile.count({ where }),
    ]);
    data.forEach((d) => results.push({ ...d, _type: 'developer' as const }));
    total += count;
  }

  // ---- SERVICES ----
  if (activeTypes.includes('service')) {
    const where: WhereClause = { isActive: true };
    if (q) {
      const ids = await searchIdsByText('Service', ['name', 'description'], q, '"isActive" = true');
      where.id = ids.length > 0 ? { in: ids } : { in: [] };
    }
    if (params.availability && params.availability.includes('booking')) {
      where.bookingRequired = true;
    }
    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.price = {};
      if (params.priceMin !== undefined) (where.price as Record<string, number>).gte = params.priceMin;
      if (params.priceMax !== undefined) (where.price as Record<string, number>).lte = params.priceMax;
    }

    const [data, count] = await Promise.all([
      prisma.service.findMany({
        where,
        take: perTypeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, description: true, price: true, currency: true,
          duration: true, images: true, bookingRequired: true,
          business: { select: { id: true, name: true, slug: true, logo: true, rating: true, city: true, country: true } },
        },
      }),
      prisma.service.count({ where }),
    ]);
    data.forEach((s) => results.push({ ...s, _type: 'service' as const }));
    total += count;
  }

  // ---- MENU ITEMS ----
  if (activeTypes.includes('menu')) {
    const where: WhereClause = { isActive: true, isAvailable: true };
    if (q) {
      const ids = await searchIdsByText('MenuItem', ['name', 'description'], q, '"isActive" = true AND "isAvailable" = true');
      where.id = ids.length > 0 ? { in: ids } : { in: [] };
    }

    const [data, count] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        take: perTypeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, description: true, price: true, currency: true,
          images: true, isAvailable: true,
          business: { select: { id: true, name: true, slug: true, logo: true, rating: true, city: true, country: true } },
        },
      }),
      prisma.menuItem.count({ where }),
    ]);
    data.forEach((m) => results.push({ ...m, _type: 'menu' as const }));
    total += count;
  }

  // ---- EVENTS ----
  if (activeTypes.includes('event')) {
    const where: WhereClause = { isActive: true };
    if (q) {
      const ids = await searchIdsByText('Event', ['title', 'description'], q, '"isActive" = true');
      where.id = ids.length > 0 ? { in: ids } : { in: [] };
    }

    const [data, count] = await Promise.all([
      prisma.event.findMany({
        where,
        take: perTypeLimit,
        orderBy: { startDate: 'asc' },
        select: {
          id: true, title: true, description: true, startDate: true, endDate: true,
          address: true, price: true, currency: true, images: true, capacity: true,
          business: { select: { id: true, name: true, slug: true, logo: true, rating: true, city: true, country: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);
    data.forEach((e) => results.push({ ...e, _type: 'event' as const }));
    total += count;
  }

  // ---- RENTALS ----
  if (activeTypes.includes('rental')) {
    const where: WhereClause = { isActive: true };
    if (q) {
      const ids = await searchIdsByText('Rental', ['name', 'description'], q, '"isActive" = true');
      where.id = ids.length > 0 ? { in: ids } : { in: [] };
    }

    const [data, count] = await Promise.all([
      prisma.rental.findMany({
        where,
        take: perTypeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, description: true, price: true, currency: true,
          unit: true, images: true, deposit: true, quantity: true,
          business: { select: { id: true, name: true, slug: true, logo: true, rating: true, city: true, country: true } },
        },
      }),
      prisma.rental.count({ where }),
    ]);
    data.forEach((r) => results.push({ ...r, _type: 'rental' as const }));
    total += count;
  }

  // ---- PRODUCTS ----
  if (activeTypes.includes('product')) {
    const where: WhereClause = { isActive: true };
    if (q) {
      const ids = await searchIdsByText('Product', ['name', 'description'], q, '"isActive" = true');
      where.id = ids.length > 0 ? { in: ids } : { in: [] };
    }
    if (params.availability && params.availability.includes('delivery')) {
      where.deliveryFee = { not: null };
    }
    if (params.priceMin !== undefined || params.priceMax !== undefined) {
      where.price = {};
      if (params.priceMin !== undefined) (where.price as Record<string, number>).gte = params.priceMin;
      if (params.priceMax !== undefined) (where.price as Record<string, number>).lte = params.priceMax;
    }

    const [data, count] = await Promise.all([
      prisma.product.findMany({
        where,
        take: perTypeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, description: true, price: true, currency: true,
          images: true, stock: true, rating: true, reviewCount: true, tags: true,
          deliveryFee: true,
          business: { select: { id: true, name: true, slug: true, logo: true, rating: true, city: true, country: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
    data.forEach((p) => results.push({ ...p, _type: 'product' as const }));
    total += count;
  }

  return {
    data: results.slice(skip, skip + limit),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// TRENDING
// ============================================
export async function getTrending() {
  const [topBusinesses, topProducts, topServices, topEvents, topModules] = await Promise.all([
    prisma.business.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { rating: 'desc' },
      take: 6,
      select: {
        id: true, name: true, slug: true, type: true, logo: true,
        city: true, country: true, rating: true, reviewCount: true,
        isVerified: true, isPremium: true, isTopSeller: true, isRecommended: true,
        modules: true, latitude: true, longitude: true,
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' },
      take: 6,
      select: {
        id: true, name: true, slug: true, price: true, currency: true,
        images: true, rating: true,
        business: { select: { id: true, name: true, slug: true, logo: true } },
      },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true, name: true, price: true, currency: true, duration: true,
        business: { select: { id: true, name: true, slug: true, logo: true, rating: true } },
      },
    }),
    prisma.event.findMany({
      where: { isActive: true, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 6,
      select: {
        id: true, title: true, startDate: true, address: true, price: true,
        images: true, capacity: true,
        business: { select: { id: true, name: true, slug: true, logo: true, city: true, country: true } },
      },
    }),
    prisma.developerModule.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { totalInstalls: 'desc' },
      take: 6,
      select: {
        id: true, name: true, slug: true, logo: true, pricingType: true,
        price: true, rating: true, totalInstalls: true,
        developer: { select: { id: true, companyName: true } },
      },
    }),
  ]);

  return { topBusinesses, topProducts, topServices, topEvents, topModules };
}

// ============================================
// MARKETPLACE STATS
// ============================================
export async function getMarketplaceStats() {
  const [businessCount, productCount, serviceCount, eventCount, reviewAgg] = await Promise.all([
    prisma.business.count({ where: { isActive: true, deletedAt: null } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.service.count({ where: { isActive: true } }),
    prisma.event.count({ where: { isActive: true } }),
    prisma.businessReview.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
  ]);

  return {
    businesses: businessCount,
    products: productCount,
    services: serviceCount,
    events: eventCount,
    averageRating: reviewAgg._avg.rating ? Number(reviewAgg._avg.rating.toFixed(1)) : 4.8,
    totalReviews: reviewAgg._count.rating,
  };
}

// ============================================
// BUSINESS SIMILARITY
// ============================================
export async function getSimilarBusinesses(businessId: string, limit: number = 6) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, type: true, city: true, country: true },
  });
  if (!business) return [];

  const similar = await prisma.business.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      id: { not: businessId },
      OR: [
        { type: business.type },
        { city: business.city },
      ],
    },
    orderBy: { rating: 'desc' },
    take: limit,
    select: {
      id: true, name: true, slug: true, type: true, logo: true,
      city: true, country: true, rating: true, reviewCount: true,
      isVerified: true, isPremium: true, isTopSeller: true, isRecommended: true,
      shortDescription: true, modules: true,
    },
  });

  return similar;
}

// ============================================
// ACTIVE ADS FOR MARKETPLACE
// ============================================
export async function getActiveMarketplaceAds(page?: string, position?: string, country?: string) {
  const where: any = {
    isActive: true,
    campaign: { status: 'ACTIVE' },
  };
  if (page) where.placementPage = page.toUpperCase();
  if (position) where.placementPosition = position.toUpperCase();
  if (country) where.targetCountries = { has: country };

  const ads = await prisma.adCreative.findMany({
    where,
    include: {
      campaign: {
        select: {
          id: true, name: true, objective: true, description: true,
          business: { select: { id: true, name: true, slug: true, logo: true } },
        },
      },
    },
    take: 10,
    orderBy: { sortOrder: 'asc' },
  });

  // Shuffle for rotation
  for (let i = ads.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ads[i], ads[j]] = [ads[j], ads[i]];
  }

  return ads;
}
