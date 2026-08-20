import { Prisma, BusinessType, BusinessModule, BusinessVerificationStatus } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { getPublicPortfolio } from './portfolio';
import { resolveBusinessModules } from '../lib/businessModules';
import {
  publishOnboardingCompleted,
  publishBusinessRegistered,
  publishBusinessKycSubmitted,
  publishReviewResponse,
  publishReviewPublished,
} from '../events/publishers';
import { trackAnalyticsEvent } from './analyticsService';
import { DEFAULT_PLAN_ID } from './planAccessService';
import * as afriScoreService from './afriScoreService';

export async function getPublicBusiness(slug: string) {
  const business = await prisma.business.findFirst({
    // Accepte slug OU id (les liens marketplace peuvent pointer un business sans slug)
    where: { OR: [{ slug }, { id: slug }], isActive: true, deletedAt: null },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      hours: { orderBy: { day: 'asc' } },
      paymentMethods: { where: { isActive: true } },
      deliveryZones: { where: { isActive: true } },
      moduleAssignments: {
        where: { status: 'ACTIVE' },
        select: { module: true },
      },
    },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  // Analytics — vue de la page publique (fire-and-forget, non-bloquant)
  trackAnalyticsEvent({
    businessId: business.id,
    type: 'page_view',
    category: 'navigation',
    eventName: 'BUSINESS_VIEWED',
  }).catch(() => {});

  // Modules : la vraie source de vérité = moduleAssignments (le champ modules est @deprecated et souvent vide).
  // NB : quand des assignments ACTIVE existent, ils font foi — le champ déprécié n'est utilisé qu'en secours
  // pour les business historiques sans assignments.
  const { moduleAssignments, ...businessRest } = business;
  const activeModules = (moduleAssignments || []).map((a) => a.module as BusinessModule);
  const mergedModules =
    activeModules.length > 0
      ? activeModules
      : (businessRest.modules as BusinessModule[] | undefined) || [];

  return {
    ...businessRest,
    modules: mergedModules,
    description: businessRest.description || businessRest.shortDescription,
    mission: businessRest.mission,
    vision: business.vision,
    foundedYear: business.foundedYear,
    owner: business.owner
      ? {
          ...business.owner,
          yearsOfExperience: business.experience,
          skills: business.skills,
          certifications: business.certifications,
        }
      : null,
  };
}

async function getBusinessIdBySlug(slug: string) {
  const business = await prisma.business.findFirst({
    where: { OR: [{ slug }, { id: slug }], isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business.id;
}

export async function getBusinessProducts(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  return prisma.product.findMany({
    where: { businessId, isActive: true, deletedAt: null },
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBusinessServices(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  return prisma.service.findMany({
    where: { businessId, isActive: true, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBusinessMenu(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  const categories = await prisma.menuCategory.findMany({
    where: { businessId },
    include: {
      items: {
        where: { isActive: true, isAvailable: true, deletedAt: null },
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { sortOrder: 'asc' },
  });
  const uncategorized = await prisma.menuItem.findMany({
    where: { businessId, categoryId: null, isActive: true, isAvailable: true, deletedAt: null },
    orderBy: { sortOrder: 'asc' },
  });
  return { categories, uncategorized };
}

export async function getBusinessRooms(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  return prisma.room.findMany({
    where: { businessId, isActive: true, deletedAt: null },
    orderBy: { price: 'asc' },
  });
}

export async function getBusinessEvents(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  return prisma.event.findMany({
    where: { businessId, isActive: true, deletedAt: null },
    orderBy: { startDate: 'asc' },
  });
}

export async function getBusinessRentals(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  return prisma.rental.findMany({
    where: { businessId, isActive: true, deletedAt: null },
    orderBy: { price: 'asc' },
  });
}

export async function getBusinessPortfolio(slug: string) {
  return getPublicPortfolio(slug);
}

export async function getBusinessPromotions(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  return prisma.promotion.findMany({
    where: { businessId, isActive: true, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBusinessPartners(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  return prisma.partner.findMany({
    where: { businessId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function getBusinessReviews(slug: string) {
  const businessId = await getBusinessIdBySlug(slug);
  return prisma.businessReview.findMany({
    where: { businessId, isActive: true },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createBusinessReview(
  slug: string,
  userId: string,
  data: { rating: number; title?: string; comment?: string }
) {
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)
    throw new AppError('La note doit être un entier entre 1 et 5', 400);

  const business = await prisma.business.findUnique({
    where: { slug, isActive: true, deletedAt: null },
    select: { id: true, name: true, ownerId: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  // Un propriétaire ne peut pas noter son propre business
  if (business.ownerId === userId)
    throw new AppError('Vous ne pouvez pas noter votre propre business', 400);

  const existing = await prisma.businessReview.findFirst({
    where: { businessId: business.id, userId },
  });
  if (existing) throw new AppError('Vous avez déjà évalué ce business', 409);

  const review = await prisma.businessReview.create({
    data: {
      businessId: business.id,
      userId,
      rating: data.rating,
      title: data.title || null,
      comment: data.comment || null,
    },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
  });

  // Recalcul immédiat de la note moyenne + compteur, puis diffusion de l'événement
  await recalculateBusinessRating(business.id);
  publishReviewPublished({
    userId,
    businessId: business.id,
    businessName: business.name,
    rating: data.rating,
  });
  // L'avis influence l'AfriScore (composante satisfaction) : recalcule non-bloquant
  afriScoreService.computeBusinessScore(business.id).catch((err) => {
    console.warn('[business] afriscore recompute failed:', (err as Error).message);
  });

  // Analytics — avis business publié (fire-and-forget, non-bloquant)
  trackAnalyticsEvent({
    businessId: business.id,
    userId,
    type: 'review',
    category: 'social',
    eventName: 'REVIEW_PUBLISHED',
    value: data.rating,
    properties: { reviewId: review.id, rating: data.rating },
  }).catch(() => {});

  return review;
}

export async function recalculateBusinessRating(businessId: string) {
  try {
    const stats = await prisma.businessReview.aggregate({
      where: { businessId, isActive: true },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.business.update({
      where: { id: businessId },
      data: { rating: stats._avg.rating || 0, reviewCount: stats._count },
    });
  } catch (error) {
    // Recalcul non bloquant : un échec ne doit pas casser l'action d'administration
    console.warn(`[recalculateBusinessRating] Échec pour ${businessId}`, error);
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

async function generateUniqueSlug(name: string): Promise<string> {
  let slug = slugify(name);
  if (!slug) slug = 'business';
  let exists = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
  let counter = 1;
  while (exists) {
    const newSlug = `${slug}-${counter}`;
    exists = await prisma.business.findUnique({ where: { slug: newSlug }, select: { id: true } });
    if (!exists) return newSlug;
    counter++;
  }
  return slug;
}

export interface OnboardingInput {
  name: string;
  type: BusinessType;
  shortDescription: string;
  phone: string;
  whatsapp?: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  logo: string;
  coverImage: string;
  managerName?: string;
  managerBio?: string;
  experience?: number;
  skills?: string[];
  certifications?: string[];
  portfolioImages?: string[];
  tagline?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  modules: BusinessModule[];
  openingHours?: Record<string, { open?: string; close?: string; closed?: boolean }>;
  portfolio?: { title: string; description?: string; imageUrl?: string; linkUrl?: string }[];
}

export async function getMyBusiness(ownerId: string, businessId?: string | null) {
  const where = businessId
    ? { id: businessId, ownerId, deletedAt: null, isActive: true }
    : { ownerId, deletedAt: null, isActive: true };
  const business = await prisma.business.findFirst({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      settings: true,
      plan: { select: { id: true, name: true, price: true, currency: true, badge: true } },
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      moduleAssignments: {
        where: { status: 'ACTIVE' },
        select: { module: true },
      },
      hours: { orderBy: { day: 'asc' } },
      paymentMethods: { where: { isActive: true } },
      deliveryZones: { where: { isActive: true } },
      _count: {
        select: {
          products: true,
          services: true,
          menuItems: true,
          rooms: true,
          events: true,
          rentals: true,
          portfolioItems: true,
          employees: true,
          trainings: true,
          businessClients: true,
          partners: true,
          promotions: true,
        },
      },
    },
  });
  if (!business) return null;
  // Source de vérité des modules = assignments ACTIVE (champ Business.modules déprécié)
  const modules = resolveBusinessModules(business) as BusinessModule[];
  const { _count, hours, paymentMethods, deliveryZones, ...businessRest } = business;
  const setup = computeModuleSetup(modules, _count, paymentMethods.length, deliveryZones.length);
  return {
    ...businessRest,
    hours,
    paymentMethods,
    deliveryZones,
    modules,
    setup,
    setupComplete: Object.values(setup).every((s) => s.configured),
  };
}

interface SetupCounts {
  products: number;
  services: number;
  menuItems: number;
  rooms: number;
  events: number;
  rentals: number;
  portfolioItems: number;
  employees: number;
  trainings: number;
  businessClients: number;
  partners: number;
  promotions: number;
}

const MODULE_SETUP_HINTS: Partial<Record<BusinessModule, string>> = {
  PRODUCTS: 'Ajoutez au moins un produit au catalogue',
  SERVICES: 'Ajoutez au moins un service',
  MENU: 'Créez votre menu ou votre carte',
  ROOMS: 'Ajoutez au moins une chambre',
  BOOKINGS: 'Activez un moyen de paiement pour encaisser les réservations',
  ORDERS: 'Activez un moyen de paiement pour encaisser les commandes',
  QUOTES_INVOICES: 'Activez un moyen de paiement pour encaisser devis et factures',
  DEBTS_PAYMENTS: 'Activez un moyen de paiement pour encaisser les créances',
  PLANNING: 'Ajoutez au moins un employé',
  EMPLOYEES: 'Ajoutez au moins un employé',
  PORTFOLIO: 'Ajoutez au moins une réalisation au portfolio',
  SUBSCRIPTIONS: 'Activez un moyen de paiement pour encaisser les abonnements',
  DELIVERIES: 'Définissez au moins une zone de livraison',
  EVENTS: 'Publiez au moins un événement',
  RENTALS: 'Ajoutez au moins un bien en location',
  PARTNERS: 'Invitez au moins un partenaire',
  TRAINING: 'Ajoutez au moins une formation',
  SAVINGS: 'Activez un moyen de paiement pour encaisser l’épargne',
  CRM: 'Ajoutez au moins un client',
  MARKETING: 'Lancez au moins une campagne ou une promotion',
};

function isModuleConfigured(
  mod: BusinessModule,
  counts: SetupCounts,
  paymentCount: number,
  deliveryCount: number
): boolean {
  switch (mod) {
    case 'PRODUCTS':
      return counts.products > 0;
    case 'SERVICES':
      return counts.services > 0;
    case 'MENU':
      return counts.menuItems > 0;
    case 'ROOMS':
      return counts.rooms > 0;
    case 'BOOKINGS':
    case 'ORDERS':
    case 'QUOTES_INVOICES':
    case 'DEBTS_PAYMENTS':
    case 'SUBSCRIPTIONS':
    case 'SAVINGS':
      return paymentCount > 0;
    case 'PLANNING':
    case 'EMPLOYEES':
      return counts.employees > 0;
    case 'PORTFOLIO':
      return counts.portfolioItems > 0;
    case 'DELIVERIES':
      return deliveryCount > 0;
    case 'EVENTS':
      return counts.events > 0;
    case 'RENTALS':
      return counts.rentals > 0;
    case 'PARTNERS':
      return counts.partners > 0;
    case 'TRAINING':
      return counts.trainings > 0;
    case 'CRM':
      return counts.businessClients > 0;
    case 'MARKETING':
      return counts.promotions > 0;
    default:
      return true;
  }
}

function computeModuleSetup(
  modules: BusinessModule[],
  counts: SetupCounts,
  paymentCount: number,
  deliveryCount: number
): Record<string, { configured: boolean; missing: string[] }> {
  const setup: Record<string, { configured: boolean; missing: string[] }> = {};
  for (const mod of modules) {
    const configured = isModuleConfigured(mod, counts, paymentCount, deliveryCount);
    setup[mod] = {
      configured,
      missing: configured ? [] : MODULE_SETUP_HINTS[mod] ? [MODULE_SETUP_HINTS[mod]!] : [],
    };
  }
  return setup;
}

/** Liste des business du boss (bascule multi-activité). */
export async function getMyBusinesses(ownerId: string) {
  return prisma.business.findMany({
    where: { ownerId, deletedAt: null, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      logo: true,
      city: true,
      country: true,
      isActive: true,
      isVerified: true,
    },
  });
}

export async function getMyBusinessStats(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, deletedAt: null, isActive: true },
    select: {
      id: true,
      _count: { select: { orders: true, reviews: true, products: true, services: true } },
    },
  });

  if (!business) {
    return {
      clients: 0,
      orders: 0,
      revenue: 0,
      reviewsReceived: 0,
      visitors: 0,
      conversionRate: 0,
    };
  }

  // Aggregate orders for revenue
  const ordersAgg = await prisma.order.aggregate({
    where: { businessId: business.id },
    _sum: { totalAmount: true },
  });

  const uniqueClients = await prisma.order.findMany({
    where: { businessId: business.id },
    select: { buyerId: true },
    distinct: ['buyerId'],
  });

  return {
    clients: uniqueClients.length,
    orders: business._count.orders,
    revenue: ordersAgg._sum.totalAmount || 0,
    reviewsReceived: business._count.reviews,
    totalProducts: business._count.products,
    totalServices: business._count.services,
  };
}

export async function getAggregatedDashboardStats(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  const { id: businessId } = business;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const startOfYesterday = new Date(startOfDay.getTime() - 86400000);
  const endOfYesterday = new Date(startOfDay.getTime());

  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(startOfDay.getTime() - diffToMonday * 86400000);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 86400000);

  const [
    todayOrdersCount,
    todayBookingsCount,
    todayPaidOrdersSum,
    todayPaymentsSum,
    todayNewClients,
    pendingOrdersCount,
    pendingQuotesCount,
    pendingInvoicesSum,
    pendingDisputesCount,
    pendingDebtsSum,
    lowStockCount,
    overdueDebtsCount,
    overdueInvoicesCount,
    expiringDocumentsCount,
    yesterdayPaidOrdersSum,
    yesterdayPaymentsSum,
    ordersThisWeekCount,
    bookingsThisWeekCount,
  ] = await Promise.all([
    prisma.order.count({ where: { businessId, createdAt: { gte: startOfDay, lt: endOfDay } } }),
    prisma.booking.count({ where: { businessId, startDate: { gte: startOfDay, lt: endOfDay } } }),
    prisma.order
      .aggregate({
        where: { businessId, paidAt: { gte: startOfDay, lt: endOfDay } },
        _sum: { totalAmount: true },
      })
      .then((r) => Number(r._sum.totalAmount || 0)),
    prisma.payment
      .aggregate({
        where: {
          order: { businessId },
          status: 'COMPLETED',
          paidAt: { gte: startOfDay, lt: endOfDay },
        },
        _sum: { amount: true },
      })
      .then((r) => Number(r._sum.amount || 0)),
    prisma.order
      .findMany({
        where: { businessId, createdAt: { gte: startOfDay, lt: endOfDay }, buyerId: { not: null } },
        select: { buyerId: true },
        distinct: ['buyerId'],
      })
      .then((orders) => orders.length),
    prisma.order.count({ where: { businessId, status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.quote.count({ where: { businessId, status: { in: ['DRAFT', 'SENT'] } } }),
    prisma.invoice
      .aggregate({
        where: { businessId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { totalAmount: true },
      })
      .then((r) => Number(r._sum.totalAmount || 0)),
    prisma.dispute.count({ where: { businessId, status: { in: ['OUVERT', 'EN_COURS'] } } }),
    prisma.debt
      .aggregate({
        where: { businessId, status: { in: ['ACTIVE', 'OVERDUE', 'CRITICAL'] } },
        _sum: { remainingAmount: true },
      })
      .then((r) => Number(r._sum.remainingAmount || 0)),
    prisma.product.count({
      where: { businessId, stock: { lte: 5 }, isActive: true, deletedAt: null },
    }),
    prisma.debt.count({ where: { businessId, status: 'OVERDUE' } }),
    prisma.invoice.count({ where: { businessId, status: 'OVERDUE' } }),
    prisma.businessDocument.count({
      where: { businessId, expiresAt: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) } },
    }),
    prisma.order
      .aggregate({
        where: { businessId, paidAt: { gte: startOfYesterday, lt: endOfYesterday } },
        _sum: { totalAmount: true },
      })
      .then((r) => Number(r._sum.totalAmount || 0)),
    prisma.payment
      .aggregate({
        where: {
          order: { businessId },
          status: 'COMPLETED',
          paidAt: { gte: startOfYesterday, lt: endOfYesterday },
        },
        _sum: { amount: true },
      })
      .then((r) => Number(r._sum.amount || 0)),
    prisma.order.count({ where: { businessId, createdAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.booking.count({ where: { businessId, startDate: { gte: startOfWeek, lt: endOfWeek } } }),
  ]);

  const todayRevenue = todayPaidOrdersSum + todayPaymentsSum;

  // Last 7 days history
  const history = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const dayStart = new Date(startOfDay.getTime() - i * 86400000);
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const [ordersCount, paidOrdersSum, paymentsSum] = await Promise.all([
        prisma.order.count({ where: { businessId, createdAt: { gte: dayStart, lt: dayEnd } } }),
        prisma.order
          .aggregate({
            where: { businessId, paidAt: { gte: dayStart, lt: dayEnd } },
            _sum: { totalAmount: true },
          })
          .then((r) => Number(r._sum.totalAmount || 0)),
        prisma.payment
          .aggregate({
            where: {
              order: { businessId },
              status: 'COMPLETED',
              paidAt: { gte: dayStart, lt: dayEnd },
            },
            _sum: { amount: true },
          })
          .then((r) => Number(r._sum.amount || 0)),
      ]);
      return {
        date: dayStart.toISOString(),
        revenue: paidOrdersSum + paymentsSum,
        orders: ordersCount,
      };
    })
  );

  // ── Remises accordées (30 derniers jours) : total, nb commandes remisées, top promos ──
  const since30d = new Date(now.getTime() - 30 * 86400000);
  const [discountsAgg, discountedOrders] = await Promise.all([
    prisma.order.aggregate({
      where: { businessId, createdAt: { gte: since30d } },
      _sum: { discountAmount: true },
    }),
    prisma.order.findMany({
      where: { businessId, createdAt: { gte: since30d }, discountAmount: { gt: 0 } },
      select: { discountAmount: true, internalNotes: true },
      take: 500,
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  const promoMap = new Map<string, { code: string; count: number; total: number }>();
  for (const o of discountedOrders) {
    const m = String(o.internalNotes || '').match(/Promo\s*:\s*([^\s(-]+)/i);
    const code = m ? m[1].toUpperCase() : 'AUTRE';
    const entry = promoMap.get(code) || { code, count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(o.discountAmount || 0);
    promoMap.set(code, entry);
  }
  const topPromos = [...promoMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

  return {
    today: {
      ordersCount: todayOrdersCount,
      bookingsCount: todayBookingsCount,
      revenue: todayRevenue,
      newClients: todayNewClients,
    },
    discounts: {
      total30d: Number(discountsAgg._sum.discountAmount || 0),
      count30d: discountedOrders.length,
      topPromos,
    },
    pending: {
      ordersCount: pendingOrdersCount,
      quotesCount: pendingQuotesCount,
      invoicesAmount: pendingInvoicesSum,
      disputesCount: pendingDisputesCount,
      debtsAmount: pendingDebtsSum,
    },
    alerts: {
      lowStock: lowStockCount,
      overdueDebts: overdueDebtsCount,
      overdueInvoices: overdueInvoicesCount,
      expiringDocuments: expiringDocumentsCount,
    },
    trends: {
      revenueToday: todayRevenue,
      revenueYesterday: yesterdayPaidOrdersSum + yesterdayPaymentsSum,
      ordersThisWeek: ordersThisWeekCount,
      bookingsThisWeek: bookingsThisWeekCount,
    },
    history: history.reverse(),
  };
}

export async function createBusiness(ownerId: string, data: OnboardingInput) {
  // MULTI-ACTIVITÉ (Chantier 5) : un boss peut posséder N business (boutique + gym
  // + locations + conférences). La contrainte unique sur ownerId a été levée par
  // migration — plus aucune garde n'empêche de créer une 2e activité.
  const slug = await generateUniqueSlug(data.name);

  // Mandatory modules always activated
  const mandatoryModules: BusinessModule[] = ['PROMOTIONS' as BusinessModule];

  const allModules: BusinessModule[] = [...mandatoryModules, ...data.modules];

  const {
    latitude,
    longitude,
    modules: inputModules,
    openingHours,
    portfolio,
    ...rest
  } = data;

  // Résoudre le plan plateforme par défaut (AfriBiz — GRATUIT au lancement).
  // S'il n'existe pas en base, planId reste null → planAccessService retombe sur DEFAULT_PLAN_ID.
  const defaultPlan = await prisma.subscriptionPlan.findUnique({
    where: { id: DEFAULT_PLAN_ID },
    select: { id: true },
  });
  const planId = defaultPlan ? DEFAULT_PLAN_ID : null;

  const business = await prisma.$transaction(async (tx) => {
    // Type explicite : évite le flottement TS entre BusinessCreateInput et UncheckedCreateInput
    // (le spread `...rest` + `owner: { connect }` + `planId` fait choisir la mauvaise branche sinon)
    const createData: Prisma.BusinessCreateInput = {
      slug,
      latitude,
      longitude,
      modules: { set: allModules },
      plan: planId ? { connect: { id: planId } } : undefined,
      onboardingCompleted: true,
      onboardedAt: new Date(),
      verificationLevel: 'ARGENT',
      owner: {
        connect: { id: ownerId },
      },
      ...rest,
      logo: rest.logo || undefined,
      coverImage: rest.coverImage || undefined,
      website: rest.website || undefined,
      whatsapp: rest.whatsapp || undefined,
      managerName: rest.managerName || undefined,
      managerBio: rest.managerBio || undefined,
      experience: rest.experience || undefined,
      skills: rest.skills || [],
      certifications: rest.certifications || [],
      portfolioImages: rest.portfolioImages || [],
      tagline: rest.tagline || undefined,
      facebook: rest.facebook || undefined,
      instagram: rest.instagram || undefined,
      tiktok: rest.tiktok || undefined,
      linkedin: rest.linkedin || undefined,
    };
    const created = await tx.business.create({ data: createData });

    // Wallet automatique : socle de la chaîne magique (commande → CA → retraits).
    // Le wallet est créé dans la même transaction que le business (zéro business sans wallet).
    await tx.wallet.create({
      data: {
        businessId: created.id,
        balance: 0,
        locked: 0,
        currency: 'FCFA',
      },
    });

    await tx.businessSettings.create({
      data: {
        businessId: created.id,
      },
    });

    // Create moduleAssignments for the new migration system
    if (allModules.length > 0) {
      await tx.businessModuleAssignment.createMany({
        data: allModules.map((mod) => ({
          businessId: created.id,
          module: mod,
          status: 'ACTIVE',
          activatedAt: new Date(),
        })),
        skipDuplicates: true,
      });
    }

    return created;
  });

  // ── Sauver les horaires d'ouverture dans BusinessHour ──
  const dayMap: Record<string, number> = {
    lundi: 1, mardi: 2, mercredi: 3, jeudi: 4,
    vendredi: 5, samedi: 6, dimanche: 0,
  };
  if (openingHours && typeof openingHours === 'object') {
    const hourEntries = Object.entries(openingHours).filter(
      ([, v]) => v && typeof v === 'object'
    );
    if (hourEntries.length > 0) {
      await prisma.businessHour.createMany({
        data: hourEntries.map(([day, hours]) => ({
          businessId: business.id,
          day: dayMap[day] ?? 0,
          open: (hours as any).open || '08:00',
          close: (hours as any).close || '18:00',
          isClosed: !!(hours as any).closed,
        })),
        skipDuplicates: true,
      });
    }
  }

  // ── Sauver les items portfolio ──
  if (portfolio && Array.isArray(portfolio) && portfolio.length > 0) {
    await (prisma as any).portfolioItem.createMany({
      data: portfolio.map((item, idx) => ({
        businessId: business.id,
        title: item.title,
        description: item.description || null,
        coverImage: item.imageUrl || null,
        images: item.imageUrl ? [item.imageUrl] : [],
        sortOrder: idx,
      })),
    });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { roles: true },
  });
  const roles = currentUser?.roles ?? [];
  const updateData: Prisma.UserUpdateArgs['data'] = { primaryRole: 'BUSINESS' };
  if (!roles.includes('BUSINESS')) {
    updateData.roles = { push: 'BUSINESS' } as any;
  }
  await prisma.user.update({ where: { id: ownerId }, data: updateData });

  publishOnboardingCompleted({
    userId: ownerId,
    businessId: business.id,
    businessName: business.name,
  });

  // Nouveau business inscrit → alerté les admins (room admin:alerts) pour la revue
  publishBusinessRegistered({
    userId: ownerId,
    businessId: business.id,
    businessName: business.name,
  });

  return prisma.business.findUnique({
    where: { id: business.id },
    include: {
      settings: true,
      plan: { select: { id: true, name: true, price: true, currency: true, badge: true } },
      wallet: true,
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
    },
  });
}

export async function respondToBusinessReview(
  slug: string,
  reviewId: string,
  ownerId: string,
  response: string
) {
  const business = await prisma.business.findFirst({ where: { slug, ownerId, deletedAt: null, isActive: true } });
  if (!business) throw new AppError('Business non trouvé ou accès refusé', 404);

  const review = await prisma.businessReview.findUnique({
    where: { id: reviewId, businessId: business.id },
  });
  if (!review) throw new AppError('Avis non trouvé', 404);

  const updated = await prisma.businessReview.update({
    where: { id: reviewId },
    data: { response, responseAt: new Date() },
  });

  publishReviewResponse({
    userId: review.userId,
    businessId: business.id,
    businessName: business.name,
  });

  return updated;
}

export async function submitVerification(
  userId: string,
  data: {
    identityDocument: string;
    companyDocument: string;
    taxDocument?: string;
    responsiblePhoto: string;
  }
) {
  const business = await prisma.business.findFirst({ where: { ownerId: userId } });
  if (!business) throw new AppError('Aucun commerce trouvé pour cet utilisateur', 404);
  if (business.verificationStatus === 'VERIFIED')
    throw new AppError('Votre commerce est déjà vérifié', 409);

  const updated = await prisma.business.update({
    where: { id: business.id },
    data: {
      identityDocument: data.identityDocument,
      companyDocument: data.companyDocument,
      taxDocument: data.taxDocument || null,
      responsiblePhoto: data.responsiblePhoto,
      verificationStatus: BusinessVerificationStatus.PENDING,
    },
  });

  // KYC soumis → alerte les admins (room admin:alerts) : le dossier est à traiter
  publishBusinessKycSubmitted({
    userId,
    businessId: updated.id,
    businessName: updated.name,
  });

  return updated;
}

export async function getBusinessBookings(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return prisma.booking.findMany({
    where: { businessId: business.id },
    include: {
      service: { select: { id: true, name: true, price: true, duration: true } },
    },
    orderBy: { startDate: 'asc' },
  });
}

export async function getBusinessTrainings(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return prisma.training.findMany({
    where: { businessId: business.id, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}
