import { prisma } from '../lib/db';
import { searchIdsByText } from '../lib/fulltext';
import type { MarketplaceSearchParams, MarketplaceResult } from '../types/service';

// ============================================
// HELPERS
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

type WhereClause = Record<string, unknown>;

interface TextSearchConfig {
  model:
    | 'Business'
    | 'DeveloperModule'
    | 'DeveloperProfile'
    | 'Service'
    | 'MenuItem'
    | 'Event'
    | 'Rental'
    | 'Product';
  fields: string[];
  baseFilter: string;
}

async function applyTextSearch(
  where: WhereClause,
  q: string | undefined,
  phrases: string[],
  excluded: string[],
  config: TextSearchConfig
): Promise<WhereClause> {
  if (q) {
    const ids = await searchIdsByText(config.model, config.fields, q, config.baseFilter);
    where.id = ids.length > 0 ? { in: ids } : { in: [] };
  }

  if (phrases.length > 0) {
    const phraseWheres: WhereClause[] = [];
    for (const phrase of phrases) {
      const ids = await searchIdsByText(config.model, config.fields, phrase, config.baseFilter);
      if (ids.length > 0) phraseWheres.push({ id: { in: ids } });
    }
    if (phraseWheres.length > 0) where.AND = phraseWheres;
  }

  if (excluded.length > 0) {
    const excludeWheres: WhereClause[] = [];
    for (const term of excluded) {
      const ids = await searchIdsByText(config.model, config.fields, term, config.baseFilter);
      if (ids.length > 0) excludeWheres.push({ id: { in: ids } });
    }
    if (excludeWheres.length > 0) where.NOT = { OR: excludeWheres };
  }

  return where;
}

function buildPriceFilter(
  priceMin: number | undefined,
  priceMax: number | undefined
): Record<string, number> | undefined {
  if (priceMin === undefined && priceMax === undefined) return undefined;
  const pf: Record<string, number> = {};
  if (priceMin !== undefined) pf.gte = priceMin;
  if (priceMax !== undefined) pf.lte = priceMax;
  return pf;
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
  const phrases = params.phrases || [];
  const excluded = params.excluded || [];
  const activeTypes = params.type
    ? params.type.split(',')
    : ['business', 'product', 'service', 'menu', 'event', 'rental', 'developer', 'module'];

  const typeKeyMap: Record<string, string> = {
    business: 'b',
    product: 'p',
    service: 's',
    menu: 'm',
    event: 'e',
    rental: 'r',
    developer: 'd',
    module: 'o',
  };
  const typeKeyReverse: Record<string, string> = {};
  for (const [k, v] of Object.entries(typeKeyMap)) typeKeyReverse[v] = k;

  const typeOffsets: Record<string, number> = {};
  if (params.cursor) {
    params.cursor.split(',').forEach((pair) => {
      const [key, val] = pair.split(':');
      const t = typeKeyReverse[key];
      if (t && activeTypes.includes(t)) typeOffsets[t] = parseInt(val) || 0;
    });
  }

  const results: MarketplaceResult[] = [];
  let total = 0;
  const currentFetched: Record<string, number> = {};

  const userLat = params.lat ? parseFloat(params.lat as string) : undefined;
  const userLng = params.lng ? parseFloat(params.lng as string) : undefined;
  const proximityKm = params.proximity ? parseInt(params.proximity as string) : undefined;

  // ---- BUSINESSES ----
  if (activeTypes.includes('business')) {
    const where = await applyTextSearch({ isActive: true, deletedAt: null }, q, phrases, excluded, {
      model: 'Business',
      fields: ['name', 'description', 'city'],
      baseFilter: '"isActive" = true AND "deletedAt" IS NULL',
    });
    if (params.category) where.type = params.category;
    if (params.country) where.country = params.country;
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' };
    if (params.verified) where.isVerified = true;
    if (params.premium) where.isPremium = true;
    if (params.minRating) where.rating = { gte: params.minRating };
    if (params.availability?.includes('delivery')) where.modules = { has: 'DELIVERIES' };
    if (params.availability?.includes('booking')) where.modules = { has: 'BOOKINGS' };

    const orderBy =
      params.sort === 'newest'
        ? { createdAt: 'desc' as const }
        : params.sort === 'popular'
          ? { reviewCount: 'desc' as const }
          : { rating: 'desc' as const };

    const [data, count] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy,
        skip: typeOffsets.business || 0,
        take: perTypeLimit,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          description: true,
          shortDescription: true,
          logo: true,
          coverImage: true,
          city: true,
          country: true,
          rating: true,
          reviewCount: true,
          isVerified: true,
          isPremium: true,
          isNew: true,
          isTopSeller: true,
          isRecommended: true,
          modules: true,
          latitude: true,
          longitude: true,
        },
      }),
      prisma.business.count({ where }),
    ]);

    let processedData = data.map((b) => {
      const item: any = { ...b, _type: 'business' as const };
      if (userLat && userLng && b.latitude && b.longitude) {
        const dist = haversineDistance(userLat, userLng, b.latitude, b.longitude);
        item.distance = dist;
        item.distanceFormatted = formatDistance(dist);
      }
      return item;
    });

    if (proximityKm && userLat && userLng) {
      processedData = processedData.filter(
        (b) => b.distance !== undefined && b.distance <= proximityKm
      );
    }
    if (userLat && userLng) {
      processedData.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }
    processedData.forEach((b) => results.push(b));
    currentFetched.business = (currentFetched.business || 0) + processedData.length;
    total += count;
  }

  // ---- MODULES ----
  if (activeTypes.includes('module')) {
    const where = await applyTextSearch({ status: 'PUBLISHED' }, q, phrases, excluded, {
      model: 'DeveloperModule',
      fields: ['name', 'description', 'fullDescription'],
      baseFilter: '"status" = \'PUBLISHED\'',
    });
    if (params.category) where.category = params.category;
    if (params.minRating) where.rating = { gte: params.minRating };

    const orderBy =
      params.sort === 'newest'
        ? { createdAt: 'desc' as const }
        : params.sort === 'popular'
          ? { totalInstalls: 'desc' as const }
          : { rating: 'desc' as const };

    const [data, count] = await Promise.all([
      prisma.developerModule.findMany({
        where,
        orderBy,
        skip: typeOffsets.module || 0,
        take: perTypeLimit,
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          description: true,
          logo: true,
          pricingType: true,
          price: true,
          currency: true,
          rating: true,
          reviewCount: true,
          totalInstalls: true,
          version: true,
          developer: { select: { id: true } },
        },
      }),
      prisma.developerModule.count({ where }),
    ]);
    data.forEach((m) => results.push({ ...m, _type: 'module' as const }));
    currentFetched.module = (currentFetched.module || 0) + data.length;
    total += count;
  }

  // ---- DEVELOPERS ----
  if (activeTypes.includes('developer')) {
    const where: WhereClause = { isActive: true };
    if (q) {
      const textIds = await searchIdsByText(
        'DeveloperProfile',
        ['companyName', 'description', 'city', 'country'],
        q,
        '"isActive" = true'
      );
      where.OR = [
        { id: textIds.length > 0 ? { in: textIds } : { in: [] } },
        { skills: { has: q } },
      ];
    }
    if (phrases.length > 0) {
      const phraseWheres: WhereClause[] = [];
      for (const phrase of phrases) {
        const ids = await searchIdsByText(
          'DeveloperProfile',
          ['companyName', 'description', 'city', 'country'],
          phrase,
          '"isActive" = true'
        );
        if (ids.length > 0) phraseWheres.push({ id: { in: ids } });
      }
      if (phraseWheres.length > 0)
        where.AND = where.AND ? [...(where.AND as WhereClause[]), ...phraseWheres] : phraseWheres;
    }
    if (excluded.length > 0) {
      const excludeWheres: WhereClause[] = [];
      for (const term of excluded) {
        const ids = await searchIdsByText(
          'DeveloperProfile',
          ['companyName', 'description', 'city', 'country'],
          term,
          '"isActive" = true'
        );
        if (ids.length > 0) excludeWheres.push({ id: { in: ids } });
      }
      if (excludeWheres.length > 0) where.NOT = { OR: excludeWheres };
    }
    if (params.country) where.country = params.country;
    if (params.city) where.city = { contains: params.city, mode: 'insensitive' };
    if (params.minRating) where.rating = { gte: params.minRating };

    const orderBy =
      params.sort === 'popular' ? { reviewCount: 'desc' as const } : { rating: 'desc' as const };
    const [data, count] = await Promise.all([
      prisma.developerProfile.findMany({
        where,
        orderBy,
        skip: typeOffsets.developer || 0,
        take: perTypeLimit,
        select: {
          id: true,
          companyName: true,
          logo: true,
          skills: true,
          rating: true,
          reviewCount: true,
          city: true,
          country: true,
          verificationStatus: true,
          user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        },
      }),
      prisma.developerProfile.count({ where }),
    ]);
    data.forEach((d) => results.push({ ...d, _type: 'developer' as const }));
    currentFetched.developer = (currentFetched.developer || 0) + data.length;
    total += count;
  }

  // ---- SERVICES ----
  if (activeTypes.includes('service')) {
    const where = await applyTextSearch({ isActive: true }, q, phrases, excluded, {
      model: 'Service',
      fields: ['name', 'description'],
      baseFilter: '"isActive" = true',
    });
    if (params.availability?.includes('booking')) where.bookingRequired = true;
    const priceFilter = buildPriceFilter(params.priceMin, params.priceMax);
    if (priceFilter) where.price = priceFilter;

    const [data, count] = await Promise.all([
      prisma.service.findMany({
        where,
        skip: typeOffsets.service || 0,
        take: perTypeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          duration: true,
          images: true,
          bookingRequired: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              rating: true,
              city: true,
              country: true,
            },
          },
          reviews: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);
    data.forEach((s) => results.push({ ...s, _type: 'service' as const }));
    currentFetched.service = (currentFetched.service || 0) + data.length;
    total += count;
  }

  // ---- MENU ITEMS ----
  if (activeTypes.includes('menu')) {
    const where = await applyTextSearch(
      { isActive: true, isAvailable: true },
      q,
      phrases,
      excluded,
      {
        model: 'MenuItem',
        fields: ['name', 'description'],
        baseFilter: '"isActive" = true AND "isAvailable" = true',
      }
    );

    const [data, count] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        skip: typeOffsets.menu || 0,
        take: perTypeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          isAvailable: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              rating: true,
              city: true,
              country: true,
            },
          },
        },
      }),
      prisma.menuItem.count({ where }),
    ]);
    data.forEach((m) => results.push({ ...m, _type: 'menu' as const }));
    currentFetched.menu = (currentFetched.menu || 0) + data.length;
    total += count;
  }

  // ---- EVENTS ----
  if (activeTypes.includes('event')) {
    const where = await applyTextSearch({ isActive: true }, q, phrases, excluded, {
      model: 'Event',
      fields: ['title', 'description'],
      baseFilter: '"isActive" = true',
    });

    const [data, count] = await Promise.all([
      prisma.event.findMany({
        where,
        skip: typeOffsets.event || 0,
        take: perTypeLimit,
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          address: true,
          price: true,
          currency: true,
          images: true,
          capacity: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              rating: true,
              city: true,
              country: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);
    data.forEach((e) => results.push({ ...e, _type: 'event' as const }));
    currentFetched.event = (currentFetched.event || 0) + data.length;
    total += count;
  }

  // ---- RENTALS ----
  if (activeTypes.includes('rental')) {
    const where = await applyTextSearch({ isActive: true }, q, phrases, excluded, {
      model: 'Rental',
      fields: ['name', 'description'],
      baseFilter: '"isActive" = true',
    });

    const [data, count] = await Promise.all([
      prisma.rental.findMany({
        where,
        skip: typeOffsets.rental || 0,
        take: perTypeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          unit: true,
          images: true,
          deposit: true,
          quantity: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              rating: true,
              city: true,
              country: true,
            },
          },
        },
      }),
      prisma.rental.count({ where }),
    ]);
    data.forEach((r) => results.push({ ...r, _type: 'rental' as const }));
    currentFetched.rental = (currentFetched.rental || 0) + data.length;
    total += count;
  }

  // ---- PRODUCTS ----
  if (activeTypes.includes('product')) {
    const where = await applyTextSearch({ isActive: true }, q, phrases, excluded, {
      model: 'Product',
      fields: ['name', 'description'],
      baseFilter: '"isActive" = true',
    });

    if (params.availability?.includes('delivery')) where.deliveryFee = { not: null };
    const priceFilter = buildPriceFilter(params.priceMin, params.priceMax);
    if (priceFilter) where.price = priceFilter;

    const [data, count] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: typeOffsets.product || 0,
        take: perTypeLimit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          currency: true,
          images: true,
          stock: true,
          rating: true,
          reviewCount: true,
          tags: true,
          deliveryFee: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              rating: true,
              city: true,
              country: true,
            },
          },
          reviews: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              rating: true,
              comment: true,
              createdAt: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);
    data.forEach((p) => results.push({ ...p, _type: 'product' as const }));
    currentFetched.product = (currentFetched.product || 0) + data.length;
    total += count;
  }

  return {
    data: results.slice(skip, skip + limit),
    total,
    page,
    totalPages: Math.ceil(total / limit),
    nextCursor: activeTypes.map((t) => `${typeKeyMap[t]}:${currentFetched[t] || 0}`).join(','),
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
        id: true,
        name: true,
        slug: true,
        type: true,
        logo: true,
        city: true,
        country: true,
        rating: true,
        reviewCount: true,
        isVerified: true,
        isPremium: true,
        isTopSeller: true,
        isRecommended: true,
        modules: true,
        latitude: true,
        longitude: true,
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { rating: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        currency: true,
        images: true,
        rating: true,
        business: { select: { id: true, name: true, slug: true, logo: true } },
      },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        duration: true,
        business: { select: { id: true, name: true, slug: true, logo: true, rating: true } },
      },
    }),
    prisma.event.findMany({
      where: { isActive: true, startDate: { gte: new Date() } },
      orderBy: { startDate: 'asc' },
      take: 6,
      select: {
        id: true,
        title: true,
        startDate: true,
        address: true,
        price: true,
        images: true,
        capacity: true,
        business: {
          select: { id: true, name: true, slug: true, logo: true, city: true, country: true },
        },
      },
    }),
    prisma.developerModule.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { totalInstalls: 'desc' },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        pricingType: true,
        price: true,
        rating: true,
        totalInstalls: true,
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
      OR: [{ type: business.type }, { city: business.city }],
    },
    orderBy: { rating: 'desc' },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      logo: true,
      city: true,
      country: true,
      rating: true,
      reviewCount: true,
      isVerified: true,
      isPremium: true,
      isTopSeller: true,
      isRecommended: true,
      shortDescription: true,
      modules: true,
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
          id: true,
          name: true,
          objective: true,
          description: true,
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

// ============================================
// PRICE DISTRIBUTION (for histogram)
// ============================================
export async function getPriceDistribution(type?: string, category?: string) {
  const buckets = [
    { label: '0 - 1k', min: 0, max: 1000 },
    { label: '1k - 5k', min: 1000, max: 5000 },
    { label: '5k - 10k', min: 5000, max: 10000 },
    { label: '10k - 25k', min: 10000, max: 25000 },
    { label: '25k - 50k', min: 25000, max: 50000 },
    { label: '50k+', min: 50000, max: Number.MAX_SAFE_INTEGER },
  ];

  const baseWhere: any = { isActive: true };
  if (category) baseWhere.category = { name: { contains: category, mode: 'insensitive' } };

  const countForBucket = async (b: (typeof buckets)[0]) => {
    const priceFilter: any = { gte: b.min };
    if (b.max !== Number.MAX_SAFE_INTEGER) priceFilter.lt = b.max;
    const where = { ...baseWhere, price: priceFilter };
    if (type === 'service') {
      return prisma.service.count({ where });
    }
    return prisma.product.count({ where });
  };

  const results = await Promise.all(buckets.map((b) => countForBucket(b)));

  return buckets.map((b, i) => ({
    label: b.label,
    min: b.min,
    max: b.max === Number.MAX_SAFE_INTEGER ? undefined : b.max,
    count: results[i],
  }));
}

// ============================================
// PRODUCT BY SLUG
// ============================================
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      shortDescription: true,
      price: true,
      promotionalPrice: true,
      currency: true,
      images: true,
      stock: true,
      rating: true,
      reviewCount: true,
      tags: true,
      deliveryFee: true,
      createdAt: true,
      category: { select: { id: true, name: true } },
      business: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          city: true,
          country: true,
          rating: true,
          isVerified: true,
          isPremium: true,
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
    },
  });
  return product;
}
