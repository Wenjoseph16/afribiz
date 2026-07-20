import { prisma } from '../lib/db';
import { OpportunityType, OpportunityStatus } from '@prisma/client';
import { logger } from '../lib/logger';

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// ──────────────────────────────────────────────
// DETECT OPPORTUNITIES FOR A BUSINESS
// ──────────────────────────────────────────────

export async function detectOpportunities(businessId: string): Promise<number> {
  let detected = 0;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, type: true, city: true, country: true },
  });
  if (!business) return 0;

  // 1. Detect from search logs — queries with 0 results in the business's city/country
  const searchGaps = await detectSearchGaps(businessId, business.city, business.country);
  detected += searchGaps;

  // 2. Detect from favorites — orphaned references
  const favoriteGaps = await detectFavoriteGaps(businessId, business.type);
  detected += favoriteGaps;

  // 3. Detect trending searches relevant to this business type
  const trendingGaps = await detectTrendingForBusiness(businessId, business.type);
  detected += trendingGaps;

  return detected;
}

async function detectSearchGaps(
  businessId: string,
  _city?: string | null,
  _country?: string | null
): Promise<number> {
  let count = 0;
  const sevenDaysAgo = SEVEN_DAYS_AGO();

  // Find search queries with 0 results in the business's area
  const zeroResultSearches = await prisma.searchLog.groupBy({
    by: ['query'],
    where: { resultCount: 0, createdAt: { gte: sevenDaysAgo } },
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 20,
  });

  for (const s of zeroResultSearches) {
    if (s._count.query < 3) continue; // Require at least 3 searches with no results

    const existing = await prisma.opportunity.findFirst({
      where: {
        businessId,
        keyword: s.query,
        type: 'PRODUCT_GAP' as OpportunityType,
        status: { not: 'DISMISSED' as OpportunityStatus },
      },
    });
    if (existing) continue;

    await prisma.opportunity.create({
      data: {
        businessId,
        type: 'PRODUCT_GAP' as OpportunityType,
        keyword: s.query,
        source: 'SEARCH',
        count: s._count.query,
        metadata: { searches: s._count.query },
      },
    });
    count++;
  }

  return count;
}

async function detectFavoriteGaps(businessId: string, _businessType: string): Promise<number> {
  let count = 0;

  // Find favorites where the referenced product doesn't exist (orphaned)
  const businessProducts = await prisma.product.findMany({
    where: { businessId, deletedAt: null },
    select: { id: true },
  });
  const productIds = new Set(businessProducts.map((p) => p.id));

  const externalFavorites = await prisma.favorite.findMany({
    where: { type: 'PRODUCT', NOT: { referenceId: { in: Array.from(productIds) } } },
    select: { referenceId: true },
    take: 100,
  });

  const refCount = new Map<string, number>();
  for (const f of externalFavorites) {
    refCount.set(f.referenceId, (refCount.get(f.referenceId) || 0) + 1);
  }

  for (const [refId, cnt] of refCount) {
    if (cnt < 2) continue;

    const existing = await prisma.opportunity.findFirst({
      where: {
        businessId,
        keyword: refId,
        type: 'FAVORITE_GAP' as OpportunityType,
        status: { not: 'DISMISSED' as OpportunityStatus },
      },
    });
    if (existing) continue;

    await prisma.opportunity.create({
      data: {
        businessId,
        type: 'FAVORITE_GAP' as OpportunityType,
        keyword: `Produit recherché #${refId.substring(0, 8)}`,
        source: 'FAVORITE',
        count: cnt,
        metadata: { referenceId: refId, favorites: cnt },
      },
    });
    count++;
  }

  return count;
}

async function detectTrendingForBusiness(
  businessId: string,
  businessType: string
): Promise<number> {
  let count = 0;
  const thirtyDaysAgo = THIRTY_DAYS_AGO();

  // Find trending search queries (high volume)
  const trending = await prisma.searchLog.groupBy({
    by: ['query'],
    where: { resultCount: { gt: 0 }, createdAt: { gte: thirtyDaysAgo } },
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 30,
  });

  const topTrending = trending.filter((t) => t._count.query >= 10);

  for (const t of topTrending) {
    const existing = await prisma.opportunity.findFirst({
      where: {
        businessId,
        keyword: t.query,
        type: 'TRENDING_SEARCH' as OpportunityType,
        status: { not: 'DISMISSED' as OpportunityStatus },
      },
    });
    if (existing) continue;

    await prisma.opportunity.create({
      data: {
        businessId,
        type: 'TRENDING_SEARCH' as OpportunityType,
        keyword: t.query,
        source: 'TREND',
        count: t._count.query,
        metadata: { searches: t._count.query, businessType },
      },
    });
    count++;
  }

  return count;
}

// ──────────────────────────────────────────────
// FEED OPPORTUNITIES
// ──────────────────────────────────────────────

export async function getOpportunityFeed(businessId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.opportunity.findMany({
      where: { businessId, status: { not: 'DISMISSED' as OpportunityStatus } },
      orderBy: [{ count: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.opportunity.count({
      where: { businessId, status: { not: 'DISMISSED' as OpportunityStatus } },
    }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function updateOpportunityStatus(opportunityId: string, status: OpportunityStatus) {
  const update: any = { status };
  if (status === 'SEEN') update.seenAt = new Date();
  if (status === 'ACTED') update.actedAt = new Date();
  if (status === 'DISMISSED') update.dismissedAt = new Date();

  return prisma.opportunity.update({
    where: { id: opportunityId },
    data: update,
  });
}

// ──────────────────────────────────────────────
// PUBLIC FEED — "X personnes recherchent Y"
// ──────────────────────────────────────────────

export async function getPublicOpportunityFeed(_page = 1, limit = 10) {
  const sevenDaysAgo = SEVEN_DAYS_AGO();

  const trendingSearches = await prisma.searchLog.groupBy({
    by: ['query'],
    where: { resultCount: { gt: 0 }, createdAt: { gte: sevenDaysAgo } },
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 20,
  });

  return trendingSearches
    .filter((t) => t._count.query >= 5)
    .slice(0, limit)
    .map((t) => ({
      keyword: t.query,
      peopleSearching: t._count.query,
      type: 'SEARCH_TREND' as const,
    }));
}

export async function getUnmetDemandFeed(_page = 1, limit = 10) {
  const sevenDaysAgo = SEVEN_DAYS_AGO();

  const unmet = await prisma.searchLog.groupBy({
    by: ['query'],
    where: { resultCount: 0, createdAt: { gte: sevenDaysAgo } },
    _count: { query: true },
    orderBy: { _count: { query: 'desc' } },
    take: 20,
  });

  return unmet
    .filter((t) => t._count.query >= 3)
    .slice(0, limit)
    .map((t) => ({
      keyword: t.query,
      peopleSearching: t._count.query,
      type: 'UNMET_DEMAND' as const,
    }));
}

// ──────────────────────────────────────────────
// BATCH DETECTION FOR ALL BUSINESSES
// ──────────────────────────────────────────────

export async function detectAllOpportunities(): Promise<{
  total: number;
  detected: number;
  errors: number;
}> {
  let detected = 0;
  let errors = 0;

  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const b of businesses) {
      try {
        const count = await detectOpportunities(b.id);
        detected += count;
      } catch (err) {
        errors++;
        logger.error(`Opportunity detection failed for ${b.id}`, err);
      }
    }

    logger.info(
      `Opportunity detection: ${detected} new opportunities for ${businesses.length} businesses (${errors} errors)`
    );
  } catch (err) {
    logger.error('Opportunity detection: failed to fetch businesses', err);
  }

  return { total: 0, detected, errors };
}
