import { prisma } from '../lib/db';

type FacetCount = { value: string; count: number };
type SearchResult<T> = { items: T[]; total: number; facets?: Record<string, FacetCount[]> };

export async function searchMarketplace(
  query: string,
  filters: {
    type?: string;
    categoryId?: string;
    businessType?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }
): Promise<SearchResult<any>> {
  const page = filters.page || 1;
  const limit = Math.min(filters.limit || 20, 50);
  const skip = (page - 1) * limit;

  const type = filters.type || 'ALL';

  if (type === 'PRODUCT' || type === 'ALL') {
    return searchProducts(query, filters, skip, limit);
  }
  if (type === 'SERVICE') {
    return searchServices(query, filters, skip, limit);
  }
  if (type === 'BUSINESS') {
    return searchBusinesses(query, filters, skip, limit);
  }

  return { items: [], total: 0 };
}

async function searchProducts(
  query: string,
  filters: any,
  skip: number,
  limit: number
): Promise<SearchResult<any>> {
  const where: any = { isActive: true, deletedAt: null };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.businessType) where.business = { ...where.business, type: filters.businessType };
  if (filters.city) where.business = { ...where.business, city: filters.city };
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
  }
  const hasQuery = query && query.trim().length > 0;
  if (hasQuery) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { tags: { has: query.toLowerCase() } },
    ];
  }

  const orderBy: any =
    filters.sort === 'price_asc'
      ? { price: 'asc' }
      : filters.sort === 'price_desc'
        ? { price: 'desc' }
        : filters.sort === 'rating'
          ? { rating: 'desc' }
          : filters.sort === 'newest'
            ? { createdAt: 'desc' }
            : { orderCount: 'desc' };

  const products = await prisma.product.findMany({
    where,
    include: {
      business: {
        select: { id: true, name: true, slug: true, logo: true, city: true, country: true },
      },
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy,
    skip,
    take: limit,
  });

  const total = await prisma.product.count({ where });

  const facets = hasQuery ? await getProductFacets(query) : undefined;

  return { items: products, total, facets };
}

async function searchServices(
  query: string,
  filters: any,
  skip: number,
  limit: number
): Promise<SearchResult<any>> {
  const where: any = { isActive: true, deletedAt: null };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.city) where.business = { ...where.business, city: filters.city };
  const hasQuery = query && query.trim().length > 0;
  if (hasQuery) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }
  const total = await prisma.service.count({ where });
  const services = await prisma.service.findMany({
    where,
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true, city: true } },
      category: { select: { id: true, name: true } },
    },
    orderBy: { rating: 'desc' },
    skip,
    take: limit,
  });
  return { items: services, total };
}

async function searchBusinesses(
  query: string,
  filters: any,
  skip: number,
  limit: number
): Promise<SearchResult<any>> {
  const where: any = { isActive: true, deletedAt: null };
  if (filters.businessType) where.type = filters.businessType;
  if (filters.city) where.city = filters.city;
  const hasQuery = query && query.trim().length > 0;
  if (hasQuery) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { shortDescription: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
    ];
  }
  const total = await prisma.business.count({ where });
  const businesses = await prisma.business.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      type: true,
      city: true,
      country: true,
      rating: true,
      reviewCount: true,
      shortDescription: true,
      isVerified: true,
    },
    orderBy: { rating: 'desc' },
    skip,
    take: limit,
  });
  return { items: businesses, total };
}

async function getProductFacets(query: string): Promise<Record<string, FacetCount[]>> {
  const raw = await prisma.$queryRawUnsafe<{ category: string; count: bigint }[]>(
    `SELECT c.name as category, COUNT(*) as count
     FROM "Product" p
     LEFT JOIN "ProductCategory" c ON p."categoryId" = c.id
     WHERE p."isActive" = true AND p."deletedAt" IS NULL
       AND (p.name ILIKE $1 OR p.description ILIKE $1)
     GROUP BY c.name
     ORDER BY count DESC LIMIT 10`,
    `%${query}%`
  );
  return {
    categories: raw.map((r) => ({ value: r.category || 'Non catégorisé', count: Number(r.count) })),
  };
}

export async function getSearchHistory(userId?: string) {
  if (!userId) return [];
  const searches = await prisma.searchLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: { id: true, query: true, createdAt: true },
  });
  return searches.map((s) => ({
    id: s.id,
    query: s.query,
    date: s.createdAt,
  }));
}

export async function getSearchSuggestions(query: string, limit = 5) {
  if (!query || query.trim().length < 2) return [];
  const like = `%${query}%`;
  const [products, businesses] = await Promise.all([
    prisma.$queryRawUnsafe<{ id: string; text: string; type: string }[]>(
      `SELECT id, name as text, 'PRODUCT' as type FROM "Product"
       WHERE "isActive" = true AND "deletedAt" IS NULL AND name ILIKE $1
       ORDER BY "orderCount" DESC LIMIT $2`,
      like,
      limit
    ),
    prisma.$queryRawUnsafe<{ id: string; text: string; type: string }[]>(
      `SELECT id, name as text, 'BUSINESS' as type FROM "Business"
       WHERE "isActive" = true AND "deletedAt" IS NULL AND name ILIKE $1
       ORDER BY rating DESC LIMIT $2`,
      like,
      limit
    ),
  ]);
  return [...products, ...businesses].slice(0, limit * 2);
}
