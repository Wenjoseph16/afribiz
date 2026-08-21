import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';

const SCORE_CATEGORIES = [
  { min: 800, category: 'EXCELLENT' as const },
  { min: 600, category: 'GOOD' as const },
  { min: 400, category: 'MEDIUM' as const },
  { min: 200, category: 'LOW' as const },
  { min: 0, category: 'VERY_LOW' as const },
];

// Échantillon minimum d'enquêtes pour mesurer l'engagement : en dessous,
// le taux de réponse n'est ni récompensé ni pénalisé (pas statistiquement fiable).
const SURVEY_MIN_SAMPLE = 3;

export function getScoreCategory(score: number): string {
  for (const cat of SCORE_CATEGORIES) {
    if (score >= cat.min) return cat.category;
  }
  return 'VERY_LOW';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function weightedScore(scores: number[], weights: number[]): number {
  let total = 0;
  let weightSum = 0;
  for (let i = 0; i < scores.length; i++) {
    total += scores[i] * weights[i];
    weightSum += weights[i];
  }
  return weightSum > 0 ? Math.round(total / weightSum) : 0;
}

export async function computeCommercialActivity(
  businessId: string
): Promise<{ score: number; meta: any }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      _count: { select: { products: true } },
    },
  });
  if (!business) throw new AppError('Business not found', 404);

  // Toutes les commandes du business (produits, services, plats…) — pas seulement
  // les commandes liées à un Product : un business de services ne doit pas être pénalisé.
  const totalOrders = await prisma.order.count({ where: { businessId } });

  // Réservations du business (multi-activité : un boss avec gym + boutique ne mélange pas).
  const totalBookings = await prisma.booking.count({ where: { businessId } });

  const [orderGrowth, revenueStability] = await Promise.all([
    computeMonthlyGrowth(businessId),
    computeRevenueStability(businessId),
  ]);

  const orderScore = clamp(Math.round((totalOrders / 100) * 200), 0, 200);
  const bookingScore = clamp(Math.round((totalBookings / 50) * 200), 0, 200);
  const growthScore = clamp(Math.round(orderGrowth * 2), 0, 200);
  const stabilityScore = clamp(Math.round(revenueStability * 2), 0, 200);

  const weights = [0.4, 0.2, 0.2, 0.2];
  const scores = [orderScore, bookingScore, growthScore, stabilityScore];
  const score = weightedScore(scores, weights);

  return {
    score,
    meta: {
      totalOrders,
      totalBookings,
      orderGrowth,
      revenueStability,
      orderScore,
      bookingScore,
      growthScore,
      stabilityScore,
    },
  };
}

async function computeMonthlyGrowth(businessId: string): Promise<number> {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisCount, lastCount] = await Promise.all([
    prisma.order.count({
      where: { businessId, createdAt: { gte: thisMonth } },
    }),
    prisma.order.count({
      where: { businessId, createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
  ]);

  if (lastCount === 0) return thisCount > 0 ? 100 : 0;
  return ((thisCount - lastCount) / lastCount) * 100;
}

async function computeRevenueStability(businessId: string): Promise<number> {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  // CA réel du business — toutes lignes de commande, tous types d'articles
  const monthlyRevenues = await prisma.$queryRaw<any[]>`
    SELECT DATE_TRUNC('month', o."createdAt") as month, SUM(o."totalAmount") as revenue
    FROM "Order" o
    WHERE o."businessId" = ${businessId}
      AND o."createdAt" >= ${sixMonthsAgo}
      AND o.status IN ('DELIVERED', 'COMPLETED')
    GROUP BY month
    ORDER BY month
  `;

  if (monthlyRevenues.length < 2) return 0;

  const revenues = monthlyRevenues.map((r: any) => Number(r.revenue || 0));
  const mean = revenues.reduce((a: number, b: number) => a + b, 0) / revenues.length;
  if (mean === 0) return 0;

  const variance =
    revenues.reduce((acc: number, r: number) => acc + Math.pow(r - mean, 2), 0) / revenues.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  return clamp(Math.round((1 - cv) * 100), 0, 100);
}

export async function computeFinancialBehavior(
  businessId: string
): Promise<{ score: number; meta: any }> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new AppError('Business not found', 404);

  // Paiements du business (multi-activité : scope businessId, pas via les items)
  const totalPayments = await prisma.payment.count({ where: { businessId } });
  const completedPayments = await prisma.payment.count({
    where: { businessId, status: 'COMPLETED' },
  });

  const latePayments = await prisma.payment.count({
    where: {
      businessId,
      paidAt: null,
      createdAt: { lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  // Litiges sur les COMMANDES du business (unités cohérentes : ordres / ordres)
  const totalOrders = await prisma.order.count({ where: { businessId } });
  const disputedOrders = await prisma.order.count({
    where: { businessId, status: 'CANCELLED' },
  });

  const escrowPayments = await prisma.payment.count({
    where: { businessId, method: 'ESCROW', status: 'COMPLETED' },
  });
  const totalEscrow = await prisma.payment.count({
    where: { businessId, method: 'ESCROW' },
  });

  const paymentRatio = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;
  const lateRatio = totalPayments > 0 ? (latePayments / totalPayments) * 100 : 0;
  const disputeRatio = totalOrders > 0 ? (disputedOrders / totalOrders) * 100 : 0;
  const escrowRate = totalEscrow > 0 ? (escrowPayments / totalEscrow) * 100 : 0;

  const paymentScore = clamp(Math.round(paymentRatio * 2), 0, 200);
  const lateScore = clamp(200 - Math.round(lateRatio * 2), 0, 200);
  const disputeScore = clamp(200 - Math.round(disputeRatio * 2), 0, 200);
  const escrowScore = clamp(Math.round(escrowRate * 2), 0, 200);

  // Pondération corrigée : 4 composantes, poids sommant à 1 (le 5e poids fantôme
  // rendait la pondération effective 35/29/18/18 au lieu de 35/25/20/20).
  const weights = [0.35, 0.25, 0.2, 0.2];
  const scores = [paymentScore, lateScore, disputeScore, escrowScore];
  const score = weightedScore(scores, weights);

  return {
    score,
    meta: {
      paymentRatio,
      lateRatio,
      disputeRatio,
      escrowRate,
      completedPayments,
      latePayments,
      disputedOrders,
    },
  };
}

export async function computeSatisfaction(
  businessId: string
): Promise<{ score: number; meta: any }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, rating: true, reviewCount: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const reviews = await prisma.businessReview.findMany({
    where: { businessId },
    select: { rating: true, createdAt: true },
  });

  // Enquêtes de satisfaction : moyenne des notes + taux de réponse réel
  // (réponses reçues / enquêtes envoyées via satisfactionSurveySentAt).
  // Le count des réponses est fourni par l'agrégat (_count._all) — pas de requête dupliquée.
  const [surveyAgg, sentOrders, sentBookings] = await Promise.all([
    prisma.satisfactionSurveyResponse.aggregate({
      where: { businessId },
      _avg: { score: true },
      _count: { _all: true },
    }),
    prisma.order.count({
      where: { businessId, satisfactionSurveySentAt: { not: null } },
    }),
    prisma.booking.count({
      where: { businessId, satisfactionSurveySentAt: { not: null } },
    }),
  ]);
  const surveyAvg = surveyAgg._avg.score ?? null;
  const surveyResponses = surveyAgg._count._all || 0;
  const surveysSent = sentOrders + sentBookings;
  // Seuil minimum : un échantillon < 3 enquêtes n'est pas statistiquement
  // significatif — l'engagement n'est ni récompensé ni pénalisé en dessous.
  // Décision assumée : ≥ 3 envoyées avec 0 réponse → pénalité engagement (signal réel).
  const surveyEngagementEligible = surveysSent >= SURVEY_MIN_SAMPLE;
  const surveyResponseRate = surveyEngagementEligible
    ? Math.round((surveyResponses / surveysSent) * 1000) / 10
    : null;

  const avgRating = business.rating || 0;
  const reviewCount = business.reviewCount || 0;
  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
  const satisfactionRate = reviewCount > 0 ? (positiveReviews / reviewCount) * 100 : 0;

  const ratingScore = clamp(Math.round((avgRating / 5) * 200), 0, 200);
  const reviewCountScore = clamp(Math.round(Math.min(reviewCount / 10, 1) * 200), 0, 200);
  const satisfactionScore = clamp(Math.round((satisfactionRate / 100) * 200), 0, 200);
  const surveyAvgScore =
    surveyAvg !== null ? clamp(Math.round((surveyAvg / 5) * 200), 0, 200) : null;
  const surveyEngagementScore =
    surveyResponseRate !== null
      ? clamp(Math.round((surveyResponseRate / 100) * 200), 0, 200)
      : null;

  // Temps de réponse RÉEL : pour chaque conversation, délai entre un message du
  // client et la première réponse du business (senderId = ownerId). Les écarts
  // entre messages consécutifs de conversations DIFFÉRENTES n'étaient pas une
  // mesure de réactivité (un client qui écrit 10 messages d'affilée gonflait le score).
  let responseTimeScore = 0;
  const conversations = await prisma.conversation.findMany({
    where: { participants: { has: business.ownerId } },
    orderBy: { lastMessageAt: 'desc' },
    take: 20,
    select: { id: true },
  });
  if (conversations.length > 0) {
    const conversationMessages = await prisma.message.findMany({
      where: { conversationId: { in: conversations.map((c) => c.id) } },
      orderBy: [{ conversationId: 'asc' }, { createdAt: 'asc' }],
      select: { conversationId: true, senderId: true, createdAt: true },
      take: 500,
    });
    const byConversation = new Map<string, typeof conversationMessages>();
    for (const m of conversationMessages) {
      const list = byConversation.get(m.conversationId) || [];
      list.push(m);
      byConversation.set(m.conversationId, list);
    }
    const replyTimes: number[] = [];
    for (const msgs of byConversation.values()) {
      for (let i = 1; i < msgs.length; i++) {
        const prev = msgs[i - 1];
        const cur = msgs[i];
        // Une « réponse » = message du business qui suit un message du client
        if (prev.senderId !== business.ownerId && cur.senderId === business.ownerId) {
          const diff = cur.createdAt.getTime() - prev.createdAt.getTime();
          // Fenêtre réaliste : ignore les écarts > 7 jours (conversations dormantes)
          if (diff > 0 && diff < 7 * 24 * 60 * 60 * 1000) replyTimes.push(diff);
        }
      }
    }
    if (replyTimes.length > 0) {
      const avgHours = replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length / (1000 * 60 * 60);
      responseTimeScore = clamp(Math.round(Math.max(0, 200 - avgHours * 5)), 0, 200);
    }
  }

  // Pondération conditionnelle : un composant SANS données n'est pas pénalisé
  // (ex. un business sans enquêtes ne reçoit pas 0 pour la moyenne d'enquête).
  // weightedScore renormalise par la somme des poids actifs.
  const parts: { score: number; weight: number }[] = [
    { score: ratingScore, weight: 0.3 },
    { score: satisfactionScore, weight: 0.2 },
    { score: reviewCountScore, weight: 0.1 },
    { score: responseTimeScore, weight: 0.15 },
  ];
  if (surveyAvgScore !== null) parts.push({ score: surveyAvgScore, weight: 0.15 });
  if (surveyEngagementScore !== null) parts.push({ score: surveyEngagementScore, weight: 0.1 });

  const score = weightedScore(
    parts.map((p) => p.score),
    parts.map((p) => p.weight)
  );

  return {
    score,
    meta: {
      avgRating,
      reviewCount,
      satisfactionRate,
      responseTimeScore,
      ratingScore,
      reviewCountScore,
      satisfactionScore,
      surveyAvg,
      surveyResponses,
      surveysSent,
      surveyResponseRate,
      surveyAvgScore,
      surveyEngagementScore,
      surveyEngagementEligible,
    },
  };
}

export async function computeOperationalReliability(
  businessId: string
): Promise<{ score: number; meta: any }> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new AppError('Business not found', 404);

  const totalOrders = await prisma.order.count({ where: { businessId } });
  const fulfilledOrders = await prisma.order.count({
    where: { businessId, status: 'DELIVERED' },
  });
  const cancelledOrders = await prisma.order.count({
    where: { businessId, status: 'CANCELLED' },
  });

  const totalBookings = await prisma.booking.count({ where: { businessId } });
  const honouredBookings = await prisma.booking.count({
    where: { businessId, status: 'COMPLETED' },
  });

  const fulfillmentRate = totalOrders > 0 ? (fulfilledOrders / totalOrders) * 100 : 0;
  const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
  const bookingHonourRate = totalBookings > 0 ? (honouredBookings / totalBookings) * 100 : 0;

  const monthsActive = await computeMonthsActive(business.createdAt);
  const consistencyScore = clamp(Math.round(Math.min(monthsActive / 12, 1) * 200), 0, 200);

  const fulfillmentScore = clamp(Math.round((fulfillmentRate / 100) * 200), 0, 200);
  const bookingScore = clamp(Math.round((bookingHonourRate / 100) * 200), 0, 200);
  const cancelScore = clamp(200 - Math.round((cancellationRate / 100) * 200), 0, 200);

  const weights = [0.3, 0.2, 0.25, 0.25];
  const scores = [fulfillmentScore, bookingScore, cancelScore, consistencyScore];
  const score = weightedScore(scores, weights);

  return {
    score,
    meta: {
      fulfillmentRate,
      cancellationRate,
      bookingHonourRate,
      monthsActive,
      fulfillmentScore,
      bookingScore,
      cancelScore,
      consistencyScore,
    },
  };
}

async function computeMonthsActive(createdAt: Date): Promise<number> {
  const now = new Date();
  return (
    (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
  );
}

export async function computeProfileCompleteness(
  businessId: string
): Promise<{ score: number; meta: any }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: {
      hours: { take: 1 },
      portfolioItems: { take: 1 },
      _count: { select: { partners: true } },
    },
  });
  if (!business) throw new AppError('Business not found', 404);

  const checks = [
    { name: 'logo', passed: !!business.logo },
    { name: 'coverImage', passed: !!business.coverImage },
    { name: 'description', passed: !!business.description },
    { name: 'address', passed: !!business.address },
    { name: 'gps', passed: !!(business.latitude && business.longitude) },
    { name: 'phone', passed: !!business.phone },
    { name: 'whatsapp', passed: !!business.whatsapp },
    { name: 'hours', passed: business.hours.length > 0 },
    { name: 'portfolio', passed: business.portfolioItems.length > 0 },
    { name: 'partners', passed: business._count.partners > 0 },
    { name: 'email', passed: !!business.email },
    { name: 'taxId', passed: !!business.taxId },
    { name: 'certifications', passed: business.certifications.length > 0 },
    { name: 'managerName', passed: !!business.managerName },
    { name: 'foundedYear', passed: !!business.foundedYear },
  ];

  const completed = checks.filter((c) => c.passed).length;
  const pct = (completed / checks.length) * 100;
  const score = clamp(Math.round((pct / 100) * 200), 0, 200);

  return {
    score,
    meta: { completionPct: pct, completedFields: completed, totalFields: checks.length, checks },
  };
}

export async function computeBusinessScore(businessId: string): Promise<any> {
  const [commercial, financial, satisfaction, reliability, profile] = await Promise.all([
    computeCommercialActivity(businessId),
    computeFinancialBehavior(businessId),
    computeSatisfaction(businessId),
    computeOperationalReliability(businessId),
    computeProfileCompleteness(businessId),
  ]);

  const overallScore =
    commercial.score + financial.score + satisfaction.score + reliability.score + profile.score;
  const category = getScoreCategory(overallScore);

  // Revenu réel : somme des commandes livrées/terminées du business (le champ
  // était codé en dur à 0 — tout affichage de revenu depuis le score mentait).
  const revenueAgg = await prisma.order.aggregate({
    where: { businessId, status: { in: ['DELIVERED', 'COMPLETED'] } },
    _sum: { totalAmount: true },
  });
  const totalRevenue = Number(revenueAgg._sum.totalAmount || 0);

  const score = await prisma.businessScore.upsert({
    where: { businessId },
    update: {
      overallScore,
      commercialScore: commercial.score,
      financialScore: financial.score,
      satisfactionScore: satisfaction.score,
      reliabilityScore: reliability.score,
      profileScore: profile.score,
      category: category as any,
      totalOrders: commercial.meta.totalOrders || 0,
      totalBookings: commercial.meta.totalBookings || 0,
      totalRevenue,
      avgRating: satisfaction.meta.avgRating || 0,
      reviewCount: satisfaction.meta.reviewCount || 0,
      completionPct: profile.meta.completionPct || 0,
      disputeCount: financial.meta.disputedOrders || 0,
      latePayments: financial.meta.latePayments || 0,
      computedAt: new Date(),
    },
    create: {
      businessId,
      overallScore,
      commercialScore: commercial.score,
      financialScore: financial.score,
      satisfactionScore: satisfaction.score,
      reliabilityScore: reliability.score,
      profileScore: profile.score,
      category: category as any,
      totalOrders: commercial.meta.totalOrders || 0,
      totalBookings: commercial.meta.totalBookings || 0,
      totalRevenue,
      avgRating: satisfaction.meta.avgRating || 0,
      reviewCount: satisfaction.meta.reviewCount || 0,
      completionPct: profile.meta.completionPct || 0,
      disputeCount: financial.meta.disputedOrders || 0,
      latePayments: financial.meta.latePayments || 0,
    },
  });

  await saveScoreHistory(businessId);
  await recomputeBadges(businessId);

  return {
    ...score,
    components: {
      commercial: { score: commercial.score, meta: commercial.meta },
      financial: { score: financial.score, meta: financial.meta },
      satisfaction: { score: satisfaction.score, meta: satisfaction.meta },
      reliability: { score: reliability.score, meta: reliability.meta },
      profile: { score: profile.score, meta: profile.meta },
    },
  };
}

export async function saveScoreHistory(businessId: string): Promise<void> {
  const score = await prisma.businessScore.findUnique({ where: { businessId } });
  if (!score) return;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const existing = await prisma.scoreHistory.findFirst({
    where: {
      businessId,
      snapshotDate: today,
      period: 'WEEKLY',
    },
  });

  if (existing) return;

  await prisma.scoreHistory.create({
    data: {
      businessId,
      overallScore: score.overallScore,
      commercialScore: score.commercialScore,
      financialScore: score.financialScore,
      satisfactionScore: score.satisfactionScore,
      reliabilityScore: score.reliabilityScore,
      profileScore: score.profileScore,
      category: score.category,
      period: 'WEEKLY',
      snapshotDate: today,
    },
  });
}

export async function getBadges(businessId: string): Promise<any[]> {
  return prisma.businessBadge.findMany({
    where: { businessId, isActive: true },
    orderBy: { earnedAt: 'desc' },
  });
}

async function recomputeBadges(businessId: string): Promise<void> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { score: true },
  });
  if (!business || !business.score) return;

  const score = business.score;
  const badges: { badge: string; label: string; description: string; icon?: string }[] = [];

  if (business.isVerified) {
    badges.push({
      badge: 'BUSINESS_VERIFIED',
      label: 'Vérifié',
      description: 'Compte vérifié par AfriBiz',
      icon: 'verified',
    });
  }

  if (score.overallScore >= 800 && score.commercialScore >= 160) {
    badges.push({
      badge: 'TOP_SELLER',
      label: 'Top Vendeur',
      description: 'Parmi les meilleurs vendeurs',
      icon: 'top_seller',
    });
  }

  if (score.overallScore >= 800 && score.reliabilityScore >= 160) {
    badges.push({
      badge: 'TOP_PROVIDER',
      label: 'Top Prestataire',
      description: 'Prestataire fiable et performant',
      icon: 'top_provider',
    });
  }

  if (business.type === 'RESTAURANT' && score.overallScore >= 700) {
    badges.push({
      badge: 'TOP_RESTAURANT',
      label: 'Top Restaurant',
      description: 'Restaurant recommandé',
      icon: 'top_restaurant',
    });
  }

  if (business.type === 'HOTEL' && score.overallScore >= 700) {
    badges.push({
      badge: 'TOP_HOTEL',
      label: 'Top Hôtel',
      description: 'Hôtel recommandé',
      icon: 'top_hotel',
    });
  }

  if (business.isPremium) {
    badges.push({
      badge: 'BUSINESS_PREMIUM',
      label: 'Premium',
      description: 'Business Premium AfriBiz',
      icon: 'premium',
    });
  }

  if (business.isRecommended) {
    badges.push({
      badge: 'BUSINESS_RECOMMENDED',
      label: 'Recommandé',
      description: 'Business recommandé par AfriBiz',
      icon: 'recommended',
    });
  }

  if (score.overallScore >= 600 && score.reliabilityScore >= 150) {
    badges.push({
      badge: 'BUSINESS_RELIABLE',
      label: 'Fiable',
      description: 'Business fiable et digne de confiance',
      icon: 'reliable',
    });
  }

  if (score.overallScore >= 900) {
    badges.push({
      badge: 'BUSINESS_ELITE',
      label: 'Elite',
      description: "Business d'élite",
      icon: 'elite',
    });
  }

  // --- NOUVEAUX BADGES PHASE 7 ---

  // PAYMENT_VERIFIED: > 50 paiements réussis, 0 litige 90j
  const recentPayments = await prisma.payment.count({
    where: { businessId, status: 'COMPLETED' },
  });
  const recentDisputes = await prisma.dispute.count({
    where: { businessId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
  });
  if (recentPayments >= 50 && recentDisputes === 0) {
    badges.push({
      badge: 'PAYMENT_VERIFIED',
      label: 'Paiement Sécurisé',
      description: 'Plus de 50 paiements réussis sans litige',
      icon: 'payment_verified',
    });
  }

  // RESPONSE_TIME: temps médian réponse < 30min (30 derniers jours uniquement)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentMessages = await prisma.message.findMany({
    where: {
      conversation: { participants: { has: business.ownerId } },
      createdAt: { gte: thirtyDaysAgo },
    },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  if (recentMessages.length >= 4) {
    const responseTimes: number[] = [];
    for (let i = 1; i < recentMessages.length; i++) {
      const diff =
        recentMessages[i].createdAt.getTime() - recentMessages[i - 1].createdAt.getTime();
      if (diff > 0 && diff < 24 * 60 * 60 * 1000) responseTimes.push(diff);
    }
    if (responseTimes.length >= 2) {
      responseTimes.sort((a, b) => a - b);
      const median = responseTimes[Math.floor(responseTimes.length / 2)];
      const medianMinutes = median / (1000 * 60);
      if (medianMinutes < 30) {
        badges.push({
          badge: 'RESPONSE_TIME',
          label: 'Réponse Rapide',
          description: 'Temps de réponse médian < 30 min',
          icon: 'response_time',
        });
      }
    }
  }

  // ESCROW_ACTIVE: utilise escrow pour > 80% transactions > 50k
  const largeTransactions = await prisma.payment.count({
    where: { businessId, amount: { gte: 50000 } },
  });
  const escrowTransactions = await prisma.payment.count({
    where: { businessId, amount: { gte: 50000 }, method: 'ESCROW' },
  });
  if (largeTransactions > 0 && escrowTransactions / largeTransactions >= 0.8) {
    badges.push({
      badge: 'ESCROW_ACTIVE',
      label: 'Transactions Sécurisées',
      description: 'Utilise le paiement sécurisé Escrow',
      icon: 'escrow_active',
    });
  }

  for (const badge of badges) {
    await prisma.businessBadge.upsert({
      where: { businessId_badge: { businessId, badge: badge.badge as any } },
      update: {
        isActive: true,
        label: badge.label,
        description: badge.description,
        icon: badge.icon,
      },
      create: {
        businessId,
        badge: badge.badge as any,
        label: badge.label,
        description: badge.description,
        icon: badge.icon,
      },
    });
  }
}

export async function recomputeAllScores(): Promise<number> {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  for (const b of businesses) {
    try {
      await computeBusinessScore(b.id);
    } catch (err) {
      logger.error(`Failed to compute score for business ${b.id}`, { error: err });
    }
  }
  return businesses.length;
}

export async function getScoreHistory(businessId: string, period?: string): Promise<any[]> {
  return prisma.scoreHistory.findMany({
    where: {
      businessId,
      ...(period ? { period } : {}),
    },
    orderBy: { snapshotDate: 'desc' },
    take: 52,
  });
}

export async function getSectorBenchmark(sector: string): Promise<any> {
  const benchmark = await prisma.sectorBenchmark.findUnique({ where: { sector } });
  if (!benchmark) {
    const scores = await prisma.business.findMany({
      where: { type: sector as any, isActive: true, score: { isNot: null } },
      include: { score: true },
    });

    if (scores.length === 0) {
      return {
        sector,
        avgScore: 0,
        avgCommercial: 0,
        avgFinancial: 0,
        avgSatisfaction: 0,
        avgReliability: 0,
        avgProfile: 0,
        businessCount: 0,
      };
    }

    const totals = scores.reduce(
      (acc, b) => {
        if (!b.score) return acc;
        return {
          avgScore: acc.avgScore + b.score.overallScore,
          avgCommercial: acc.avgCommercial + b.score.commercialScore,
          avgFinancial: acc.avgFinancial + b.score.financialScore,
          avgSatisfaction: acc.avgSatisfaction + b.score.satisfactionScore,
          avgReliability: acc.avgReliability + b.score.reliabilityScore,
          avgProfile: acc.avgProfile + b.score.profileScore,
        };
      },
      {
        avgScore: 0,
        avgCommercial: 0,
        avgFinancial: 0,
        avgSatisfaction: 0,
        avgReliability: 0,
        avgProfile: 0,
      }
    );

    const count = scores.length;
    return {
      sector,
      avgScore: Math.round(totals.avgScore / count),
      avgCommercial: Math.round(totals.avgCommercial / count),
      avgFinancial: Math.round(totals.avgFinancial / count),
      avgSatisfaction: Math.round(totals.avgSatisfaction / count),
      avgReliability: Math.round(totals.avgReliability / count),
      avgProfile: Math.round(totals.avgProfile / count),
      businessCount: count,
    };
  }

  return benchmark;
}
