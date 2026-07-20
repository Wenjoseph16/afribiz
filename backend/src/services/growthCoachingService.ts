import { prisma } from '../lib/db';
import { BusinessModule, BusinessType } from '@prisma/client';

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

// ──────────────────────────────────────────────
// 1. GROWTH DETECTOR
// ──────────────────────────────────────────────

export interface GrowthTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  percent: number;
  direction: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

export interface GrowthOpportunity {
  type: string;
  label: string;
  description: string;
  potential: number; // 0-100
  action: string;
  link: string;
}

export interface GrowthDetectionResult {
  overallGrowthScore: number;
  trends: GrowthTrend[];
  opportunities: GrowthOpportunity[];
  summary: string;
}

export async function getGrowthDetection(businessId: string): Promise<GrowthDetectionResult> {
  const now = Date.now();
  const currentPeriodStart = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now - 60 * 24 * 60 * 60 * 1000);
  const previousPeriodEnd = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    currentOrders,
    previousOrders,
    currentBookings,
    previousBookings,
    currentPageViews,
    previousPageViews,
    currentReviews,
    previousReviews,
    currentProducts,
    previousProducts,
    currentFavorites,
    previousFavorites,
    score,
    scoreHistory,
    business,
    activeModules,
  ] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: currentPeriodStart } } }),
    prisma.order.count({
      where: { businessId, createdAt: { gte: previousPeriodStart, lt: previousPeriodEnd } },
    }),
    prisma.booking.count({ where: { businessId, createdAt: { gte: currentPeriodStart } } }),
    prisma.booking.count({
      where: { businessId, createdAt: { gte: previousPeriodStart, lt: previousPeriodEnd } },
    }),
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: currentPeriodStart } } }),
    prisma.businessPageView.count({
      where: { businessId, viewedAt: { gte: previousPeriodStart, lt: previousPeriodEnd } },
    }),
    prisma.businessReview.count({ where: { businessId, createdAt: { gte: currentPeriodStart } } }),
    prisma.businessReview.count({
      where: { businessId, createdAt: { gte: previousPeriodStart, lt: previousPeriodEnd } },
    }),
    prisma.product.count({
      where: {
        businessId,
        isActive: true,
        deletedAt: null,
        createdAt: { gte: currentPeriodStart },
      },
    }),
    prisma.product.count({
      where: {
        businessId,
        isActive: true,
        deletedAt: null,
        createdAt: { gte: previousPeriodStart, lt: previousPeriodEnd },
      },
    }),
    prisma.favorite.count({
      where: { product: { businessId }, createdAt: { gte: currentPeriodStart } },
    }),
    prisma.favorite.count({
      where: {
        product: { businessId },
        createdAt: { gte: previousPeriodStart, lt: previousPeriodEnd },
      },
    }),
    prisma.businessScore.findUnique({ where: { businessId } }),
    prisma.scoreHistory.findMany({
      where: { businessId },
      orderBy: { snapshotDate: 'desc' },
      take: 2,
    }),
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        name: true,
        type: true,
        modules: true,
        isPremium: true,
        rating: true,
        createdAt: true,
      },
    }),
    prisma.business
      .findUnique({ where: { id: businessId }, select: { modules: true } })
      .then((b) => b?.modules || []),
  ]);

  const calcTrend = (current: number, previous: number): GrowthTrend['direction'] => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const calcPercent = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const trends: GrowthTrend[] = [
    {
      metric: 'commandes',
      current: currentOrders,
      previous: previousOrders,
      change: currentOrders - previousOrders,
      percent: calcPercent(currentOrders, previousOrders),
      direction: calcTrend(currentOrders, previousOrders),
      status:
        currentOrders >= previousOrders
          ? 'good'
          : currentOrders === 0 && previousOrders > 0
            ? 'critical'
            : 'warning',
    },
    {
      metric: 'réservations',
      current: currentBookings,
      previous: previousBookings,
      change: currentBookings - previousBookings,
      percent: calcPercent(currentBookings, previousBookings),
      direction: calcTrend(currentBookings, previousBookings),
      status: currentBookings >= previousBookings ? 'good' : 'warning',
    },
    {
      metric: 'visiteurs',
      current: currentPageViews,
      previous: previousPageViews,
      change: currentPageViews - previousPageViews,
      percent: calcPercent(currentPageViews, previousPageViews),
      direction: calcTrend(currentPageViews, previousPageViews),
      status: currentPageViews >= previousPageViews ? 'good' : 'warning',
    },
    {
      metric: 'avis',
      current: currentReviews,
      previous: previousReviews,
      change: currentReviews - previousReviews,
      percent: calcPercent(currentReviews, previousReviews),
      direction: calcTrend(currentReviews, previousReviews),
      status: 'good',
    },
    {
      metric: 'nouveaux produits',
      current: currentProducts,
      previous: previousProducts,
      change: currentProducts - previousProducts,
      percent: calcPercent(currentProducts, previousProducts),
      direction: calcTrend(currentProducts, previousProducts),
      status: currentProducts >= previousProducts ? 'good' : 'warning',
    },
    {
      metric: 'favoris',
      current: currentFavorites,
      previous: previousFavorites,
      change: currentFavorites - previousFavorites,
      percent: calcPercent(currentFavorites, previousFavorites),
      direction: calcTrend(currentFavorites, previousFavorites),
      status: currentFavorites >= previousFavorites ? 'good' : 'warning',
    },
  ];

  // Score evolution
  if (scoreHistory.length >= 2) {
    const latest = scoreHistory[0].overallScore;
    const older = scoreHistory[1].overallScore;
    trends.push({
      metric: 'score AfriScore',
      current: latest,
      previous: older,
      change: latest - older,
      percent: calcPercent(latest, older),
      direction: calcTrend(latest, older),
      status: latest >= older ? 'good' : 'warning',
    });
  }

  // Detect opportunities
  const opportunities: GrowthOpportunity[] = [];

  if (currentOrders === 0 && currentPageViews > 50) {
    opportunities.push({
      type: 'conversion',
      label: 'Faible taux de conversion',
      description: `${currentPageViews} visiteurs mais 0 commande. Optimisez votre page et vos fiches produits.`,
      potential: 85,
      action: 'Optimiser',
      link: '/dashboard/business/edit',
    });
  }

  if (!activeModules.includes('PROMOTIONS') && currentOrders > 0) {
    opportunities.push({
      type: 'module',
      label: 'Activer les promotions',
      description:
        'Vous avez des commandes mais pas de module promo. Augmentez vos ventes avec des offres.',
      potential: 75,
      action: 'Activer',
      link: '/dashboard/modules',
    });
  }

  if (currentOrders > 0 && currentOrders >= previousOrders + 5) {
    opportunities.push({
      type: 'growth',
      label: 'Croissance des commandes',
      description: `Commandes en hausse de ${trends[0].percent}%. Capitalisez avec des offres flash.`,
      potential: 70,
      action: 'Créer une offre flash',
      link: '/dashboard/offer-flash/new',
    });
  }

  if (business && business.rating >= 4 && !activeModules.includes('SUBSCRIPTIONS')) {
    opportunities.push({
      type: 'loyalty',
      label: 'Fidélisez vos clients',
      description:
        'Vous avez une bonne note. Mettez en place un programme de fidélité ou des abonnements.',
      potential: 80,
      action: 'Configurer',
      link: '/dashboard/subscriptions',
    });
  }

  if (currentPageViews > 100 && currentFavorites === 0) {
    opportunities.push({
      type: 'engagement',
      label: 'Aucun favori',
      description: "Du trafic mais aucun favori. Améliorez vos fiches pour inciter à l'action.",
      potential: 60,
      action: 'Améliorer les fiches',
      link: '/dashboard/products',
    });
  }

  if (score && score.profileScore < 100) {
    opportunities.push({
      type: 'profile',
      label: 'Profil incomplet',
      description: `Score profil: ${score.profileScore}/200. Un profil complet attire plus de clients.`,
      potential: 90,
      action: 'Compléter',
      link: '/dashboard/business/edit',
    });
  }

  // Calculate overall growth score
  const scores = trends.map((t) => {
    if (t.status === 'good') return t.direction === 'up' ? 90 : 70;
    if (t.status === 'warning') return 40;
    return 10;
  });
  const overallGrowthScore =
    scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  // Generate summary
  const upTrends = trends.filter((t) => t.direction === 'up').length;
  const downTrends = trends.filter((t) => t.direction === 'down').length;
  const summary =
    downTrends > upTrends
      ? `${downTrends} indicateur(s) en baisse. Concentrez-vous sur les actions suggérées pour inverser la tendance.`
      : upTrends > 0
        ? `${upTrends} indicateur(s) en hausse ! Continuez vos efforts et explorez les opportunités ci-dessous.`
        : 'Activité stable. Essayez de nouveaux modules ou campagnes pour accélérer.';

  return { overallGrowthScore, trends, opportunities, summary };
}

// ──────────────────────────────────────────────
// 2. COACH
// ──────────────────────────────────────────────

export interface CoachingTip {
  category: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  action?: string;
  link?: string;
}

export interface CoachResult {
  businessId: string;
  businessName: string;
  healthScore: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'critical';
  tips: CoachingTip[];
  completedActions: number;
  totalActions: number;
  score?: { overall: number; category: string } | null;
}

export async function getCoachDashboard(businessId: string): Promise<CoachResult> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { score: true },
  });
  if (!business) throw new Error('Business not found');

  const sevenDaysAgo = SEVEN_DAYS_AGO();
  const thirtyDaysAgo = THIRTY_DAYS_AGO();

  const [
    orders30d,
    orders7d,
    bookings30d,
    reviews30d,
    pageViews30d,
    totalProducts,
    totalServices,
    activePromos,
  ] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.count({ where: { businessId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.booking.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { businessId, createdAt: { gte: sevenDaysAgo } } }),
    prisma.businessReview.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: thirtyDaysAgo } } }),
    prisma.product.count({ where: { businessId, isActive: true, deletedAt: null } }),
    prisma.service.count({ where: { businessId, isActive: true, deletedAt: null } }),
    prisma.promotion.count({ where: { businessId, isActive: true } }),
  ]);

  const tips: CoachingTip[] = [];

  // === PROFILE ===
  if (!business.logo)
    tips.push({
      category: 'profil',
      priority: 'high',
      message: 'Ajoutez un logo professionnel.',
      action: 'Ajouter',
      link: '/dashboard/business/edit',
    });
  if (!business.description)
    tips.push({
      category: 'profil',
      priority: 'high',
      message: 'Rédigez une description de votre entreprise.',
      action: 'Rédiger',
      link: '/dashboard/business/edit',
    });
  if (!business.address)
    tips.push({
      category: 'profil',
      priority: 'medium',
      message: 'Ajoutez votre adresse pour le référencement local.',
      action: 'Ajouter',
      link: '/dashboard/business/edit',
    });
  if (!business.phone)
    tips.push({
      category: 'profil',
      priority: 'medium',
      message: 'Ajoutez un numéro de téléphone.',
      action: 'Ajouter',
      link: '/dashboard/business/edit',
    });
  if (!business.email)
    tips.push({
      category: 'profil',
      priority: 'medium',
      message: 'Renseignez un email de contact.',
      action: 'Ajouter',
      link: '/dashboard/business/edit',
    });
  if (!business.city)
    tips.push({
      category: 'profil',
      priority: 'low',
      message: 'Indiquez votre ville pour le référencement.',
      action: 'Ajouter',
      link: '/dashboard/business/edit',
    });
  if (!business.whatsapp)
    tips.push({
      category: 'profil',
      priority: 'medium',
      message: 'Ajoutez WhatsApp pour un contact rapide.',
      action: 'Ajouter',
      link: '/dashboard/business/edit',
    });

  // === PRODUCTS ===
  if (totalProducts === 0 && business.modules.includes('PRODUCTS')) {
    tips.push({
      category: 'produits',
      priority: 'high',
      message: 'Module Produits activé mais aucun produit publié.',
      action: 'Ajouter un produit',
      link: '/dashboard/products/new',
    });
  } else if (totalProducts === 0) {
    tips.push({
      category: 'produits',
      priority: 'medium',
      message: 'Publiez vos premiers produits pour commencer à vendre en ligne.',
      action: 'Ajouter un produit',
      link: '/dashboard/products/new',
    });
  }

  // === SERVICES ===
  if (totalServices === 0 && business.modules.includes('SERVICES')) {
    tips.push({
      category: 'services',
      priority: 'high',
      message: 'Module Services activé mais aucun service publié.',
      action: 'Ajouter un service',
      link: '/dashboard/services/new',
    });
  }

  // === ACTIVITY ===
  if (orders30d === 0 && business.createdAt < thirtyDaysAgo) {
    tips.push({
      category: 'activité',
      priority: 'high',
      message: 'Aucune commande depuis 30 jours. Lancez une promotion.',
      action: 'Créer une promotion',
      link: '/dashboard/promotions/new',
    });
  }
  if (orders7d < orders30d / 4 && orders30d > 0) {
    tips.push({
      category: 'activité',
      priority: 'medium',
      message: 'Ralentissement cette semaine. Relancez vos clients inactifs.',
      action: 'Voir les clients',
      link: '/dashboard/clients',
    });
  }
  if (
    bookings30d === 0 &&
    business.createdAt < thirtyDaysAgo &&
    business.modules.includes('BOOKINGS')
  ) {
    tips.push({
      category: 'réservations',
      priority: 'medium',
      message: 'Aucune réservation depuis 30 jours. Vérifiez vos créneaux.',
      action: 'Configurer',
      link: '/dashboard/planning',
    });
  }

  // === REVIEWS ===
  if (reviews30d > 0) {
    const negativeReviews = await prisma.businessReview.findMany({
      where: { businessId, createdAt: { gte: thirtyDaysAgo }, rating: { lte: 2 } },
      select: { id: true },
    });
    if (negativeReviews.length > 0) {
      tips.push({
        category: 'avis',
        priority: 'high',
        message: `${negativeReviews.length} avis négatif(s) récemment. Répondez-y.`,
        action: 'Répondre',
        link: '/dashboard/reviews',
      });
    }
  }

  // === PROMOTIONS ===
  if (activePromos === 0 && orders30d > 5) {
    tips.push({
      category: 'promotions',
      priority: 'medium',
      message: 'Aucune promotion active alors que vous avez du trafic.',
      action: 'Créer une promotion',
      link: '/dashboard/promotions/new',
    });
  }

  // === TRAFFIC ===
  if (pageViews30d > 100 && orders30d < 3) {
    tips.push({
      category: 'conversion',
      priority: 'high',
      message: `${pageViews30d} visites mais seulement ${orders30d} commandes. Optimisez votre page.`,
      action: 'Améliorer',
      link: '/dashboard/business/edit',
    });
  }

  // === SCORE ===
  if (business.score) {
    if (business.score.completionPct < 50) {
      tips.push({
        category: 'score',
        priority: 'high',
        message: `Profil complété à ${business.score.completionPct.toFixed(0)}%. Améliorez votre AfriScore.`,
        action: 'Compléter',
        link: '/dashboard/business/edit',
      });
    }
    if (business.score.overallScore >= 600) {
      tips.push({
        category: 'croissance',
        priority: 'low',
        message: 'Excellent AfriScore ! Pensez aux publicités AfriBiz Ads.',
        action: 'Créer une campagne',
        link: '/dashboard/ads',
      });
    }
  }

  // === MODULES ===
  const recommended = getRecommendedModulesForType(business.type as BusinessType);
  const missingModules = recommended.filter((m) => !business.modules.includes(m));
  if (missingModules.length > 0) {
    tips.push({
      category: 'modules',
      priority: 'medium',
      message: `${missingModules.length} module(s) recommandé(s) non activé(s) : ${missingModules.join(', ')}.`,
      action: 'Voir les modules',
      link: '/dashboard/modules',
    });
  }

  // === SOCIAL ===
  const socialFields = [business.facebook, business.instagram, business.twitter, business.linkedin];
  if (socialFields.every((s) => !s)) {
    tips.push({
      category: 'réseaux',
      priority: 'low',
      message: 'Aucun réseau social lié. Connectez vos comptes pour plus de visibilité.',
      action: 'Connecter',
      link: '/dashboard/settings',
    });
  }

  // === COMPLETED ACTIONS COUNT ===
  const completedActions = [
    !!business.logo,
    !!business.description,
    !!business.address,
    !!business.phone,
    !!business.city,
    totalProducts > 0,
    totalServices > 0 || !business.modules.includes('SERVICES'),
    activePromos > 0,
    !!business.whatsapp,
    socialFields.some((s) => !!s),
  ].filter(Boolean).length;
  const totalActions = 10;

  // Health score
  const score = business.score;
  const healthScore = score
    ? Math.round(
        (score.overallScore / 10) * 0.5 +
          Math.min(orders30d * 5, 200) * 0.2 +
          Math.min(pageViews30d / 10, 100) * 0.2 +
          (totalProducts > 0 ? 100 : 0) * 0.1
      )
    : 0;

  let healthStatus: CoachResult['healthStatus'] = 'fair';
  if (healthScore >= 80) healthStatus = 'excellent';
  else if (healthScore >= 60) healthStatus = 'good';
  else if (healthScore >= 40) healthStatus = 'fair';
  else healthStatus = 'critical';

  return {
    businessId,
    businessName: business.name,
    healthScore,
    healthStatus,
    tips,
    completedActions,
    totalActions,
    score: business.score
      ? { overall: business.score.overallScore, category: business.score.category }
      : null,
  };
}

// ──────────────────────────────────────────────
// 3. MODULE ADVISOR
// ──────────────────────────────────────────────

const MODULE_DESCRIPTIONS: Record<string, { label: string; description: string; icon: string }> = {
  PRODUCTS: {
    label: 'Produits',
    description: 'Vendre des produits physiques ou numériques',
    icon: 'package',
  },
  SERVICES: {
    label: 'Services',
    description: 'Proposer des prestations de service',
    icon: 'briefcase',
  },
  MENU: { label: 'Menu', description: 'Carte de restaurant ou menu digital', icon: 'utensils' },
  ROOMS: { label: 'Chambres', description: "Gestion de chambres d'hôtel ou location", icon: 'bed' },
  BOOKINGS: {
    label: 'Réservations',
    description: 'Prise de rendez-vous et réservations',
    icon: 'calendar',
  },
  ORDERS: {
    label: 'Commandes',
    description: 'Gestion des commandes en ligne',
    icon: 'shopping-cart',
  },
  QUOTES_INVOICES: {
    label: 'Devis & Factures',
    description: 'Créer et gérer devis et factures',
    icon: 'file-text',
  },
  DEBTS_PAYMENTS: {
    label: 'Dettes & Paiements',
    description: 'Suivi des dettes et échéances',
    icon: 'credit-card',
  },
  PROMOTIONS: {
    label: 'Promotions',
    description: 'Offres spéciales et réductions',
    icon: 'percent',
  },
  PLANNING: {
    label: 'Planning',
    description: 'Planification des tâches et équipes',
    icon: 'clock',
  },
  EMPLOYEES: { label: 'Employés', description: 'Gestion des employés et présences', icon: 'users' },
  PORTFOLIO: {
    label: 'Portfolio',
    description: 'Galerie de réalisations et projets',
    icon: 'image',
  },
  SUBSCRIPTIONS: {
    label: 'Abonnements',
    description: 'Programme de fidélité et abonnements',
    icon: 'repeat',
  },
  DELIVERIES: {
    label: 'Livraisons',
    description: 'Gestion des livraisons et livreurs',
    icon: 'truck',
  },
  EVENTS: {
    label: 'Événements',
    description: "Organisation et vente d'événements",
    icon: 'calendar-check',
  },
  RENTALS: {
    label: 'Locations',
    description: 'Gestion de locations (véhicules, matériel)',
    icon: 'key',
  },
  DOCUMENTS: {
    label: 'Documents',
    description: 'Gestion documentaire et contrats',
    icon: 'folder',
  },
  PARTNERS: {
    label: 'Partenaires',
    description: 'Gestion des partenariats et contrats',
    icon: 'handshake',
  },
  DISPUTES: {
    label: 'Litiges',
    description: 'Gestion des litiges et médiation',
    icon: 'alert-triangle',
  },
  MODULE_MARKETPLACE: {
    label: 'Marketplace',
    description: 'Modules tiers depuis la marketplace',
    icon: 'shopping-bag',
  },
  ADVANCED_TASKS: {
    label: 'Tâches avancées',
    description: 'Gestion avancée des tâches et workflows',
    icon: 'check-square',
  },
};

const BUSINESS_CATEGORY_MODULES: Record<string, BusinessModule[]> = {
  boutique: ['PRODUCTS', 'ORDERS', 'PROMOTIONS', 'QUOTES_INVOICES', 'DELIVERIES', 'SUBSCRIPTIONS'],
  alimentation: ['MENU', 'ORDERS', 'BOOKINGS', 'PROMOTIONS', 'DELIVERIES', 'EMPLOYEES', 'PLANNING'],
  hebergement: ['ROOMS', 'BOOKINGS', 'PROMOTIONS', 'SERVICES', 'EMPLOYEES', 'PLANNING', 'EVENTS'],
  beaute: ['SERVICES', 'BOOKINGS', 'PRODUCTS', 'PROMOTIONS', 'SUBSCRIPTIONS'],
  freelance: ['SERVICES', 'BOOKINGS', 'PORTFOLIO', 'QUOTES_INVOICES'],
  agence: ['SERVICES', 'BOOKINGS', 'PORTFOLIO', 'QUOTES_INVOICES', 'SUBSCRIPTIONS'],
  cabinet: ['SERVICES', 'BOOKINGS', 'QUOTES_INVOICES', 'PORTFOLIO', 'SUBSCRIPTIONS'],
  sante: ['SERVICES', 'BOOKINGS', 'PRODUCTS', 'ORDERS'],
  formation: ['SERVICES', 'BOOKINGS', 'SUBSCRIPTIONS', 'EVENTS'],
  artisan: ['PRODUCTS', 'PORTFOLIO', 'ORDERS', 'PROMOTIONS', 'QUOTES_INVOICES'],
  transport: ['SERVICES', 'BOOKINGS', 'ORDERS', 'DELIVERIES'],
  evenements: ['EVENTS', 'BOOKINGS', 'PROMOTIONS', 'SERVICES'],
  location: ['PRODUCTS', 'SERVICES', 'QUOTES_INVOICES', 'PORTFOLIO', 'RENTALS', 'BOOKINGS'],
  association: ['EVENTS', 'SERVICES', 'DOCUMENTS', 'SUBSCRIPTIONS'],
  entreprise: ['PRODUCTS', 'SERVICES', 'QUOTES_INVOICES', 'PROMOTIONS', 'SUBSCRIPTIONS'],
};

function getBusinessCategory(type: BusinessType): string {
  if (
    [
      'BOUTIQUE_VETEMENTS',
      'BOUTIQUE_CHAUSSURES',
      'BOUTIQUE_COSMETIQUES',
      'BOUTIQUE_INFORMATIQUE',
      'BOUTIQUE_TELEPHONIQUE',
      'BOUTIQUE_ELECTRONIQUE',
      'SUPERMARCHE',
      'EPICERIE',
      'PHARMACIE',
      'LIBRAIRIE',
      'PAPETERIE',
    ].includes(type)
  )
    return 'boutique';

  if (['RESTAURANT', 'FAST_FOOD', 'PATISSERIE', 'BOULANGERIE', 'CAFE', 'BAR'].includes(type))
    return 'alimentation';
  if (['HOTEL', 'AUBERGE', 'MAISON_D_HOTES', 'LOCATION_SAISONNIERE'].includes(type))
    return 'hebergement';
  if (['SALON_COIFFURE', 'SALON_BEAUTE', 'SPA', 'INSTITUT_ESTHETIQUE'].includes(type))
    return 'beaute';
  if (['PHOTOGRAPHE', 'VIDEOASTE', 'FREELANCE', 'DEVELOPPEUR', 'DESIGNER_GRAPHIQUE'].includes(type))
    return 'freelance';
  if (
    ['AGENCE_MARKETING', 'AGENCE_COMMUNICATION', 'AGENCE_DIGITALE', 'AGENCE_IMMOBILIERE'].includes(
      type
    )
  )
    return 'agence';
  if (['CABINET_JURIDIQUE', 'CABINET_COMPTABLE', 'CABINET_CONSEIL'].includes(type))
    return 'cabinet';
  if (['CABINET_MEDICAL', 'CLINIQUE'].includes(type)) return 'sante';
  if (['CENTRE_FORMATION', 'ECOLE_PRIVEE'].includes(type)) return 'formation';
  if (
    ['ARTISAN', 'MENUISIER', 'MACON', 'PLOMBIER', 'ELECTRICIEN', 'SOUDEUR', 'MECANICIEN'].includes(
      type
    )
  )
    return 'artisan';
  if (['TRANSPORT', 'LIVRAISON'].includes(type)) return 'transport';
  if (['ORGANISATION_EVENEMENTS'].includes(type)) return 'evenements';
  if (['LOCATION_VEHICULES', 'LOCATION_EQUIPEMENTS', 'LOCATION_ENGINS'].includes(type))
    return 'location';
  if (['ASSOCIATION', 'ONG'].includes(type)) return 'association';
  if (
    ['ENTREPRISE_AGRICOLE', 'ELEVAGE', 'IMPORT_EXPORT', 'ENTREPRISE_PRIVEE', 'AUTRE'].includes(type)
  )
    return 'entreprise';

  return 'entreprise';
}

function getRecommendedModulesForType(type: BusinessType): BusinessModule[] {
  const category = getBusinessCategory(type);
  return BUSINESS_CATEGORY_MODULES[category] || ['PRODUCTS', 'SERVICES', 'ORDERS', 'PROMOTIONS'];
}

export interface ModuleRecommendation {
  module: BusinessModule;
  label: string;
  description: string;
  icon: string;
  isActive: boolean;
  priority: 'essential' | 'recommended' | 'optional';
  reason: string;
  score: number;
}

function isBoutique(type: BusinessType): boolean {
  return [
    'BOUTIQUE_VETEMENTS',
    'BOUTIQUE_CHAUSSURES',
    'BOUTIQUE_COSMETIQUES',
    'BOUTIQUE_INFORMATIQUE',
    'BOUTIQUE_TELEPHONIQUE',
    'BOUTIQUE_ELECTRONIQUE',
    'SUPERMARCHE',
    'EPICERIE',
    'PHARMACIE',
    'LIBRAIRIE',
    'PAPETERIE',
  ].includes(type);
}
function isRestauration(type: BusinessType): boolean {
  return ['RESTAURANT', 'FAST_FOOD', 'PATISSERIE', 'BOULANGERIE', 'CAFE', 'BAR'].includes(type);
}
function isServicePro(type: BusinessType): boolean {
  return [
    'SALON_COIFFURE',
    'SALON_BEAUTE',
    'SPA',
    'INSTITUT_ESTHETIQUE',
    'FREELANCE',
    'DEVELOPPEUR',
    'DESIGNER_GRAPHIQUE',
    'PHOTOGRAPHE',
    'VIDEOASTE',
    'COACH_PROFESSIONNEL',
    'CONSULTANT',
    'CABINET_JURIDIQUE',
    'CABINET_COMPTABLE',
    'CABINET_CONSEIL',
  ].includes(type);
}
function isEvenements(type: BusinessType): boolean {
  return ['ORGANISATION_EVENEMENTS', 'ASSOCIATION', 'ONG'].includes(type);
}

export async function getModuleRecommendations(
  businessId: string
): Promise<ModuleRecommendation[]> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { type: true, modules: true },
  });
  if (!business) throw new Error('Business not found');

  const bizType = business.type as BusinessType;
  const category = getBusinessCategory(bizType);
  const recommended = BUSINESS_CATEGORY_MODULES[category] || [
    'PRODUCTS',
    'SERVICES',
    'ORDERS',
    'PROMOTIONS',
  ];

  const hasProducts = await prisma.product
    .count({ where: { businessId, isActive: true, deletedAt: null } })
    .then((c) => c > 0);
  const hasServices = await prisma.service
    .count({ where: { businessId, isActive: true, deletedAt: null } })
    .then((c) => c > 0);
  const orders30d = await prisma.order.count({
    where: { businessId, createdAt: { gte: THIRTY_DAYS_AGO() } },
  });

  const allModules = [
    ...new Set([
      ...recommended,
      ...Object.keys(MODULE_DESCRIPTIONS).map((k) => k as BusinessModule),
    ]),
  ];

  return allModules
    .map((m) => {
      const info = MODULE_DESCRIPTIONS[m];
      const isActive = business.modules.includes(m);
      let priority: ModuleRecommendation['priority'] = 'optional';
      let reason = '';

      if (recommended.includes(m)) {
        priority = 'recommended';
        reason = "Recommandé pour votre type d'activité.";
      }

      if (m === 'PRODUCTS' && isBoutique(bizType)) {
        priority = 'essential';
        reason = 'Essentiel pour la vente de produits.';
      }
      if (m === 'MENU' && isRestauration(bizType)) {
        priority = 'essential';
        reason = 'Essentiel pour la restauration.';
      }
      if (m === 'ORDERS' && (isBoutique(bizType) || isRestauration(bizType))) {
        priority = 'essential';
        reason = 'Essentiel pour la gestion des commandes.';
      }
      if (m === 'BOOKINGS' && isServicePro(bizType)) {
        priority = 'essential';
        reason = 'Essentiel pour la prise de rendez-vous.';
      }
      if (
        m === 'ROOMS' &&
        ['HOTEL', 'AUBERGE', 'MAISON_D_HOTES', 'LOCATION_SAISONNIERE'].includes(bizType)
      ) {
        priority = 'essential';
        reason = 'Essentiel pour la gestion des chambres.';
      }
      if (m === 'SERVICES' && isServicePro(bizType)) {
        priority = 'essential';
        reason = 'Essentiel pour votre activité de service.';
      }
      if (m === 'EVENTS' && isEvenements(bizType)) {
        priority = 'essential';
        reason = "Essentiel pour l'organisation d'événements.";
      }

      if (m === 'PROMOTIONS' && orders30d > 3 && !isActive) {
        priority = 'recommended';
        reason = 'Vous avez du volume, maximisez avec des promotions.';
      }
      if (m === 'DELIVERIES' && hasProducts && !isActive) {
        priority = 'recommended';
        reason = 'Vous vendez des produits, ajoutez la livraison.';
      }
      if (m === 'SUBSCRIPTIONS' && (hasProducts || hasServices) && !isActive) {
        priority = 'recommended';
        reason = 'Fidélisez vos clients avec des abonnements.';
      }
      if (m === 'PORTFOLIO' && hasServices && !isActive) {
        priority = 'recommended';
        reason = 'Montrez vos réalisations pour rassurer vos clients.';
      }
      if (m === 'EMPLOYEES' && isRestauration(bizType) && !isActive) {
        priority = 'recommended';
        reason = 'Gérez votre équipe et les plannings.';
      }

      if (isActive && recommended.includes(m)) {
        reason = 'Module actif et recommandé ✓';
      }
      if (!recommended.includes(m) && !isActive) {
        reason = 'Module complémentaire. Activez-le si pertinent.';
      }

      const score = isActive
        ? 100
        : priority === 'essential'
          ? 80
          : priority === 'recommended'
            ? 60
            : 30;

      return {
        module: m,
        label: info?.label || m,
        description: info?.description || '',
        icon: info?.icon || 'box',
        isActive,
        priority,
        reason,
        score,
      };
    })
    .sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? 1 : -1;
      const p = { essential: 3, recommended: 2, optional: 1 };
      return (p[b.priority] || 0) - (p[a.priority] || 0);
    });
}
