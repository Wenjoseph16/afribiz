import { prisma } from '../lib/db';
import { logger } from '../lib/logger';

export async function computeProductScore(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      rating: true,
      reviewCount: true,
      orderCount: true,
      stock: true,
      isActive: true,
      featured: true,
      discountPercent: true,
      tags: true,
      businessId: true,
    },
  });
  if (!product) return null;

  const popularity = Math.min((product.orderCount || 0) / 200, 1) * 0.3;
  const satisfaction = ((product.rating || 0) / 5) * 0.25;
  const engagement = Math.min((product.reviewCount || 0) / 50, 1) * 0.15;
  const availability = product.stock > 0 ? 0.1 : 0;
  const promoBonus = (product.discountPercent || 0) > 0 ? 0.1 : 0;
  const featuredBonus = product.featured ? 0.1 : 0;

  const score = Math.round(
    (popularity + satisfaction + engagement + availability + promoBonus + featuredBonus) * 100
  );
  const category =
    score >= 80 ? 'EXCELLENT' : score >= 60 ? 'GOOD' : score >= 40 ? 'AVERAGE' : 'LOW';

  const businessData = (await prisma.business.findUnique({
    where: { id: product.businessId! },
    select: { score: { select: { overallScore: true } } },
  })) as any;
  const afriBoost = (businessData?.score?.overallScore ?? 0) > 700 ? Math.round(score * 0.1) : 0;
  const finalScore = Math.min(score + afriBoost, 100);

  return { productId, score: finalScore, category };
}

export async function recomputeProductScoresForBusiness(businessId: string) {
  const products = await prisma.product.findMany({
    where: { businessId, deletedAt: null },
    select: { id: true },
  });
  for (const p of products) {
    try {
      await computeProductScore(p.id);
    } catch (err) {
      logger.error(`Failed to compute score for product ${p.id}:`, err);
    }
  }
}
