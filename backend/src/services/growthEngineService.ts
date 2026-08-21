import { prisma } from '../lib/db';
import { GrowthBriefType } from '@prisma/client';
import { publishMorningBriefGenerated, publishEveningSummaryGenerated } from '../events/publishers';
import { logger } from '../lib/logger';

const TODAY_START = () => new Date(new Date().setHours(0, 0, 0, 0));
const TODAY_END = () => new Date(new Date().setHours(23, 59, 59, 999));
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const YESTERDAY_START = () =>
  new Date(new Date(Date.now() - 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0));
const YESTERDAY_END = () =>
  new Date(new Date(Date.now() - 24 * 60 * 60 * 1000).setHours(23, 59, 59, 999));

// ──────────────────────────────────────────────
// MORNING BRIEF
// ──────────────────────────────────────────────

export async function generateMorningBrief(businessId: string) {
  const todayStart = TODAY_START();
  const todayEnd = TODAY_END();

  const [orders, bookings, payments, tasks, events, promotions, offerFlashes] = await Promise.all([
    prisma.order.findMany({
      where: {
        businessId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] },
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        scheduledAt: true,
        contactName: true,
      },
    }),
    prisma.booking.findMany({
      where: {
        businessId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        bookingNumber: true,
        status: true,
        title: true,
        startDate: true,
        customerName: true,
      },
    }),
    prisma.payment.findMany({
      where: { order: { businessId }, status: 'PENDING' },
      select: { id: true, amount: true, reference: true, createdAt: true },
    }),
    prisma.planningTask.findMany({
      where: {
        businessId,
        status: { in: ['TODO', 'IN_PROGRESS', 'VALIDATION'] },
        dueDate: { lte: todayEnd },
      },
      select: { id: true, title: true, status: true, priority: true, dueDate: true },
    }),
    prisma.event.findMany({
      where: { businessId, isPublished: true, startDate: { gte: todayStart, lte: todayEnd } },
      select: { id: true, title: true, startDate: true },
    }),
    prisma.promotion.findMany({
      where: { businessId, isActive: true, endsAt: { gte: todayStart } },
      select: { id: true, title: true, discountValue: true, endsAt: true },
    }),
    prisma.offerFlash.findMany({
      where: { businessId, isActive: true, endAt: { gte: todayStart } },
      select: { id: true, title: true, flashPrice: true, endAt: true },
    }),
  ]);

  const ownerId = (
    await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true } })
  )?.ownerId;
  const unreadConversations = ownerId
    ? await prisma.conversation.count({
        where: { participants: { has: ownerId }, messages: { some: { read: false } } },
      })
    : 0;

  // Satisfaction : moyenne des enquêtes (30j) + retours négatifs récents (7j),
  // en couvrant les DEUX sources (enquêtes ≤ 2★ et avis publics ≤ 2★).
  const satisfaction = await (async () => {
    try {
      const [agg, surveyLow, reviewLow] = await Promise.all([
        prisma.satisfactionSurveyResponse.aggregate({
          where: { businessId, createdAt: { gte: THIRTY_DAYS_AGO() } },
          _avg: { score: true },
          _count: { _all: true },
        }),
        prisma.satisfactionSurveyResponse.count({
          where: { businessId, createdAt: { gte: SEVEN_DAYS_AGO() }, score: { lte: 2 } },
        }),
        prisma.businessReview.count({
          where: {
            businessId,
            isActive: true,
            createdAt: { gte: SEVEN_DAYS_AGO() },
            rating: { lte: 2 },
          },
        }),
      ]);
      return {
        avg: agg._avg.score ?? null,
        total: agg._count._all || 0,
        recentLow: surveyLow + reviewLow,
      };
    } catch (e) {
      logger.warn('growth brief satisfaction failed', { error: (e as Error).message });
      return { avg: null, total: 0, recentLow: 0 };
    }
  })();

  // AfriScore : comparaison score actuel vs snapshot le plus ancien des 30 jours
  const afriScore = await (async () => {
    try {
      const [current, oldest] = await Promise.all([
        prisma.businessScore.findUnique({
          where: { businessId },
          select: { overallScore: true },
        }),
        prisma.scoreHistory.findFirst({
          where: { businessId, snapshotDate: { lte: THIRTY_DAYS_AGO() } },
          orderBy: { snapshotDate: 'asc' },
          select: { overallScore: true },
        }),
      ]);
      return {
        current: current?.overallScore ?? null,
        baseline: oldest?.overallScore ?? null,
      };
    } catch (e) {
      logger.warn('growth brief afriscore failed', { error: (e as Error).message });
      return { current: null, baseline: null };
    }
  })();

  // ── Pilier 3 : le copilote du quotidien ──
  // CA d'hier + clients à payer aujourd'hui + stock faible + commandes à livrer.
  const [yesterdayAgg, debtorsDue, lowStockProducts, deliveriesToShip] = await Promise.all([
    // 1. CA d'hier (total encaissé sur les commandes de la veille)
    prisma.order.aggregate({
      where: {
        businessId,
        deletedAt: null,
        createdAt: { gte: YESTERDAY_START(), lte: YESTERDAY_END() },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
    // 2. Clients qui doivent payer aujourd'hui (dettes échues ou dues au plus tard ce soir)
    prisma.debt.findMany({
      where: {
        businessId,
        deletedAt: null,
        status: { in: ['ACTIVE', 'PARTIALLY_PAID'] },
        dueDate: { lte: TODAY_END() },
      },
      select: {
        id: true,
        remainingAmount: true,
        dueDate: true,
        buyer: { select: { firstName: true, lastName: true, businessName: true } },
      },
      orderBy: { dueDate: 'asc' },
      take: 15,
    }),
    // 3. Produits en stock faible (seuil par produit, défaut 5)
    prisma.product.findMany({
      where: {
        businessId,
        deletedAt: null,
        isActive: true,
        OR: [{ stock: { lte: 5 } }, { lowStockThreshold: { gt: 0 } }],
      },
      select: { name: true, stock: true, lowStockThreshold: true },
      orderBy: { stock: 'asc' },
      take: 20,
    }),
    // 4. Commandes à livrer (livraisons en cours de préparation/affectation/route)
    prisma.delivery.findMany({
      where: { businessId, status: { in: ['PREPARING', 'ASSIGNED', 'IN_TRANSIT'] } },
      select: {
        id: true,
        deliveryNumber: true,
        status: true,
        zoneName: true,
        recipientName: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const revenueYesterday = Number(yesterdayAgg._sum.totalAmount || 0);
  const ordersYesterday = yesterdayAgg._count || 0;

  const lowStockFiltered = lowStockProducts.filter(
    (p: any) => p.stock <= (p.lowStockThreshold ?? 5)
  );
  const lowStockCount = lowStockFiltered.length;
  const lowStockNames = lowStockFiltered.slice(0, 5).map((p: any) => p.name);

  const debtsToCollectToday = debtorsDue.reduce((s, d) => s + Number(d.remainingAmount), 0);
  const debtorNames = debtorsDue
    .slice(0, 5)
    .map(
      (d: any) =>
        d.buyer?.businessName ||
        [d.buyer?.firstName, d.buyer?.lastName].filter(Boolean).join(' ') ||
        'Client'
    );

  const deliveryZones = [
    ...new Set(deliveriesToShip.map((d: any) => d.zoneName).filter(Boolean)),
  ] as string[];

  const advice = generateAdvice({
    orders,
    bookings,
    promotions,
    offerFlashes,
    satisfaction,
    afriScore,
    revenueYesterday,
    ordersYesterday,
    debtorsToday: debtorsDue.length,
    debtsToCollectToday,
    lowStockCount,
    lowStockNames,
    deliveriesToShip: deliveriesToShip.length,
  });

  const quickActions = generateQuickActions(
    orders.length,
    bookings.length,
    promotions.length,
    offerFlashes.length,
    { deliveriesToShip: deliveriesToShip.length, debtorsToday: debtorsDue.length, lowStockCount }
  );

  const metrics = {
    ordersToday: orders.length,
    ordersPending: orders.filter((o) => o.status === 'PENDING').length,
    bookingsToday: bookings.length,
    bookingsPending: bookings.filter((b) => b.status === 'PENDING').length,
    paymentsPending: payments.length,
    paymentsTotal: payments.reduce((s, p) => s + Number(p.amount), 0),
    tasksDue: tasks.length,
    tasksHighPriority: tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length,
    unreadMessages: unreadConversations,
    eventsToday: events.length,
    activePromotions: promotions.length + offerFlashes.length,
    // Pilier 3
    revenueYesterday,
    ordersYesterday,
    debtorsToday: debtorsDue.length,
    debtsToCollectToday,
    debtorNames,
    lowStockCount,
    lowStockNames,
    deliveriesToShip: deliveriesToShip.length,
    deliveryZones,
  };

  const brief = await prisma.growthBrief.create({
    data: {
      businessId,
      type: 'MORNING_BRIEF' as GrowthBriefType,
      metrics,
      advice,
      quickActions,
    },
  });

  if (ownerId) {
    publishMorningBriefGenerated({
      userId: ownerId,
      businessId,
      metrics: JSON.stringify(metrics),
      adviceCount: advice.length,
    });
  }

  return { ...brief, metrics, advice, quickActions };
}

// ──────────────────────────────────────────────
// EVENING SUMMARY
// ──────────────────────────────────────────────

export async function generateEveningSummary(businessId: string) {
  const yesterdayStart = YESTERDAY_START();
  const yesterdayEnd = YESTERDAY_END();
  const thirtyDaysAgo = THIRTY_DAYS_AGO();
  const todayStart = TODAY_START();

  const [
    pageViews,
    favorites,
    ordersToday,
    ordersYesterday,
    orders30d,
    bookingsToday,
    bookingsYesterday,
    reviews,
    newClientBuyers,
  ] = await Promise.all([
    prisma.businessPageView.count({ where: { businessId, viewedAt: { gte: todayStart } } }),
    prisma.favorite.count({ where: { product: { businessId }, createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { businessId, createdAt: { gte: todayStart } } }),
    prisma.order.count({
      where: { businessId, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
    }),
    prisma.order.count({ where: { businessId, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.count({ where: { businessId, createdAt: { gte: todayStart } } }),
    prisma.booking.count({
      where: { businessId, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
    }),
    prisma.businessReview.findMany({
      where: { businessId, createdAt: { gte: todayStart } },
      select: { id: true, rating: true, comment: true },
    }),
    prisma.order.groupBy({
      by: ['buyerId'],
      where: { businessId, createdAt: { gte: todayStart }, buyerId: { not: null } },
      _count: true,
    }),
  ]);
  const newClients = newClientBuyers.length;

  const improvementAxes = generateImprovementAxes({
    ordersToday,
    ordersYesterday,
    orders30d,
    bookingsToday,
    bookingsYesterday,
    reviews,
    pageViews,
    newClients,
  });

  const positiveReviews = reviews.filter((r) => r.rating >= 4).length;
  const negativeReviews = reviews.filter((r) => r.rating <= 2).length;

  const metrics = {
    pageViews,
    favoritesAdded: favorites,
    ordersToday,
    ordersYesterday,
    ordersDelta: ordersToday - ordersYesterday,
    orders30d,
    bookingsToday,
    bookingsYesterday,
    bookingsDelta: bookingsToday - bookingsYesterday,
    reviewsToday: reviews.length,
    positiveReviews,
    negativeReviews,
    newClients,
    avgRating:
      reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null,
  };

  const summary = await prisma.growthBrief.create({
    data: {
      businessId,
      type: 'EVENING_SUMMARY' as GrowthBriefType,
      metrics,
      advice: improvementAxes,
    },
  });

  const ownerId = (
    await prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true } })
  )?.ownerId;
  if (ownerId) {
    publishEveningSummaryGenerated({
      userId: ownerId,
      businessId,
      metrics: JSON.stringify(metrics),
      improvementsCount: improvementAxes.length,
    });
  }

  return { ...summary, metrics, improvementAxes };
}

// ──────────────────────────────────────────────
// SMART CALENDAR INSIGHTS
// ──────────────────────────────────────────────

export async function generateCalendarInsights(businessId: string) {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [orders, bookings] = await Promise.all([
    prisma.order.findMany({
      where: { businessId, createdAt: { gte: ninetyDaysAgo } },
      select: { createdAt: true, status: true },
    }),
    prisma.booking.findMany({
      where: { businessId, createdAt: { gte: ninetyDaysAgo } },
      select: { startDate: true, status: true },
    }),
  ]);

  const dayOfWeekCount: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const hourCount: Record<number, number> = {};

  for (const o of orders) {
    const d = new Date(o.createdAt);
    dayOfWeekCount[d.getDay()] = (dayOfWeekCount[d.getDay()] || 0) + 1;
    const h = d.getHours();
    hourCount[h] = (hourCount[h] || 0) + 1;
  }
  for (const b of bookings) {
    const d = new Date(b.startDate);
    dayOfWeekCount[d.getDay()] = (dayOfWeekCount[d.getDay()] || 0) + 1;
  }

  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const sortedDays = Object.entries(dayOfWeekCount).sort((a, b) => b[1] - a[1]);
  const sortedHours = Object.entries(hourCount).sort((a, b) => b[1] - a[1]);

  const busiestDay = sortedDays[0]
    ? { day: dayNames[Number(sortedDays[0][0])], count: sortedDays[0][1] }
    : null;
  const quietestDay = sortedDays[sortedDays.length - 1]
    ? {
        day: dayNames[Number(sortedDays[sortedDays.length - 1][0])],
        count: sortedDays[sortedDays.length - 1][1],
      }
    : null;
  const peakHour = sortedHours[0] ? `${sortedHours[0][0]}h` : null;

  const ordersLastWeek = orders.filter((o) => new Date(o.createdAt) >= SEVEN_DAYS_AGO()).length;
  const ordersPrevWeek = orders.filter(
    (o) =>
      new Date(o.createdAt) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
      new Date(o.createdAt) < SEVEN_DAYS_AGO()
  ).length;
  const trend =
    ordersPrevWeek > 0
      ? (((ordersLastWeek - ordersPrevWeek) / ordersPrevWeek) * 100).toFixed(0)
      : '0';

  const predictions = generatePredictions(busiestDay, quietestDay, Number(trend));

  return {
    busiestDay,
    quietestDay,
    peakHour,
    dayDistribution: dayOfWeekCount,
    hourlyDistribution: hourCount,
    trend: {
      direction: Number(trend) > 0 ? 'up' : Number(trend) < 0 ? 'down' : 'stable',
      percent: Math.abs(Number(trend)),
    },
    predictions,
  };
}

// ──────────────────────────────────────────────
// GET LATEST BRIEF
// ──────────────────────────────────────────────

export async function getLatestBrief(businessId: string, type: GrowthBriefType) {
  const brief = await prisma.growthBrief.findFirst({
    where: { businessId, type },
    orderBy: { createdAt: 'desc' },
  });
  return brief;
}

export async function getRecentBriefs(businessId: string, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.growthBrief.findMany({
    where: { businessId, createdAt: { gte: since } },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
}

// ──────────────────────────────────────────────
// BATCH GENERATION FOR ALL BUSINESSES
// ──────────────────────────────────────────────

export async function generateAllMorningBriefs() {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  let success = 0;
  let errors = 0;
  for (const b of businesses) {
    try {
      await generateMorningBrief(b.id);
      success++;
    } catch (e) {
      errors++;
      logger.error(`MorningBrief failed for ${b.id}`, e);
    }
  }
  return { total: businesses.length, success, errors };
}

export async function generateAllEveningSummaries() {
  const businesses = await prisma.business.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  let success = 0;
  let errors = 0;
  for (const b of businesses) {
    try {
      await generateEveningSummary(b.id);
      success++;
    } catch (e) {
      errors++;
      logger.error(`EveningSummary failed for ${b.id}`, e);
    }
  }
  return { total: businesses.length, success, errors };
}

// ──────────────────────────────────────────────
// ADVISORS & GENERATORS
// ──────────────────────────────────────────────

function generateAdvice({
  orders,
  bookings,
  promotions,
  offerFlashes,
  satisfaction,
  afriScore,
  revenueYesterday,
  ordersYesterday,
  debtorsToday,
  debtsToCollectToday,
  lowStockCount,
  lowStockNames,
  deliveriesToShip,
}: any): any[] {
  const advice: any[] = [];

  if (orders.length > 5) {
    advice.push({
      type: 'preparation',
      priority: 'high',
      message: `${orders.length} commandes aujourd'hui. Préparez-vous dès maintenant.`,
      action: 'Voir les commandes',
      link: '/dashboard/orders',
    });
  }

  const pendingOrders = orders.filter((o: any) => o.status === 'PENDING');
  if (pendingOrders.length > 2) {
    advice.push({
      type: 'confirmation',
      priority: 'high',
      message: `${pendingOrders.length} commandes en attente de confirmation. Répondez rapidement.`,
      action: 'Confirmer',
      link: '/dashboard/orders',
    });
  }

  const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING');
  if (pendingBookings.length > 0) {
    advice.push({
      type: 'booking',
      priority: 'high',
      message: `${pendingBookings.length} réservation(s) à confirmer aujourd'hui.`,
      action: 'Voir les réservations',
      link: '/dashboard/bookings',
    });
  }

  if (promotions.length === 0 && offerFlashes.length === 0) {
    advice.push({
      type: 'promotion',
      priority: 'medium',
      message: "Aucune promotion active. Publiez-en une avant 11h pour maximiser l'impact.",
      action: 'Créer une promotion',
      link: '/dashboard/promotions/new',
    });
  } else {
    const endingToday = [...promotions, ...offerFlashes].filter((p: any) => {
      const end = p.endsAt || p.endAt;
      return end && new Date(end) <= TODAY_END();
    });
    if (endingToday.length > 0) {
      advice.push({
        type: 'promotion-ending',
        priority: 'medium',
        message: `${endingToday.length} promotion(s) se terminent aujourd'hui. Préparez la relève.`,
        action: 'Voir les promotions',
        link: '/dashboard/promotions',
      });
    }
  }

  const now = new Date().getHours();
  if (now < 10) {
    advice.push({
      type: 'timing',
      priority: 'low',
      message: 'Publiez vos offres avant 11h pour toucher le maximum de clients.',
      action: 'Créer une publication',
      link: '/dashboard/stories',
    });
  }

  // Réputation : conseils basés sur la satisfaction mesurée (enquêtes)
  if (satisfaction) {
    if (satisfaction.total === 0) {
      advice.push({
        type: 'satisfaction',
        priority: 'low',
        message:
          'Pas encore de note de satisfaction. Les enquêtes partent automatiquement après chaque livraison et séjour terminé.',
        action: 'Voir mes commandes',
        link: '/dashboard/orders',
      });
    } else if (satisfaction.avg !== null && satisfaction.avg < 3) {
      advice.push({
        type: 'satisfaction',
        priority: 'high',
        message: `Satisfaction en baisse (${satisfaction.avg.toLocaleString('fr-FR')}/5). Analysez les retours négatifs pour corriger le tir.`,
        action: 'Voir la réputation',
        link: '/dashboard/crm',
      });
    } else if (satisfaction.recentLow > 0) {
      advice.push({
        type: 'satisfaction',
        priority: 'medium',
        message: `${satisfaction.recentLow} retour(s) négatif(s) récent(s) (avis ou enquête ≤ 2 étoiles). Répondez vite pour fidéliser.`,
        action: 'Voir la réputation',
        link: '/dashboard/crm',
      });
    }
  }

  // AfriScore : chute ≥ 50 points sur 30 jours → alerte santé du business
  if (afriScore && afriScore.current !== null && afriScore.baseline !== null) {
    const drop = afriScore.current - afriScore.baseline;
    if (drop >= 50) {
      advice.push({
        type: 'afriscore',
        priority: 'high',
        message: `Votre AfriScore a chuté de ${drop} points en 30 jours (${afriScore.current} → ${afriScore.baseline}). Analysez les causes : commandes, réservations, avis.`,
        action: 'Voir mon AfriScore',
        link: '/dashboard/afriscore',
      });
    }
  }

  // ── Pilier 3 : le copilote du quotidien ──

  // CA d'hier : signal de tendance (bonne nouvelle ou appel à l'action)
  if (revenueYesterday === 0 && ordersYesterday === 0) {
    advice.push({
      type: 'revenue-flat',
      priority: 'medium',
      message:
        'Aucune vente hier. Relancez vos clients fidèles ou lancez une petite promotion pour redémarrer la journée.',
      action: 'Créer une promotion',
      link: '/dashboard/promotions/new',
    });
  } else if (revenueYesterday > 0) {
    advice.push({
      type: 'revenue-yesterday',
      priority: 'low',
      message: `CA d'hier : ${revenueYesterday.toLocaleString('fr-FR')} FCFA (${ordersYesterday} commande(s)). ${ordersYesterday > 0 ? "Gardez le même rythme aujourd'hui." : ''}`,
    });
  }

  // Clients à payer aujourd'hui : l'argent à encaisser est le plus urgent
  if (debtorsToday > 0) {
    advice.push({
      type: 'debtors-due',
      priority: 'high',
      message: `${debtorsToday} client(s) doivent vous régler ${debtsToCollectToday.toLocaleString('fr-FR')} FCFA aujourd'hui. Envoyez les rappels avant la fermeture.`,
      action: 'Encaisser les créances',
      link: '/dashboard/debts-payments',
    });
  }

  // Commandes à livrer aujourd'hui
  if (deliveriesToShip > 0) {
    advice.push({
      type: 'deliveries',
      priority: 'high',
      message: `${deliveriesToShip} commande(s) à livrer (${deliveriesToShip > 1 ? 'préparation, affectation ou route' : 'en cours'}). Organisez vos livreurs dès maintenant.`,
      action: 'Voir les livraisons',
      link: '/dashboard/deliveries',
    });
  }

  // Stock faible : évitez la rupture avant le rush
  if (lowStockCount > 0) {
    const names = (lowStockNames || []).slice(0, 3).join(', ');
    advice.push({
      type: 'low-stock',
      priority: 'medium',
      message: `${lowStockCount} produit(s) en stock faible${names ? ` (${names}${lowStockCount > 3 ? ', …' : ''})` : ''}. Réapprovisionnez avant la rupture.`,
      action: 'Voir le stock',
      link: '/dashboard/products/stock-alerts',
    });
  }

  return advice;
}

function generateQuickActions(
  ordersCount: number,
  bookingsCount: number,
  _promosCount: number,
  _flashCount: number,
  daily?: { deliveriesToShip: number; debtorsToday: number; lowStockCount: number }
) {
  const actions: any[] = [];

  // Pilier 3 : les actions du jour passent en premier
  if (daily && daily.deliveriesToShip > 0) {
    actions.push({ label: 'Livrer les commandes', icon: 'truck', link: '/dashboard/deliveries' });
  }
  if (daily && daily.debtorsToday > 0) {
    actions.push({
      label: 'Encaisser les créances',
      icon: 'wallet',
      link: '/dashboard/debts-payments',
    });
  }
  if (daily && daily.lowStockCount > 0) {
    actions.push({
      label: 'Réapprovisionner',
      icon: 'package',
      link: '/dashboard/products/stock-alerts',
    });
  }

  actions.push({
    label: 'Créer une promotion',
    icon: 'percent',
    link: '/dashboard/promotions/new',
  });
  actions.push({ label: 'Créer un événement', icon: 'calendar', link: '/dashboard/events/new' });

  if (ordersCount > 0 || bookingsCount > 0) {
    actions.push({ label: 'Voir le planning', icon: 'clock', link: '/dashboard/planning' });
  }

  actions.push({ label: 'Messages non lus', icon: 'message', link: '/dashboard/messages' });

  return actions.slice(0, 6);
}

function generateImprovementAxes({
  ordersToday,
  ordersYesterday,
  orders30d,
  bookingsToday,
  bookingsYesterday,
  reviews,
  pageViews,
  newClients,
}: any): any[] {
  const axes: any[] = [];

  const avgOrdersDaily = Math.round(orders30d / 30);
  if (ordersToday < ordersYesterday) {
    axes.push({
      type: 'orders-decline',
      priority: ordersToday < avgOrdersDaily ? 'high' : 'medium',
      message: `Commandes en baisse (${ordersToday} aujourd'hui vs ${ordersYesterday} hier). Essayez une promotion.`,
      action: 'Créer une promotion',
      link: '/dashboard/promotions/new',
    });
  } else if (ordersToday > ordersYesterday) {
    axes.push({
      type: 'orders-growth',
      priority: 'low',
      message: `Commandes en hausse ! ${ordersToday} aujourd'hui (+${ordersToday - ordersYesterday} vs hier). Continuez ainsi.`,
    });
  }

  if (bookingsToday < bookingsYesterday && bookingsYesterday > 0) {
    axes.push({
      type: 'bookings-decline',
      priority: 'medium',
      message: `Moins de réservations aujourd'hui (${bookingsToday} vs ${bookingsYesterday} hier).`,
      action: 'Voir le planning',
      link: '/dashboard/planning',
    });
  }

  if (reviews.length > 0) {
    const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
    if (avg < 3) {
      axes.push({
        type: 'negative-reviews',
        priority: 'high',
        message: `${reviews.length} avis négatif(s) aujourd'hui (moyenne ${avg.toFixed(1)}/5). Répondez-y rapidement.`,
        action: 'Répondre',
        link: '/dashboard/reviews',
      });
    }
  }

  if (pageViews > 0 && ordersToday === 0) {
    axes.push({
      type: 'conversion',
      priority: 'high',
      message: `${pageViews} visiteurs aujourd'hui mais 0 commande. Optimisez votre page.`,
      action: 'Améliorer la page',
      link: '/dashboard/business/settings',
    });
  }

  if (newClients > 0) {
    axes.push({
      type: 'new-clients',
      priority: 'low',
      message: `${newClients} nouveau(x) client(s) aujourd'hui. Souhaitez-leur la bienvenue !`,
      action: 'Voir les clients',
      link: '/dashboard/clients',
    });
  }

  if (axes.length === 0) {
    axes.push({
      type: 'good-day',
      priority: 'low',
      message: 'Bonne journée ! Tous les indicateurs sont au vert.',
    });
  }

  return axes;
}

function generatePredictions(busiestDay: any, quietestDay: any, trendPercent: number) {
  const predictions: any[] = [];

  if (busiestDay) {
    predictions.push({
      type: 'busy-day',
      message: `${busiestDay.day} est votre jour le plus actif. Prévoyez des ressources supplémentaires.`,
    });
  }
  if (quietestDay && quietestDay.count >= 0) {
    predictions.push({
      type: 'quiet-day',
      message: `${quietestDay.day} est généralement plus calme. Profitez-en pour faire de la maintenance ou planifier.`,
    });
  }
  if (trendPercent > 20) {
    predictions.push({
      type: 'growth-warning',
      message: `Votre activité augmente rapidement (+${trendPercent}%). Pensez à recruter ou automatiser.`,
    });
  }
  if (trendPercent < -20) {
    predictions.push({
      type: 'decline-warning',
      message: `Votre activité baisse (${trendPercent}%). Lancez une action commerciale.`,
    });
  }

  return predictions;
}
