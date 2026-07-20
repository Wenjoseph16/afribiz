import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { cache } from '../lib/cache';

/**
 * Valeurs par défaut des poids pour le calcul du health score (utilisées
 * si aucune configuration PlatformCopilotConfig n'est trouvée en DB).
 */
const DEFAULT_SCORE_WEIGHTS: Record<string, number> = {
  afriScore: 40,
  orders30d: 15,
  bookings30d: 15,
  reviews30d: 10,
  pageViews30d: 10,
  products: 5,
  ads: 5,
};

/**
 * Récupère les poids depuis la config platform en DB (fix #41).
 * Fallback sur les valeurs par défaut si aucune config n'existe.
 */
async function getHealthScoreWeights(): Promise<Record<string, number>> {
  try {
    const config = await prisma.platformCopilotConfig.findFirst({
      where: { enabled: true },
      orderBy: { createdAt: 'desc' },
    });
    if (config?.scoreWeight && typeof config.scoreWeight === 'object') {
      const raw = config.scoreWeight as Record<string, any>;
      // Fusionner les poids DB avec les défauts (les champs manquants
      // prennent la valeur par défaut)
      const merged: Record<string, number> = { ...DEFAULT_SCORE_WEIGHTS };
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === 'number') {
          merged[key] = value;
        }
      }
      return merged;
    }
  } catch (err) {
    logger.error('Failed to load health score weights from DB:', err);
  }
  return { ...DEFAULT_SCORE_WEIGHTS };
}

async function getBusinessConfig(businessId: string) {
  try {
    const config = await prisma.copilotConfiguration.findUnique({
      where: { businessId },
    });
    return config;
  } catch {
    return null;
  }
}

export async function generateDailyTips(businessId: string): Promise<any> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { score: true, hours: { take: 1 } },
  });
  if (!business) throw new AppError('Business not found', 404);

  const config = await getBusinessConfig(businessId);
  if (config && !config.dailyTipEnabled) {
    return {
      businessId,
      businessName: business.name,
      generatedAt: new Date(),
      score: business.score
        ? { overall: business.score.overallScore, category: business.score.category }
        : null,
      tips: [],
      totalUnresolvedIssues: 0,
    };
  }

  const tips: {
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    action?: string;
  }[] = [];

  const hasHours = business.hours && business.hours.length > 0;
  const score = business.score;

  // Profile completeness tips
  if (!business.logo)
    tips.push({
      type: 'profile',
      priority: 'high',
      message: 'Ajoutez un logo pour rendre votre profil plus professionnel.',
      action: 'Mettre à jour le profil',
    });
  if (!business.description)
    tips.push({
      type: 'profile',
      priority: 'high',
      message: 'Ajoutez une description de votre entreprise pour attirer plus de clients.',
      action: 'Ajouter une description',
    });
  if (!business.address)
    tips.push({
      type: 'profile',
      priority: 'medium',
      message: 'Ajoutez votre adresse pour que les clients vous trouvent facilement.',
    });
  if (!business.phone)
    tips.push({
      type: 'profile',
      priority: 'medium',
      message: 'Ajoutez un numéro de téléphone pour être contacté facilement.',
    });
  if (!hasHours)
    tips.push({
      type: 'profile',
      priority: 'medium',
      message: "Configurez vos horaires d'ouverture pour informer vos clients.",
    });

  if (score) {
    if (score.completionPct < 50)
      tips.push({
        type: 'score',
        priority: 'high',
        message:
          'Votre profil est complété à ' +
          score.completionPct.toFixed(0) +
          '%. Complétez-le pour améliorer votre score AfriScore.',
        action: 'Voir mon profil',
      });
    if (score.overallScore < 400)
      tips.push({
        type: 'score',
        priority: 'high',
        message:
          'Votre AfriScore est de ' +
          score.overallScore +
          '/1000. Un score faible peut réduire votre visibilité.',
        action: 'Améliorer mon score',
      });
    if (score.reliabilityScore < 100)
      tips.push({
        type: 'reliability',
        priority: 'high',
        message:
          "Votre fiabilité opérationnelle est basse. Assurez-vous d'honorer vos commandes et réservations.",
      });
  }

  // Check recent activity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [recentOrders, products, reviews] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.product.count({ where: { businessId, deletedAt: null, isActive: true } }),
    prisma.businessReview.findMany({
      where: { businessId, createdAt: { gte: thirtyDaysAgo } },
      select: { rating: true },
    }),
  ]);

  // Activity tips
  if (recentOrders === 0 && business.createdAt < thirtyDaysAgo)
    tips.push({
      type: 'activity',
      priority: 'high',
      message:
        'Aucune commande reçue depuis 30 jours. Lancez une promotion pour attirer des clients.',
      action: 'Créer une promotion',
    });
  if (products === 0)
    tips.push({
      type: 'products',
      priority: 'medium',
      message: 'Aucun produit publié. Ajoutez vos produits pour commencer à vendre en ligne.',
      action: 'Ajouter un produit',
    });

  const negativeReviews = reviews.filter((r) => r.rating < 3);
  if (negativeReviews.length > 0)
    tips.push({
      type: 'reviews',
      priority: 'high',
      message:
        negativeReviews.length +
        ' avis négatif(s) récemment. Répondez-y pour montrer votre réactivité.',
    });

  // Growth tip based on score trend
  if (score && score.overallScore >= 600)
    tips.push({
      type: 'growth',
      priority: 'low',
      message:
        'Votre AfriScore est bon ! Pensez à activer les publicités AfriBiz Ads pour booster votre visibilité.',
      action: 'Créer une campagne pub',
    });

  if (tips.length === 0)
    tips.push({
      type: 'success',
      priority: 'low',
      message: 'Tout va bien ! Continuez à maintenir la qualité de votre service.',
    });

  return {
    businessId,
    businessName: business.name,
    generatedAt: new Date(),
    score: score ? { overall: score.overallScore, category: score.category } : null,
    tips: tips.slice(0, 10),
    totalUnresolvedIssues: tips.filter((t) => t.priority === 'high').length,
  };
}

export async function getBusinessHealth(businessId: string): Promise<any> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { score: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const config = await getBusinessConfig(businessId);
  const healthEnabled = config ? config.enabled : true;
  if (!healthEnabled) {
    return {
      businessId,
      businessName: business.name,
      healthScore: 0,
      status: 'fair' as const,
      metrics: {
        afriScore: business.score?.overallScore || 0,
        orders30d: 0,
        bookings30d: 0,
        reviews30d: 0,
        pageViews30d: 0,
        totalProducts: 0,
        activeAdCampaigns: 0,
      },
      scoreCategory: business.score?.category || 'VERY_LOW',
    };
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [orders, bookings, reviews, pageViews, activeCampaigns] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({
      where: { providerId: business.ownerId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.businessReview.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.adCampaign.count({ where: { businessId: business.id, status: 'ACTIVE' } }),
  ]);

  const totalProducts = await prisma.product.count({
    where: { businessId, deletedAt: null, isActive: true },
  });

  const score = business.score;

  // Lire les poids depuis la config platform (fix #41)
  const w = await getHealthScoreWeights();
  const totalWeight = Object.values(w).reduce((s, v) => s + v, 0) || 100;

  const healthScore = score
    ? Math.round(
        (((score.overallScore / 10) * (w.afriScore || 40)) / totalWeight) * 100 +
          (Math.min(orders * 5, 200) * (w.orders30d || 15)) / totalWeight +
          (Math.min(pageViews / 10, 100) * (w.pageViews30d || 10)) / totalWeight +
          ((totalProducts > 0 ? 100 : 0) * (w.products || 5)) / totalWeight
      )
    : 0;

  let status: 'excellent' | 'good' | 'fair' | 'critical' = 'fair';
  if (healthScore >= 80) status = 'excellent';
  else if (healthScore >= 60) status = 'good';
  else if (healthScore >= 40) status = 'fair';
  else status = 'critical';

  return {
    businessId,
    businessName: business.name,
    healthScore,
    status,
    metrics: {
      afriScore: score?.overallScore || 0,
      orders30d: orders,
      bookings30d: bookings,
      reviews30d: reviews,
      pageViews30d: pageViews,
      totalProducts,
      activeAdCampaigns: activeCampaigns,
    },
    scoreCategory: score?.category || 'VERY_LOW',
  };
}

/**
 * Module-specific tips generated from the business's active modules.
 */
const MODULE_TIPS: Record<
  string,
  Array<{ priority: 'high' | 'medium' | 'low'; message: string; action?: string }>
> = {
  ORDERS: [
    {
      priority: 'low',
      message: 'Activez les notifications de nouvelles commandes pour ne rien manquer.',
      action: 'Configurer notifications',
    },
    {
      priority: 'medium',
      message: 'Créez des codes promo pour booster vos ventes.',
      action: 'Créer un code promo',
    },
  ],
  BOOKINGS: [
    {
      priority: 'medium',
      message: 'Optimisez vos créneaux de réservation pour réduire les trous.',
      action: 'Gérer créneaux',
    },
    { priority: 'low', message: 'Activez les rappels automatiques pour réduire les no-shows.' },
  ],
  INVOICES: [
    {
      priority: 'low',
      message: 'Utilisez les factures récurrentes pour automatiser votre facturation.',
      action: 'Créer facture récurrente',
    },
  ],
  PAYMENTS: [
    {
      priority: 'medium',
      message: 'Proposez Mobile Money (Orange Money, MTN, Moov) pour toucher plus de clients.',
      action: 'Configurer paiements',
    },
  ],
  DELIVERIES: [
    {
      priority: 'medium',
      message: 'Suivez vos livraisons en temps réel pour fidéliser vos clients.',
      action: 'Voir livraisons',
    },
    { priority: 'low', message: 'Optimisez vos zones de livraison pour réduire les coûts.' },
  ],
  EMPLOYEES: [
    {
      priority: 'medium',
      message: 'Assignez des rôles et permissions à vos employés.',
      action: 'Gérer employés',
    },
    {
      priority: 'low',
      message: 'Planifiez les horaires de vos équipes pour une meilleure organisation.',
    },
  ],
  CRM: [
    {
      priority: 'high',
      message: 'Segmentez vos clients pour des campagnes plus ciblées.',
      action: 'Créer segment',
    },
    {
      priority: 'medium',
      message: 'Suivez votre pipeline de ventes pour ne rien laisser passer.',
      action: 'Voir pipeline',
    },
  ],
  MARKETING: [
    {
      priority: 'medium',
      message: 'Lancez une campagne emailing pour relancer vos clients inactifs.',
      action: 'Créer campagne',
    },
    { priority: 'low', message: 'Analysez vos campagnes passées pour améliorer votre ROI.' },
  ],
  ADS: [
    {
      priority: 'medium',
      message: 'Créez une publicité ciblée pour attirer de nouveaux clients.',
      action: 'Créer une pub',
    },
    {
      priority: 'low',
      message: 'Consultez les statistiques de vos campagnes publicitaires.',
      action: 'Voir stats',
    },
  ],
  EVENTS: [
    {
      priority: 'medium',
      message: 'Créez un événement pour fédérer votre communauté.',
      action: 'Créer événement',
    },
    {
      priority: 'low',
      message: 'Activez la billetterie en ligne pour vos événements.',
      action: 'Configurer billetterie',
    },
  ],
  TRAINING: [
    {
      priority: 'medium',
      message: 'Publiez une nouvelle formation pour engager vos apprenants.',
      action: 'Créer formation',
    },
    {
      priority: 'low',
      message: 'Générez des certificats automatiques pour vos formations terminées.',
    },
  ],
};

export async function getModuleTips(businessId: string, moduleKey: string): Promise<any[]> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const activeModules = (business.modules || []) as string[];
  if (!activeModules.includes(moduleKey)) return [];

  const tips = MODULE_TIPS[moduleKey];
  if (!tips) return [];

  return tips.map((t) => ({ ...t, moduleKey }));
}

/**
 * Generate an LLM-powered smart tip for a specific module.
 * Falls back to rule-based tips if LLM unavailable.
 */
export async function generateSmartTip(
  businessId: string,
  moduleKey: string
): Promise<{ message: string; source: 'llm' | 'rule' }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  // Return rule-based tips
  const ruleTips = MODULE_TIPS[moduleKey];
  if (ruleTips && ruleTips.length > 0) {
    return { message: ruleTips[0].message, source: 'rule' };
  }

  return { message: 'Continuez à développer votre activité sur AfriBiz.', source: 'rule' };
}

/**
 * Generate an LLM-powered daily brief for a business.
 * Falls back to a metrics-based summary if LLM unavailable.
 */
export async function generateDailyBriefForBusiness(
  businessId: string
): Promise<{ brief: string; source: 'llm' | 'metrics' } | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const [todayOrders, , pendingDeliveries, , lowStockItems, upcomingBookings] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({
      where: { businessId, createdAt: { gte: todayStart } },
      _sum: { totalAmount: true },
    }),
    prisma.delivery?.count({ where: { businessId, status: 'PREPARING' as any } }) ||
      Promise.resolve(0),
    prisma.conversation?.count({
      where: { messages: { some: { readAt: null } }, participants: { has: businessId } },
    }) || Promise.resolve(0),
    prisma.product.findMany({
      where: { businessId, deletedAt: null, stock: { lte: 5 } },
      select: { name: true },
      take: 10,
    }),
    prisma.booking.count({ where: { providerId: businessId, startDate: { gte: today } } }) ||
      Promise.resolve(0),
  ]);

  const lowStockNames = lowStockItems.map((p: any) => p.name);

  // Metrics-based brief
  const parts: string[] = [];
  if (todayOrders > 0) parts.push(`${todayOrders} commande(s) aujourd'hui`);
  else parts.push("Aucune commande aujourd'hui");
  if (pendingDeliveries > 0) parts.push(`${pendingDeliveries} livraison(s) en attente`);
  if (upcomingBookings > 0) parts.push(`${upcomingBookings} réservation(s) à venir`);
  if (lowStockNames.length > 0) parts.push(`${lowStockNames.length} produit(s) en stock bas`);

  return {
    brief: parts.length > 0 ? parts.join('. ') + '.' : 'Aucune activité récente.',
    source: 'metrics',
  };
}

/**
 * Generate an LLM-powered tip for a specific module.
 * Falls back to rule-based tips if LLM unavailable or returns null.
 */
export async function generateLLMTip(
  businessId: string,
  moduleKey: string
): Promise<{ message: string; source: 'llm' | 'rule' }> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true, modules: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  if (moduleKey === 'DASHBOARD') {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [todayOrders, , pendingDeliveries, , lowStockItems, upcomingBookings] = await Promise.all(
      [
        prisma.order.count({ where: { businessId, createdAt: { gte: todayStart } } }),
        prisma.order.aggregate({
          where: { businessId, createdAt: { gte: todayStart } },
          _sum: { totalAmount: true },
        }),
        prisma.delivery?.count({ where: { businessId, status: 'PREPARING' as any } }) ||
          Promise.resolve(0),
        prisma.conversation?.count({
          where: { messages: { some: { readAt: null } }, participants: { has: businessId } },
        }) || Promise.resolve(0),
        prisma.product.findMany({
          where: { businessId, deletedAt: null, stock: { lte: 5 } },
          select: { name: true },
          take: 10,
        }),
        prisma.booking.count({ where: { providerId: businessId, startDate: { gte: today } } }) ||
          Promise.resolve(0),
      ]
    );

    const parts: string[] = [];
    if (todayOrders > 0) parts.push(`${todayOrders} commande(s) aujourd'hui`);
    else parts.push("Aucune commande aujourd'hui");
    if (pendingDeliveries > 0) parts.push(`${pendingDeliveries} livraison(s) en attente`);
    if (upcomingBookings > 0) parts.push(`${upcomingBookings} réservation(s) à venir`);
    if (lowStockItems.length > 0) parts.push(`${lowStockItems.length} produit(s) en stock bas`);

    return {
      message: parts.length > 0 ? parts.join('. ') + '.' : 'Aucune activité récente.',
      source: 'rule',
    };
  }

  const ruleTips = MODULE_TIPS[moduleKey];
  if (ruleTips && ruleTips.length > 0) {
    return { message: ruleTips[0].message, source: 'rule' };
  }

  return { message: 'Continuez à développer votre activité sur AfriBiz.', source: 'rule' };
}

/**
 * Warm the cache for common copilot queries.
 */
export async function warmCopilotCache(): Promise<void> {
  const TTL_SEC = 3600;
  const cacheKey = 'copilot:warmed';

  const alreadyWarmed = await cache.get<string>(cacheKey);
  if (alreadyWarmed) return;

  try {
    const businesses = await prisma.business.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, name: true },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    for (const b of businesses) {
      const tipsKey = `copilot:tips:${b.id}`;
      cache.set(tipsKey, await generateDailyTips(b.id), TTL_SEC * 1000).catch(() => {});

      const healthKey = `copilot:health:${b.id}`;
      cache.set(healthKey, await getBusinessHealth(b.id), TTL_SEC * 1000).catch(() => {});
    }

    await cache.set(cacheKey, 'true', TTL_SEC * 1000);
    logger.info(`Copilot cache warmed for ${businesses.length} businesses`);
  } catch (err) {
    logger.error('Copilot cache warming failed', err);
  }
}
