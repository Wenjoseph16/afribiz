import { prisma } from '../lib/db';

type WeightedTag = { tag: string; weight: number };
type SimilarProduct = { productId: string; score: number };

export function cosineSimilarity(a: WeightedTag[], b: WeightedTag[]): number {
  const map = new Map<string, number>();
  for (const { tag, weight } of a) map.set(tag, weight);
  let dot = 0,
    normA = 0,
    normB = 0;
  for (const { weight } of a) normA += weight * weight;
  for (const { tag, weight } of b) {
    normB += weight * weight;
    if (map.has(tag)) dot += weight * (map.get(tag) || 0);
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findSimilarProducts(
  productId: string,
  limit = 10
): Promise<SimilarProduct[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, tags: true, categoryId: true, businessId: true, name: true },
  });
  if (!product) return [];

  const tagWeights = buildWeightedTags(product.tags, product.categoryId);

  const candidates = await prisma.product.findMany({
    where: {
      id: { not: productId },
      businessId: product.businessId,
      isActive: true,
      deletedAt: null,
    },
    select: { id: true, tags: true, categoryId: true },
    take: 100,
  });

  const scored: SimilarProduct[] = candidates.map((c) => {
    const sim = cosineSimilarity(tagWeights, buildWeightedTags(c.tags, c.categoryId));
    return { productId: c.id, score: sim };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function findSimilarBusinesses(
  businessId: string,
  limit = 10
): Promise<{ businessId: string; score: number }[]> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, type: true, modules: true, city: true, country: true },
  });
  if (!business) return [];

  const candidates = await prisma.business.findMany({
    where: { id: { not: businessId }, isActive: true, deletedAt: null, country: business.country },
    select: { id: true, type: true, modules: true, city: true, rating: true, reviewCount: true },
    take: 100,
  });

  const scored = candidates.map((c) => {
    let score = 0;
    if (c.type === business.type) score += 0.4;
    const moduleOverlap = business.modules.filter((m) => c.modules.includes(m)).length;
    const maxModules = Math.max(business.modules.length, c.modules.length);
    if (maxModules > 0) score += (moduleOverlap / maxModules) * 0.3;
    if (c.city === business.city) score += 0.15;
    const ratingScore = ((c.rating || 0) / 5) * 0.1;
    score += ratingScore;
    const reviewBonus = Math.min((c.reviewCount || 0) / 100, 1) * 0.05;
    score += reviewBonus;
    return { businessId: c.id, score: Math.min(score, 1) };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function buildWeightedTags(tags: string[], categoryId: string | null): WeightedTag[] {
  const weights: WeightedTag[] = tags.map((tag) => ({ tag: tag.toLowerCase(), weight: 1 }));
  if (categoryId) weights.push({ tag: `cat:${categoryId}`, weight: 0.8 });
  return weights;
}
