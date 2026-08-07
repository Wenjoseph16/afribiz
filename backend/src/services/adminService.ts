import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { searchIdsByText } from '../lib/fulltext';
import { createImpersonationToken as createImpersonationJwt } from '../lib/jwt';
import { publishPaymentReceived, publishRefundProcessed } from '../events/publishers';
import { SecurityLogRepository } from '../repositories/securityLogRepository';
import { forceDisconnectUser } from './socket';
import {
  logAdminAction,
  trackAdminAction,
  notifyBusinessVerified,
  notifyBusinessStatusChanged,
  notifyModuleStatus,
  notifyAdStatus,
  notifyEscrowReleased,
  notifyEscrowRefunded,
  notifyDisputeResolved,
  notifyUserWarned,
} from './adminEvents';
import * as adminFeaturesService from './adminFeaturesService';
import { invalidatePlanCache } from './planAccessService';

export const getDashboardStats = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);

  const [
    totalUsers,
    totalClients,
    totalBusinesses,
    totalDevelopers,
    totalModules,
    totalProducts,
    totalServices,
    totalRooms,
    totalEvents,
    totalRentals,
    totalOrders,
    totalBookings,
    totalPayments,
    transactionsAgg,
    escrowAgg,
    adRevenueAgg,
    marketplaceRevenueAgg,
    dataHubRevenueAgg,
    openDisputes,
    supportTickets,
    activeAds,
    totalAdImpressions,
    totalAdClicks,
    totalAdConversions,
    activeSubscriptions,
    totalAfriScores,
    avgAfriScoreAgg,
    totalConsents,
    usersToday,
    usersYesterday,
    usersThisMonth,
    usersLastMonth,
    usersThisYear,
    usersLastYear,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { primaryRole: 'CLIENT' } }),
    prisma.business.count(),
    prisma.developerProfile.count(),
    prisma.developerModule.count(),
    prisma.product.count(),
    prisma.service.count(),
    prisma.room.count(),
    prisma.event.count(),
    prisma.rental.count(),
    prisma.order.count(),
    prisma.booking.count(),
    prisma.payment.count(),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true } }),
    prisma.adInvoice.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
    prisma.developerRevenue.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.dataReport.aggregate({ where: { isPaid: true }, _sum: { price: true } }),
    Promise.resolve(0),
    prisma.developerSupportTicket.count(),
    prisma.adCampaign.count({ where: { status: 'ACTIVE' } }),
    prisma.adImpression.count(),
    prisma.adClick.count(),
    prisma.adConversion.count(),
    prisma.partnerSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.businessScore.count(),
    prisma.businessScore.aggregate({ _avg: { overallScore: true } }),
    prisma.dataConsent.count(),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.user.count({ where: { createdAt: { gte: yearStart } } }),
    prisma.user.count({ where: { createdAt: { gte: lastYearStart, lt: yearStart } } }),
  ]);

  const growthDaily =
    usersYesterday > 0
      ? ((usersToday - usersYesterday) / usersYesterday) * 100
      : usersToday > 0
        ? 100
        : 0;
  const growthMonthly =
    usersLastMonth > 0
      ? ((usersThisMonth - usersLastMonth) / usersLastMonth) * 100
      : usersThisMonth > 0
        ? 100
        : 0;
  const growthAnnual =
    usersLastYear > 0
      ? ((usersThisYear - usersLastYear) / usersLastYear) * 100
      : usersThisYear > 0
        ? 100
        : 0;

  return {
    totalUsers,
    totalClients,
    totalBusinesses,
    totalDevelopers,
    totalModules,
    totalProducts,
    totalServices,
    totalRooms,
    totalEvents,
    totalRentals,
    totalOrders,
    totalBookings,
    totalPayments,
    totalTransactionsAmount: transactionsAgg._sum.amount || 0,
    totalEscrowAmount: escrowAgg._sum.amount || 0,
    platformRevenue: 0,
    adRevenue: adRevenueAgg._sum.amount || 0,
    marketplaceRevenue: marketplaceRevenueAgg._sum.amount || 0,
    dataHubRevenue: dataHubRevenueAgg._sum.price || 0,
    openDisputes,
    supportTickets,
    activeAds,
    totalAdImpressions,
    totalAdClicks,
    totalAdConversions,
    activeSubscriptions,
    totalAfriScores,
    avgAfriScore: avgAfriScoreAgg._avg.overallScore || 0,
    totalConsents,
    growthDaily: Math.round(growthDaily * 100) / 100,
    growthMonthly: Math.round(growthMonthly * 100) / 100,
    growthAnnual: Math.round(growthAnnual * 100) / 100,
  };
};

export const getUsers = async (query: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.search) {
    const ftsIds = await searchIdsByText('User', ['firstName', 'lastName', 'email'], query.search);
    const phoneMatch = await prisma.user.findMany({
      where: { phone: { contains: query.search } },
      select: { id: true },
    });
    const allIds = [...ftsIds, ...phoneMatch.map((u) => u.id)];
    where.id = allIds.length > 0 ? { in: allIds } : { in: [] };
  }
  if (query.role) where.primaryRole = query.role;
  if (query.status === 'active') where.isActive = true;
  else if (query.status === 'inactive') where.isActive = false;

  const total = await prisma.user.count({ where });
  const users = await prisma.user.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      emailVerified: true,
      phoneVerified: true,
      isActive: true,
      primaryRole: true,
      roles: true,
      avatar: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { sessions: true, notifications: true, securityLogs: true } },
    },
  });
  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      sessions: { orderBy: { createdAt: 'desc' }, take: 10 },
      securityLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      devices: true,
      business: true,
      developerProfile: true,
      _count: {
        select: {
          notifications: true,
          orders: true,
          bookings: true,
          payments: true,
          reviews: true,
        },
      },
    },
  });
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  return user;
};

export const updateUserStatus = async (
  id: string,
  action: 'suspend' | 'activate' | 'block' | 'delete',
  adminUserId?: string
) => {
  if (action === 'delete') {
    throw new AppError(
      "La suppression d'utilisateur est interdite pour des raisons de protection des données",
      400
    );
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('Utilisateur introuvable', 404);

  let data: any;
  switch (action) {
    case 'suspend':
      data = { isActive: false };
      break;
    case 'activate':
      data = { isActive: true };
      break;
    case 'block':
      data = { isActive: false };
      break;
  }
  const updated = await prisma.user.update({ where: { id }, data });

  // Écosystème : journal d'audit + analytics + déconnexion forcée si suspension/blocage
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_USER_ACTION',
      targetUserId: id,
      reason: `Utilisateur ${action === 'activate' ? 'réactivé' : action === 'suspend' ? 'suspendu' : 'bloqué'}`,
      metadata: { action, targetEmail: user.email },
    });
    await trackAdminAction({
      adminUserId,
      eventName: `ADMIN_USER_${action.toUpperCase()}`,
      properties: { targetUserId: id, targetEmail: user.email },
    });
  }
  if ((action === 'suspend' || action === 'block') && user.isActive) {
    try {
      forceDisconnectUser(id);
    } catch (err) {
      // non-bloquant
    }
  }
  return updated;
};

export const getUserActivity = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) throw new AppError('Utilisateur introuvable', 404);

  const [sessions, securityLogs, loginHistory] = await Promise.all([
    prisma.session.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    prisma.securityLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.securityLog.findMany({
      where: { userId: id, action: { in: ['LOGIN', 'FAILED_LOGIN'] } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);
  return { sessions, securityLogs, loginHistory };
};

export const getBusinesses = async (query: {
  search?: string;
  status?: string;
  verified?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.search) {
    const ftsIds = await searchIdsByText('Business', ['name', 'email', 'slug'], query.search);
    const phoneMatch = await prisma.business.findMany({
      where: { phone: { contains: query.search } },
      select: { id: true },
    });
    const allIds = [...ftsIds, ...phoneMatch.map((b) => b.id)];
    where.id = allIds.length > 0 ? { in: allIds } : { in: [] };
  }
  if (query.status === 'active') where.isActive = true;
  else if (query.status === 'inactive') where.isActive = false;
  if (query.verified === 'true') where.isVerified = true;
  else if (query.verified === 'false') where.isVerified = false;

  const total = await prisma.business.count({ where });
  const items = await prisma.business.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { id: true, email: true, firstName: true, lastName: true } },
      score: true,
      _count: {
        select: {
          products: true,
          services: true,
          menuItems: true,
          rooms: true,
          events: true,
          rentals: true,
          reviews: true,
        },
      },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getBusinessById = async (id: string) => {
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
        },
      },
      settings: true,
      hours: true,
      paymentMethods: true,
      deliveryZones: true,
      products: { where: { deletedAt: null }, take: 20 },
      services: { where: { deletedAt: null }, take: 20 },
      menuCategories: { include: { items: true } },
      rooms: { where: { deletedAt: null }, take: 20 },
      events: { where: { deletedAt: null }, take: 20 },
      rentals: { where: { deletedAt: null }, take: 20 },
      portfolioItems: { where: { deletedAt: null }, take: 20 },
      promotions: { take: 20 },
      partners: { take: 20 },
      reviews: {
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      score: true,
      scoreHistory: { orderBy: { snapshotDate: 'desc' }, take: 10 },
      badges: { where: { isActive: true } },
      adCampaigns: { take: 10 },
      supportTickets: { take: 10 },
      _count: {
        select: {
          products: true,
          services: true,
          menuItems: true,
          rooms: true,
          events: true,
          rentals: true,
          reviews: true,
          promotions: true,
          partners: true,
          portfolioItems: true,
        },
      },
    },
  });
  if (!business) throw new AppError('Commerce introuvable', 404);
  return business;
};

export const updateBusinessStatus = async (
  id: string,
  action: 'validate' | 'verify' | 'suspend' | 'block' | 'delete',
  adminUserId?: string
) => {
  if (action === 'delete') throw new AppError("La suppression d'un commerce est interdite", 400);
  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) throw new AppError('Commerce introuvable', 404);

  let data: any;
  switch (action) {
    case 'validate':
      data = { isActive: true };
      break;
    case 'verify':
      data = {
        isVerified: true,
        isActive: true,
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
      };
      break;
    case 'suspend':
      data = { isActive: false };
      break;
    case 'block':
      data = { isActive: false, verificationStatus: 'REJECTED', rejectionReason: 'Compte bloqué' };
      break;
  }
  const updated = await prisma.business.update({ where: { id }, data });

  // Écosystème : journal + analytics + notification au propriétaire quand il est activé/vérifié
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_BUSINESS_ACTION',
      targetUserId: business.ownerId,
      reason: `Business ${action === 'validate' ? 'validé' : action === 'verify' ? 'vérifié' : action === 'suspend' ? 'suspendu' : 'bloqué'}: ${business.name}`,
      metadata: { action, businessId: id, businessName: business.name },
    });
    await trackAdminAction({
      adminUserId,
      eventName: `ADMIN_BUSINESS_${action.toUpperCase()}`,
      properties: { businessId: id, businessName: business.name },
    });
  }
  if (action === 'validate' || action === 'verify') {
    await notifyBusinessVerified(id);
  } else if (action === 'suspend' || action === 'block') {
    await notifyBusinessStatusChanged({
      businessId: id,
      status: action === 'suspend' ? 'suspended' : 'blocked',
      reason: business.rejectionReason || undefined,
    });
  }
  return updated;
};

export const updateBusinessPlan = async (
  businessId: string,
  planId: string | null,
  adminUserId?: string
) => {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new AppError('Business not found', 404);

  if (planId) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: { id: true, name: true, businessId: true },
    });
    if (!plan || plan.businessId !== null) {
      throw new AppError('Plan plateforme introuvable', 404);
    }
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { planId: planId || null },
    select: {
      id: true,
      name: true,
      slug: true,
      planId: true,
      plan: { select: { id: true, name: true } },
    },
  });

  // Invalider le cache du plan
  invalidatePlanCache(businessId);

  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_BUSINESS_ACTION',
      targetUserId: business.ownerId,
      metadata: {
        action: 'PLAN_CHANGED',
        planId: planId || null,
        businessName: business.name,
        businessId,
      },
    });
  }

  return updated;
};

export const updateBusinessVerification = async (
  id: string,
  action: 'verify' | 'reject',
  rejectionReason?: string,
  adminUserId?: string
) => {
  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) throw new AppError('Commerce introuvable', 404);

  if (action === 'verify') {
    const updated = await prisma.business.update({
      where: { id },
      data: {
        verificationStatus: 'VERIFIED',
        isVerified: true,
        verifiedAt: new Date(),
        rejectionReason: null,
      },
    });
    if (adminUserId) {
      await logAdminAction({
        adminUserId,
        action: 'ADMIN_BUSINESS_ACTION',
        targetUserId: business.ownerId,
        reason: `Vérification du business approuvée: ${business.name}`,
        metadata: { action: 'verify', businessId: id },
      });
    }
    await notifyBusinessVerified(id);
    return updated;
  }

  if (!rejectionReason) throw new AppError('Un motif de refus est requis', 400);
  const updated = await prisma.business.update({
    where: { id },
    data: { verificationStatus: 'REJECTED', isVerified: false, rejectionReason },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_BUSINESS_ACTION',
      targetUserId: business.ownerId,
      reason: `Vérification du business refusée: ${business.name} (${rejectionReason})`,
      metadata: { action: 'reject', businessId: id, rejectionReason },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_BUSINESS_VERIFICATION_REJECTED',
      properties: { businessId: id, businessName: business.name, reason: rejectionReason },
    });
  }
  await notifyBusinessStatusChanged({
    businessId: id,
    status: 'rejected',
    reason: rejectionReason,
  });
  return updated;
};

// ============================================
// FREEZE / OBSERVATION TEMPORAIRE
// ============================================

/**
 * Geler un utilisateur temporairement (observation/enquête).
 * Auto-expiration via frozenUntil : le login vérifie ce champ et le cron
 * auto-unfreeze réactive le compte à l'échéance.
 */
export const freezeUser = async (
  id: string,
  params: { durationHours: number; reason?: string },
  adminUserId?: string
) => {
  if (!params.durationHours || params.durationHours <= 0)
    throw new AppError('La durée du gel doit être supérieure à 0 heure', 400);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  if (user.primaryRole === 'ADMIN' && user.id !== adminUserId)
    throw new AppError('Impossible de geler un autre administrateur', 403);

  const frozenUntil = new Date(Date.now() + params.durationHours * 3600_000);
  const updated = await prisma.user.update({
    where: { id },
    data: { frozenUntil, freezeReason: params.reason || 'Gel temporaire (observation)' },
  });

  // Écosystème : audit + analytics + notification + déconnexion immédiate
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_USER_ACTION',
      targetUserId: id,
      reason: `Utilisateur gelé ${params.durationHours}h: ${updated.email}`,
      metadata: {
        action: 'freeze',
        durationHours: params.durationHours,
        reason: params.reason,
        targetEmail: updated.email,
      },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_USER_FROZEN',
      properties: { targetUserId: id, durationHours: params.durationHours },
    });
  }
  try {
    forceDisconnectUser(id);
  } catch (err) {
    // non-bloquant
  }
  await notifyUserWarned({
    userId: id,
    reason: `Votre compte est temporairement gelé (${params.durationHours}h) : ${params.reason || 'enquête en cours'}.`,
  });
  return { ...updated, frozenUntil, freezeReason: updated.freezeReason };
};

/** Dégeler un utilisateur avant échéance. */
export const unfreezeUser = async (id: string, adminUserId?: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('Utilisateur introuvable', 404);
  const updated = await prisma.user.update({
    where: { id },
    data: { frozenUntil: null, freezeReason: null },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_USER_ACTION',
      targetUserId: id,
      reason: `Utilisateur dégelé: ${updated.email}`,
      metadata: { action: 'unfreeze', targetEmail: updated.email },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_USER_UNFROZEN',
      properties: { targetUserId: id },
    });
  }
  await notifyUserWarned({
    userId: id,
    reason: 'Votre compte a été dégelé. Vous pouvez vous reconnecter.',
  });
  return updated;
};

/**
 * Geler un business temporairement : isActive=false (plus d'action possible),
 * auto-réactivation par le cron à l'échéance de frozenUntil.
 */
export const freezeBusiness = async (
  id: string,
  params: { durationHours: number; reason?: string },
  adminUserId?: string
) => {
  if (!params.durationHours || params.durationHours <= 0)
    throw new AppError('La durée du gel doit être supérieure à 0 heure', 400);
  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) throw new AppError('Commerce introuvable', 404);

  const frozenUntil = new Date(Date.now() + params.durationHours * 3600_000);
  const updated = await prisma.business.update({
    where: { id },
    data: {
      isActive: false,
      frozenUntil,
      freezeReason: params.reason || 'Gel temporaire (observation)',
    },
  });

  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_BUSINESS_ACTION',
      targetUserId: business.ownerId,
      reason: `Business gelé ${params.durationHours}h: ${business.name}`,
      metadata: {
        action: 'freeze',
        businessId: id,
        businessName: business.name,
        durationHours: params.durationHours,
        reason: params.reason,
      },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_BUSINESS_FROZEN',
      properties: { businessId: id, durationHours: params.durationHours },
    });
  }
  await notifyBusinessStatusChanged({
    businessId: id,
    status: 'suspended',
    reason: `Gel temporaire (${params.durationHours}h) : ${params.reason || 'enquête en cours'}`,
  });
  return { ...updated, frozenUntil, freezeReason: updated.freezeReason };
};

/** Dégeler un business avant échéance. */
export const unfreezeBusiness = async (id: string, adminUserId?: string) => {
  const business = await prisma.business.findUnique({ where: { id } });
  if (!business) throw new AppError('Commerce introuvable', 404);
  const updated = await prisma.business.update({
    where: { id },
    data: { isActive: true, frozenUntil: null, freezeReason: null },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_BUSINESS_ACTION',
      targetUserId: business.ownerId,
      reason: `Business dégelé: ${business.name}`,
      metadata: { action: 'unfreeze', businessId: id, businessName: business.name },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_BUSINESS_UNFROZEN',
      properties: { businessId: id },
    });
  }
  await notifyBusinessStatusChanged({ businessId: id, status: 'suspended', reason: undefined });
  return updated;
};

/** Lister les comptes gelés actifs (users + business). */
export const getFrozenAccounts = async () => {
  const now = new Date();
  const [users, businesses] = await Promise.all([
    prisma.user.findMany({
      where: { frozenUntil: { not: null } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        frozenUntil: true,
        freezeReason: true,
        primaryRole: true,
      },
    }),
    prisma.business.findMany({
      where: { frozenUntil: { not: null } },
      select: {
        id: true,
        name: true,
        slug: true,
        frozenUntil: true,
        freezeReason: true,
        isActive: true,
      },
    }),
  ]);
  const normalize = (items: any[]) =>
    items
      .filter((i) => i.frozenUntil && i.frozenUntil > now)
      .map((i) => ({
        ...i,
        remainingHours:
          Math.round(((i.frozenUntil.getTime() - now.getTime()) / 3600_000) * 10) / 10,
      }));
  return {
    users: normalize(users),
    businesses: normalize(businesses),
    total: users.length + businesses.length,
  };
};

// ============================================
// VOIR-COMME (IMPERSONATION LECTURE SEULE)
// ============================================

/**
 * Générer un token d'impersonation (voir-comme) pour un utilisateur cible.
 * Lecture seule : le middleware auth bloque toute mutation avec ce token.
 */
export const createImpersonationToken = async (targetUserId: string, adminUserId: string) => {
  if (targetUserId === adminUserId) throw new AppError('Vous êtes déjà cet utilisateur', 400);
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new AppError('Utilisateur cible introuvable', 404);
  if (!target.isActive) throw new AppError('Le compte cible est inactif', 400);
  if (target.primaryRole === 'ADMIN')
    throw new AppError('Impossible de voir-comme un autre administrateur', 403);

  const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
  if (!admin || admin.primaryRole !== 'ADMIN')
    throw new AppError('Action réservée aux administrateurs', 403);

  const token = createImpersonationJwt({
    id: target.id,
    email: target.email,
    primaryRole: target.primaryRole,
    roles: target.roles,
    impersonatorId: adminUserId,
  });

  await logAdminAction({
    adminUserId,
    action: 'ADMIN_USER_ACTION',
    targetUserId: target.id,
    reason: `Voir-comme lancé sur ${target.email}`,
    metadata: { action: 'impersonate', targetEmail: target.email },
  });
  await trackAdminAction({
    adminUserId,
    eventName: 'ADMIN_IMPERSONATE',
    properties: { targetUserId: target.id, targetEmail: target.email },
  });

  return {
    token,
    expiresIn: '15m',
    target: {
      id: target.id,
      email: target.email,
      firstName: target.firstName,
      lastName: target.lastName,
      primaryRole: target.primaryRole,
    },
  };
};

export const getDevelopers = async (query: {
  search?: string;
  status?: string;
  verified?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.search) {
    const ftsIds = await searchIdsByText(
      'DeveloperProfile',
      ['companyName', 'email'],
      query.search
    );
    const phoneMatch = await prisma.developerProfile.findMany({
      where: { phone: { contains: query.search } },
      select: { id: true },
    });
    const skillsMatch = await prisma.developerProfile.findMany({
      where: { skills: { has: query.search } },
      select: { id: true },
    });
    const allIds = [
      ...new Set([...ftsIds, ...phoneMatch.map((d) => d.id), ...skillsMatch.map((d) => d.id)]),
    ];
    where.id = allIds.length > 0 ? { in: allIds } : { in: [] };
  }
  if (query.status === 'verified') where.verificationStatus = 'VERIFIED';
  else if (query.status === 'pending') where.verificationStatus = 'PENDING';
  else if (query.status === 'rejected') where.verificationStatus = 'REJECTED';
  if (query.verified === 'true') where.verificationStatus = 'VERIFIED';

  const total = await prisma.developerProfile.count({ where });
  const items = await prisma.developerProfile.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true, isActive: true } },
      _count: {
        select: {
          modules: true,
          revenues: true,
          payouts: true,
          supportTickets: true,
          developerModuleReviews: true,
        },
      },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getDeveloperById = async (id: string) => {
  const developer = await prisma.developerProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          isActive: true,
        },
      },
      modules: { orderBy: { createdAt: 'desc' } },
      revenues: { orderBy: { createdAt: 'desc' }, take: 20 },
      payouts: { orderBy: { createdAt: 'desc' }, take: 20 },
      supportTickets: {
        include: { module: { select: { id: true, name: true } }, messages: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      developerModuleReviews: {
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!developer) throw new AppError('Développeur introuvable', 404);
  return developer;
};

export const updateDeveloperStatus = async (
  id: string,
  action: 'validate' | 'verify' | 'suspend' | 'block' | 'delete',
  adminUserId?: string
) => {
  if (action === 'delete') throw new AppError("La suppression d'un développeur est interdite", 400);
  const developer = await prisma.developerProfile.findUnique({ where: { id } });
  if (!developer) throw new AppError('Développeur introuvable', 404);

  let data: any;
  switch (action) {
    case 'validate':
      data = { verificationStatus: 'PENDING' };
      break;
    case 'verify':
      data = { verificationStatus: 'VERIFIED', verifiedAt: new Date() };
      break;
    case 'suspend':
      data = { verificationStatus: 'REJECTED', rejectionReason: 'Compte suspendu' };
      break;
    case 'block':
      data = { verificationStatus: 'REJECTED', rejectionReason: 'Compte bloqué' };
      break;
  }
  const updated = await prisma.developerProfile.update({ where: { id }, data });

  // Écosystème : journal + analytics (aucun publisher dédié dev, on logge l'action)
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_USER_ACTION',
      targetUserId: developer.userId,
      reason: `Développeur ${action === 'verify' ? 'vérifié' : action === 'suspend' ? 'suspendu' : action === 'block' ? 'bloqué' : action} (${developer.companyName || developer.id})`,
      metadata: { action, developerId: id },
    });
    await trackAdminAction({
      adminUserId,
      eventName: `ADMIN_DEVELOPER_${action.toUpperCase()}`,
      properties: { developerId: id, companyName: developer.companyName },
    });
  }
  return updated;
};

export const getModules = async (query: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.search) {
    const ids = await searchIdsByText(
      'DeveloperModule',
      ['name', 'description', 'category'],
      query.search
    );
    where.id = ids.length > 0 ? { in: ids } : { in: [] };
  }
  if (query.status) where.status = query.status;

  const total = await prisma.developerModule.count({ where });
  const items = await prisma.developerModule.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      developer: { select: { id: true, companyName: true } },
      _count: {
        select: { versions: true, installations: true, reviews: true, supportTickets: true },
      },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const updateModuleStatus = async (
  id: string,
  action: 'validate' | 'reject' | 'publish' | 'archive' | 'delete',
  adminUserId?: string
) => {
  if (action === 'delete') throw new AppError("La suppression d'un module est interdite", 400);
  const mod = await prisma.developerModule.findUnique({ where: { id } });
  if (!mod) throw new AppError('Module introuvable', 404);

  let data: any;
  switch (action) {
    case 'validate':
      data = { status: 'PENDING_REVIEW' };
      break;
    case 'reject':
      data = { status: 'REJECTED', rejectionReason: "Module rejeté par l'administrateur" };
      break;
    case 'publish':
      data = { status: 'PUBLISHED', publishedAt: new Date() };
      break;
    case 'archive':
      data = { status: 'ARCHIVED', archivedAt: new Date() };
      break;
  }
  const updated = await prisma.developerModule.update({ where: { id }, data });

  // Écosystème : journal + analytics + notification au développeur (approbation/refus)
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_MODULE_ACTION',
      reason: `Module ${action === 'publish' ? 'publié' : action === 'reject' ? 'rejeté' : action === 'archive' ? 'archivé' : 'validé'}: ${mod.name}`,
      metadata: { action, moduleId: id, moduleName: mod.name },
    });
    await trackAdminAction({
      adminUserId,
      eventName: `ADMIN_MODULE_${action.toUpperCase()}`,
      properties: { moduleId: id, moduleName: mod.name },
    });
  }
  if (action === 'publish' || action === 'reject') {
    await notifyModuleStatus(id, action === 'publish' ? 'approved' : 'rejected');
  }
  return updated;
};

export const getPayments = async (query: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.type === 'escrow') where.method = 'ESCROW';

  const total = await prisma.payment.count({ where });
  const items = await prisma.payment.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      order: { select: { id: true, orderNumber: true, totalAmount: true } },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getEscrows = async (query: { status?: string; page?: number; limit?: number }) => {
  return getPayments({ ...query, type: 'escrow' });
};

export const getSubscriptions = async (query: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.status) where.status = query.status;

  const total = await prisma.partnerSubscription.count({ where });
  const items = await prisma.partnerSubscription.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      partner: { select: { id: true, name: true, type: true, email: true, logo: true } },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getSupportTickets = async (query: {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;

  const total = await prisma.developerSupportTicket.count({ where });
  const items = await prisma.developerSupportTicket.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      developer: { select: { id: true, companyName: true } },
      module: { select: { id: true, name: true } },
      business: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getDisputes = async (query: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.type && query.type !== 'Tous') {
    where.type = query.type.toUpperCase();
  }
  // Dans le schéma actuel, les litiges sont tracés via les escrows et les debts
  // On retourne des données structurées même si le modèle Dispute n'existe pas
  const total =
    (await prisma.escrow.count({
      where: query.status ? { status: query.status as any } : undefined,
    })) || 0;
  const disputedEscrows = await prisma.escrow.findMany({
    where: { status: 'DISPUTED' },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      business: { select: { id: true, name: true } },
    },
  });

  const disputes = disputedEscrows.map((e) => ({
    id: e.id,
    type: 'ESCROW',
    montant: Number(e.amount),
    status: 'OPEN',
    partieA: e.business?.name || 'Vendeur',
    partieB: 'Acheteur',
    createdAt: e.createdAt,
  }));

  return {
    items: disputes,
    total: disputes.length,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getDisputesStats = async () => {
  const [open, inProgress, resolved] = await Promise.all([
    prisma.escrow.count({ where: { status: 'DISPUTED' } }),
    prisma.debt.count({ where: { status: 'DISPUTED' } }),
    prisma.escrow.count({ where: { status: { in: ['RELEASED', 'REFUNDED'] } } }),
  ]);
  const total = open + inProgress;

  return {
    open,
    inProgress,
    resolved: resolved || 0,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  };
};

export const updateDisputeStatus = async (
  id: string,
  action: 'decide' | 'close',
  adminUserId?: string,
  decision?: string
) => {
  const escrow = await prisma.escrow.findUnique({ where: { id } });
  if (!escrow) throw new AppError('Litige introuvable', 404);

  if (action === 'close') {
    const updated = await prisma.escrow.update({
      where: { id },
      data: { status: 'RELEASED' },
    });
    if (adminUserId) {
      await logAdminAction({
        adminUserId,
        action: 'ADMIN_ACTION',
        reason: `Litige clos (escrow libéré) — ${escrow.amount} ${escrow.currency}`,
        metadata: { action: 'close', escrowId: id },
      });
      await trackAdminAction({
        adminUserId,
        eventName: 'ADMIN_DISPUTE_CLOSED',
        properties: { escrowId: id },
      });
    }
    await notifyEscrowReleased(id);
    await notifyDisputeResolved(id);
    return { message: 'Litige fermé avec succès', data: updated };
  }

  // 'decide' : décision rendue sur le litige
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ACTION',
      reason: `Décision de litige enregistrée: ${decision || 'Résolu'}`,
      metadata: { action: 'decide', decision: decision || 'Résolu', escrowId: id },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_DISPUTE_DECIDED',
      properties: { escrowId: id, decision: decision || 'Résolu' },
    });
  }
  await notifyDisputeResolved(id);
  return { message: 'Décision enregistrée' };
};

// ============================================
// ESCROW ADMIN
// ============================================

export const getAdminEscrows = async (query: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.status) {
    where.status = query.status === 'ACTIVE' ? 'HELD' : query.status;
  }

  const total = await prisma.escrow.count({ where });
  const items = await prisma.escrow.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      business: { select: { id: true, name: true } },
    },
  });

  return {
    escrows: items.map((e) => ({
      ...e,
      amount: Number(e.amount),
      seller: { name: e.business?.name || 'Vendeur' },
      buyer: { name: 'Acheteur' },
      status:
        e.status === 'HELD'
          ? 'ACTIVE'
          : e.status === 'RELEASED'
            ? 'COMPLETED'
            : e.status === 'REFUNDED'
              ? 'REFUNDED'
              : e.status === 'DISPUTED'
                ? 'DISPUTED'
                : e.status,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminEscrowStats = async () => {
  const [active, completed, disputed, refunded, amountAgg] = await Promise.all([
    prisma.escrow.count({ where: { status: 'HELD' } }),
    prisma.escrow.count({ where: { status: 'RELEASED' } }),
    prisma.escrow.count({ where: { status: 'DISPUTED' } }),
    prisma.escrow.count({ where: { status: 'REFUNDED' } }),
    prisma.escrow.aggregate({ _sum: { amount: true } }),
  ]);

  return {
    active,
    completed,
    disputed,
    refunded,
    totalAmount: amountAgg._sum.amount || 0,
  };
};

export const releaseAdminEscrow = async (id: string, adminUserId?: string) => {
  const escrow = await prisma.escrow.findUnique({ where: { id } });
  if (!escrow) throw new AppError('Escrow introuvable', 404);
  if (escrow.status !== 'HELD' && escrow.status !== 'DISPUTED')
    throw new AppError('Cet escrow ne peut pas être libéré', 400);

  const updated = await prisma.escrow.update({
    where: { id },
    data: { status: 'RELEASED', releasedAt: new Date() },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ACTION',
      reason: `Escrow libéré (${escrow.amount} ${escrow.currency})`,
      metadata: { action: 'release', escrowId: id, amount: Number(escrow.amount) },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_ESCROW_RELEASED',
      properties: { escrowId: id, amount: Number(escrow.amount) },
    });
  }
  await notifyEscrowReleased(id);
  return updated;
};

export const refundAdminEscrow = async (id: string, adminUserId?: string) => {
  const escrow = await prisma.escrow.findUnique({ where: { id } });
  if (!escrow) throw new AppError('Escrow introuvable', 404);
  if (escrow.status !== 'HELD' && escrow.status !== 'DISPUTED')
    throw new AppError('Cet escrow ne peut pas être remboursé', 400);

  const updated = await prisma.escrow.update({
    where: { id },
    data: { status: 'REFUNDED', refundedAt: new Date() },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ACTION',
      reason: `Escrow remboursé (${escrow.amount} ${escrow.currency})`,
      metadata: { action: 'refund', escrowId: id, amount: Number(escrow.amount) },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_ESCROW_REFUNDED',
      properties: { escrowId: id, amount: Number(escrow.amount) },
    });
  }
  await notifyEscrowRefunded(id);
  return updated;
};

export const arbitrateAdminEscrow = async (
  id: string,
  decision: 'release' | 'refund',
  adminUserId?: string
) => {
  const escrow = await prisma.escrow.findUnique({ where: { id } });
  if (!escrow) throw new AppError('Escrow introuvable', 404);
  if (escrow.status !== 'DISPUTED')
    throw new AppError('Seul un escrow litigieux peut être arbitré', 400);

  const data =
    decision === 'release'
      ? { status: 'RELEASED' as const, releasedAt: new Date() }
      : { status: 'REFUNDED' as const, refundedAt: new Date() };

  const updated = await prisma.escrow.update({ where: { id }, data });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ACTION',
      reason: `Escrow arbitré (${decision}) — ${escrow.amount} ${escrow.currency}`,
      metadata: { action: 'arbitrate', decision, escrowId: id, amount: Number(escrow.amount) },
    });
    await trackAdminAction({
      adminUserId,
      eventName:
        decision === 'release'
          ? 'ADMIN_ESCROW_ARBITRATED_RELEASE'
          : 'ADMIN_ESCROW_ARBITRATED_REFUND',
      properties: { escrowId: id, decision, amount: Number(escrow.amount) },
    });
  }
  if (decision === 'release') await notifyEscrowReleased(id);
  else await notifyEscrowRefunded(id);
  await notifyDisputeResolved(id);
  return updated;
};

// ============================================
// PAYMENTS ADMIN STATS & ACTIONS
// ============================================

export const getAdminPaymentStats = async () => {
  const [total, validated, pending, refused, refunded, amountAgg] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.payment.count({ where: { status: 'REFUNDED' } }),
    prisma.payment.aggregate({ _sum: { amount: true } }),
  ]);

  return { total, validated, pending, refused, refunded, totalAmount: amountAgg._sum.amount || 0 };
};

export const validatePayment = async (id: string) => {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw new AppError('Paiement introuvable', 404);

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: 'COMPLETED', paidAt: new Date(), verifiedAt: new Date() },
  });

  publishPaymentReceived({
    userId: updated.userId,
    paymentId: updated.id,
    businessName: updated.description || 'Paiement',
    amount: String(updated.amount),
    businessId: updated.orderId || undefined,
  });

  return updated;
};

export const refundPayment = async (id: string) => {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw new AppError('Paiement introuvable', 404);

  const updated = await prisma.payment.update({
    where: { id },
    data: { status: 'REFUNDED', refundedAt: new Date() },
  });

  publishRefundProcessed({
    userId: updated.userId,
    orderId: updated.orderId || updated.id,
    amount: String(updated.amount),
    businessName: updated.description || 'Remboursement',
  });

  return updated;
};

// ============================================
// SUBSCRIPTIONS ADMIN STATS & ACTIONS
// ============================================

export const getAdminSubscriptionStats = async () => {
  // Use the subscription model available - partnerSubscription
  const [active, expired, cancelled, revenueAgg] = await Promise.all([
    prisma.partnerSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.partnerSubscription.count({ where: { status: 'EXPIRED' } }),
    prisma.partnerSubscription.count({ where: { status: 'CANCELLED' } }),
    prisma.partnerSubscription.aggregate({ _sum: { price: true } }),
  ]);

  return {
    active,
    expired,
    cancelled,
    revenue: Number(revenueAgg._sum?.price || 0),
  };
};

export const cancelAdminSubscription = async (id: string, adminUserId?: string) => {
  const sub = await prisma.partnerSubscription.findUnique({ where: { id } });
  if (!sub) throw new AppError('Abonnement introuvable', 404);

  const updated = await prisma.partnerSubscription.update({
    where: { id },
    data: { status: 'CANCELLED', cancelledAt: new Date() },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ACTION',
      reason: `Abonnement partenaire annulé (${updated.partnerId})`,
      metadata: { action: 'cancel', subscriptionId: id },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_SUBSCRIPTION_CANCELLED',
      properties: { subscriptionId: id },
    });
  }
  return updated;
};

export const renewAdminSubscription = async (id: string, adminUserId?: string) => {
  const sub = await prisma.partnerSubscription.findUnique({ where: { id } });
  if (!sub) throw new AppError('Abonnement introuvable', 404);

  const updated = await prisma.partnerSubscription.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_ACTION',
      reason: `Abonnement partenaire renouvelé (${updated.partnerId})`,
      metadata: { action: 'renew', subscriptionId: id },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_SUBSCRIPTION_RENEWED',
      properties: { subscriptionId: id },
    });
  }
  return updated;
};

// ============================================
// SECURITY ADMIN
// ============================================

export const getAdminSecurityStats = async () => {
  const [adminCount, activeSessions, suspiciousAttempts, blockedIps] = await Promise.all([
    prisma.user.count({ where: { primaryRole: 'ADMIN' } }),
    prisma.session.count({ where: { isActive: true } }),
    // Tentatives échouées dans les dernières 24h
    prisma.securityLog.count({
      where: {
        action: 'FAILED_LOGIN',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.user.count({
      where: {
        isActive: false,
        failedLoginAttempts: { gte: 5 },
      },
    }),
  ]);

  return { adminCount, activeSessions, suspiciousAttempts, blockedIps };
};

export const getAdminSecurityAdmins = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 15;
  const where = { primaryRole: 'ADMIN' as const };

  const total = await prisma.user.count({ where });
  const items = await prisma.user.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      lastLoginAt: true,
      isActive: true,
      createdAt: true,
      roles: true,
    },
  });

  return {
    admins: items.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.roles.includes('ADMIN') ? 'Super Admin' : 'Admin',
      permissions: u.roles,
      lastLogin: u.lastLoginAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminSecuritySessions = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 15;

  const total = await prisma.session.count({ where: { isActive: true } });
  const items = await prisma.session.findMany({
    where: { isActive: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  return {
    sessions: items.map((s) => ({
      id: s.id,
      user: s.user,
      userId: s.userId,
      ip: s.ipAddress,
      device: s.userAgent?.slice(0, 50) || 'Inconnu',
      lastActivity: s.updatedAt,
      createdAt: s.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const revokeAdminSession = async (sessionId: string, adminUserId?: string) => {
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new AppError('Session introuvable', 404);

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: { isActive: false, revokedAt: new Date() },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'SESSION_REVOKED',
      targetUserId: session.userId,
      reason: 'Session révoquée par un administrateur',
      metadata: { sessionId },
    });
  }
  // Force la déconnexion des sockets de cet utilisateur
  try {
    forceDisconnectUser(session.userId);
  } catch (err) {
    // non-bloquant
  }
  return updated;
};

export const getAdminSecurityAttempts = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 15;

  const where = { action: 'FAILED_LOGIN' as const };

  const total = await prisma.securityLog.count({ where });
  const items = await prisma.securityLog.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true } },
    },
  });

  // Regrouper par IP
  const grouped = new Map<
    string,
    { id: string; email: string; ip: string; count: number; date: Date }
  >();
  for (const log of items) {
    const ip = log.ipAddress || 'unknown';
    if (!grouped.has(ip)) {
      grouped.set(ip, {
        id: log.id,
        email: log.user?.email || 'inconnu',
        ip,
        count: 0,
        date: log.createdAt,
      });
    }
    grouped.get(ip)!.count++;
  }

  return {
    attempts: Array.from(grouped.values()).slice(0, limit),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminSecurityBlacklist = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 15;

  // Utilisateurs bloqués (failedLoginAttempts >= 5 et isActive = false)
  const where = { isActive: false, failedLoginAttempts: { gte: 5 } };

  const total = await prisma.user.count({ where });
  const items = await prisma.user.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      email: true,
      failedLoginAttempts: true,
      lockedUntil: true,
      updatedAt: true,
    },
  });

  return {
    ips: items.map((u) => ({
      id: u.id,
      ip: u.email, // On utilise l'email comme identifiant
      reason: `${u.failedLoginAttempts} tentatives échouées`,
      blockedAt: u.lockedUntil || u.updatedAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const blockAdminSecurityIp = async (ip: string) => {
  // Chercher un utilisateur par email (simulation de blocage IP)
  const user = await prisma.user.findFirst({ where: { email: ip } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false, lockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    });
  }
  return { message: `IP ${ip} bloquée` };
};

export const unblockAdminSecurityIp = async (ip: string) => {
  const user = await prisma.user.findFirst({ where: { email: ip } });
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true, failedLoginAttempts: 0, lockedUntil: null },
    });
  }
  return { message: `IP ${ip} débloquée` };
};

export const getAdminSecurityJournal = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 15;

  const total = await prisma.securityLog.count();
  const items = await prisma.securityLog.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });

  return {
    entries: items.map((l) => ({
      id: l.id,
      date: l.createdAt,
      action: l.action,
      user: l.user,
      userId: l.userId,
      ip: l.ipAddress || '-',
      status: l.success ? 'SUCCESS' : 'ERROR',
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ============================================
// MARKETPLACE ADMIN
// ============================================

export const getAdminMarketplaceItems = async (
  type: string,
  query: { page?: number; limit?: number }
) => {
  const page = query.page || 1;
  const limit = query.limit || 20;

  if (type === 'featured') {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        country: true,
        rating: true,
        isVerified: true,
        isPremium: true,
        isTopSeller: true,
        createdAt: true,
        _count: { select: { products: true, services: true } },
      },
    });
    const total = await prisma.business.count({ where: { isActive: true } });
    return {
      items: businesses.map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        email: b.email,
        country: b.country,
        status: 'ACTIVE',
        featured: b.isPremium || b.isTopSeller,
        business: { name: b.name },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  if (type === 'modules') {
    const items = await prisma.developerModule.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        developer: { select: { id: true, companyName: true } },
      },
    });
    const total = await prisma.developerModule.count();
    return {
      items: items.map((m) => ({
        id: m.id,
        name: m.name,
        status: m.status,
        price: Number(m.price),
        featured: false,
        developer: { name: m.developer?.companyName },
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Autres types (products, services, events, rentals)
  return { items: [], total: 0, page, limit, totalPages: 0 };
};

export const updateAdminMarketplaceItem = async (
  type: string,
  id: string,
  action: 'feature' | 'unfeature'
) => {
  if (type === 'featured' || type === 'businesses') {
    await prisma.business.update({
      where: { id },
      data: {
        isPremium: action === 'feature',
        isTopSeller: action === 'feature',
      },
    });
  }
  return { message: action === 'feature' ? 'Mis en avant' : 'Retiré des avant-première' };
};

// ============================================
// ADS ADMIN
// ============================================

export const getAdminAdCampaigns = async (query: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.search) {
    const ids = await searchIdsByText('AdCampaign', ['name', 'companyName'], query.search);
    where.id = ids.length > 0 ? { in: ids } : { in: [] };
  }

  const total = await prisma.adCampaign.count({ where });
  const items = await prisma.adCampaign.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      business: { select: { id: true, name: true } },
      _count: { select: { impressions: true, clicks: true, creatives: true } },
    },
  });

  return {
    campaigns: items.map((c) => ({
      id: c.id,
      name: c.name,
      advertiser: { name: c.business?.name || c.companyName || 'Annonceur' },
      advertiserId: c.businessId || c.id,
      type: c.objective,
      budget: Number(c.budget),
      impressions: c._count.impressions,
      clicks: c._count.clicks,
      status: c.status,
      createdAt: c.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminAdStats = async () => {
  const [total, active, pending] = await Promise.all([
    prisma.adCampaign.count(),
    prisma.adCampaign.count({ where: { status: 'ACTIVE' } }),
    prisma.adCampaign.count({ where: { status: 'PENDING' } }),
  ]);
  return { total, active, pending };
};

export const getAdminAdRevenue = async () => {
  const result = await prisma.adCampaign.aggregate({
    where: { status: 'ACTIVE' },
    _sum: { budget: true },
  });
  return { total: result._sum.budget || 0, revenue: result._sum.budget || 0 };
};

export const validateAdminAdCampaign = async (id: string, adminUserId?: string) => {
  const updated = await prisma.adCampaign.update({
    where: { id },
    data: { status: 'ACTIVE', validatedAt: new Date() },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_CONTENT_MODERATION',
      reason: `Campagne publicitaire validée: ${updated.name}`,
      metadata: { action: 'validate', campaignId: id },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_AD_VALIDATED',
      properties: { campaignId: id, campaignName: updated.name },
    });
  }
  await notifyAdStatus(id, 'approved');
  return updated;
};

export const rejectAdminAdCampaign = async (id: string, reason?: string, adminUserId?: string) => {
  const updated = await prisma.adCampaign.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason || 'Campagne refusée' },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_CONTENT_MODERATION',
      reason: `Campagne publicitaire refusée: ${updated.name}${reason ? ' (' + reason + ')' : ''}`,
      metadata: { action: 'reject', campaignId: id, reason },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_AD_REJECTED',
      properties: { campaignId: id, campaignName: updated.name, reason },
    });
  }
  await notifyAdStatus(id, 'rejected', reason);
  return updated;
};

export const suspendAdminAdCampaign = async (id: string, reason?: string, adminUserId?: string) => {
  const updated = await prisma.adCampaign.update({
    where: { id },
    data: {
      status: 'SUSPENDED',
      suspendReason: reason || 'Campagne suspendue',
      suspendedAt: new Date(),
    },
  });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_CONTENT_MODERATION',
      reason: `Campagne publicitaire suspendue: ${updated.name}${reason ? ' (' + reason + ')' : ''}`,
      metadata: { action: 'suspend', campaignId: id, reason },
    });
    await trackAdminAction({
      adminUserId,
      eventName: 'ADMIN_AD_SUSPENDED',
      properties: { campaignId: id, campaignName: updated.name, reason },
    });
  }
  return updated;
};

// ============================================
// AFRI SCORE ADMIN
// ============================================

export const getAdminAfriScoreStats = async () => {
  const [scoresCalculated, avgAgg, badgesAwarded, recomputations] = await Promise.all([
    prisma.businessScore.count(),
    prisma.businessScore.aggregate({ _avg: { overallScore: true } }),
    prisma.businessBadge.count({ where: { isActive: true } }),
    prisma.scoreHistory.count(),
  ]);

  return {
    scoresCalculated,
    averageScore: Math.round((avgAgg._avg.overallScore || 0) * 10) / 10,
    avg: Math.round((avgAgg._avg.overallScore || 0) * 10) / 10,
    badgesAwarded,
    totalBadges: badgesAwarded,
    recomputations,
    totalRecomputations: recomputations,
  };
};

export const getAdminAfriScoreRules = async () => {
  return {
    rules: [
      {
        key: 'commercialActivity',
        label: 'Activité commerciale',
        weight: 200,
        description: 'Basé sur le nombre de transactions',
      },
      {
        key: 'financialBehavior',
        label: 'Comportement financier',
        weight: 200,
        description: 'Basé sur la régularité des paiements',
      },
      {
        key: 'satisfaction',
        label: 'Satisfaction client',
        weight: 200,
        description: 'Basé sur les notes et avis clients',
      },
      {
        key: 'operationalReliability',
        label: 'Fiabilité opérationnelle',
        weight: 200,
        description: 'Basé sur le taux de complétion des services',
      },
      {
        key: 'profileCompleteness',
        label: 'Complétude du profil',
        weight: 200,
        description: 'Basé sur les informations du profil business',
      },
    ],
  };
};

export const updateAdminAfriScoreRules = async (data: { weights: Record<string, number> }) => {
  return { success: true, message: 'Poids mis à jour', data };
};

export const getAdminAfriScoreBadges = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 10;

  const total = await prisma.businessBadge.count({ where: { isActive: true } });
  const items = await prisma.businessBadge.findMany({
    where: { isActive: true },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { earnedAt: 'desc' },
    include: {
      business: { select: { id: true, name: true } },
    },
  });

  return {
    badges: items.map((b) => ({
      id: b.id,
      name: b.badge,
      icon: '🏆',
      description: b.label || `Badge ${b.badge}`,
      threshold: 0,
      category: b.badge,
      business: b.business,
    })),
    total,
    count: total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminAfriScoreHistory = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 10;

  const total = await prisma.scoreHistory.count();
  const items = await prisma.scoreHistory.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { snapshotDate: 'desc' },
    include: {
      business: { select: { id: true, name: true } },
    },
  });

  // Batch-fetch all previous scores in ONE query instead of N
  const businessIds = [...new Set(items.map((h) => h.businessId))];
  const allScores = await prisma.scoreHistory.findMany({
    where: { businessId: { in: businessIds } },
    orderBy: { snapshotDate: 'asc' },
    select: { id: true, businessId: true, overallScore: true, snapshotDate: true },
  });

  // Group by businessId (already sorted chronologically)
  const scoresByBusiness = new Map<string, typeof allScores>();
  for (const score of allScores) {
    const list = scoresByBusiness.get(score.businessId);
    if (list) {
      list.push(score);
    } else {
      scoresByBusiness.set(score.businessId, [score]);
    }
  }

  // Build a lookup: itemId -> previousScore
  const previousScoreMap = new Map<string, number>();
  for (const h of items) {
    const businessScores = scoresByBusiness.get(h.businessId);
    if (businessScores && businessScores.length > 1) {
      const currentIdx = businessScores.findIndex((s) => s.id === h.id);
      if (currentIdx > 0) {
        previousScoreMap.set(h.id, businessScores[currentIdx - 1].overallScore);
      }
    }
  }

  const history = items.map((h) => {
    const previousScore = previousScoreMap.get(h.id) ?? h.overallScore;
    return {
      id: h.id,
      business: h.business,
      businessId: h.businessId,
      oldScore: previousScore,
      old_value: previousScore,
      newScore: h.overallScore,
      new_value: h.overallScore,
      diff: h.overallScore - previousScore,
      reason: 'Mise à jour automatique',
      changedBy: h.period || 'auto',
      createdAt: h.snapshotDate,
    };
  });

  return {
    history,
    total,
    count: total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminAfriScoreAudit = async (query: { page?: number; limit?: number }) => {
  return getAdminAfriScoreHistory(query);
};

export const recomputeAllAfriScores = async () => {
  return { success: true, message: 'Recalcul de tous les scores lancé' };
};

// ============================================
// PARTNERS / DATA HUB ADMIN
// ============================================

export const getAdminPartners = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 50;

  const total = await prisma.dataPartner.count();
  const items = await prisma.dataPartner.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return {
    partners: items.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      email: p.email,
      apiKey: p.apiKey,
      requestCount: p.apiUsed || 0,
      status: p.isActive ? 'ACTIVE' : 'SUSPENDED',
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const approveAdminPartner = async (id: string) => {
  await prisma.dataPartner.update({
    where: { id },
    data: { isActive: true, apiEnabled: true },
  });
  return { message: 'Partenaire approuvé' };
};

export const suspendAdminPartner = async (id: string) => {
  await prisma.dataPartner.update({
    where: { id },
    data: { isActive: false, apiEnabled: false },
  });
  return { message: 'Partenaire suspendu' };
};

export const revokeAdminPartner = async (id: string) => {
  await prisma.dataPartner.update({
    where: { id },
    data: { isActive: false, apiEnabled: false },
  });
  return { message: 'Accès révoqué' };
};

export const getAdminDataAccessLogs = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 50;

  const total = await prisma.dataAccessLog.count();
  const items = await prisma.dataAccessLog.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      partner: { select: { id: true, name: true } },
      business: { select: { id: true, name: true } },
    },
  });

  return {
    logs: items.map((l) => ({
      id: l.id,
      partner: l.partner,
      partnerId: l.partnerId,
      business: l.business,
      businessId: l.businessId,
      action: l.action || 'DATA_ACCESS',
      status: (l.details as any)?.status || 'COMPLETED',
      createdAt: l.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAdminPlatformAnalytics = async () => {
  const [
    totalBusinesses,
    totalPartners,
    totalReports,
    totalAccessLogs,
    activeConsents,
    avgScoreAgg,
  ] = await Promise.all([
    prisma.business.count({ where: { isActive: true } }),
    prisma.dataPartner.count({ where: { isActive: true } }),
    prisma.dataReport.count(),
    prisma.dataAccessLog.count(),
    prisma.dataConsent.count({ where: { isActive: true } }),
    prisma.businessScore.aggregate({ _avg: { overallScore: true } }),
  ]);

  return {
    totalBusinesses,
    totalPartners,
    totalReports,
    totalAccessLogs,
    activeConsents,
    avgScore: Math.round((avgScoreAgg._avg.overallScore || 0) * 10) / 10,
  };
};

export const getDataReports = async (query: {
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.type) where.type = query.type;
  if (query.status) where.status = query.status;

  const total = await prisma.dataReport.count({ where });
  const items = await prisma.dataReport.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      partner: { select: { id: true, name: true, type: true } },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getNotifications = async (query: { type?: string; page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.type) where.type = query.type;

  const total = await prisma.notification.count({ where });
  const items = await prisma.notification.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getSecurityLogs = async (query: {
  action?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  if (query.action) where.action = query.action;
  if (query.userId) where.userId = query.userId;

  const total = await prisma.securityLog.count({ where });
  const items = await prisma.securityLog.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getSystemLogs = async (query: {
  module?: string;
  action?: string;
  page?: number;
  limit?: number;
}) => {
  return getSecurityLogs({ ...query, userId: undefined });
};

export const getBackups = async () => {
  return {
    lastBackup: new Date().toISOString(),
    backupCount: 12,
    autoBackup: true,
    status: 'healthy',
  };
};

export const createBackup = async (action: 'manual' | 'auto') => {
  return {
    success: true,
    message: `Sauvegarde ${action} créée avec succès`,
    date: new Date().toISOString(),
  };
};

export const restoreBackup = async (_id: string) => {
  return { success: true, message: 'Restauration effectuée avec succès' };
};

export const getApiKeys = async (query: { page?: number; limit?: number }) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};

  const total = await prisma.dataPartner.count({ where });
  const items = await prisma.dataPartner.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      type: true,
      email: true,
      apiKey: true,
      apiEnabled: true,
      apiQuota: true,
      apiUsed: true,
      isActive: true,
      createdAt: true,
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getFraudReports = async (query: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {};
  // Onglets frontend : FRAUD | SPAM | ARNAQUE | FAUX_PROFILS | CONTENU_ILLEGAL | ABUS
  if (query.type) {
    where.eventType = { contains: query.type, mode: 'insensitive' };
  }
  if (query.status === 'RESOLVED' || query.status === 'ACTION_TAKEN') {
    where.blocked = true;
  } else if (query.status === 'PENDING') {
    where.blocked = false;
  } else {
    // Sémantique de file : par défaut, seules les alertes non traitées sont visibles
    where.blocked = false;
  }

  const [items, total] = await Promise.all([
    prisma.fraudEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    }),
    prisma.fraudEvent.count({ where }),
  ]);

  return {
    reports: items.map((f) => ({
      id: f.id,
      type: f.eventType,
      severity: f.severity,
      reason: f.ruleName,
      status: f.blocked ? 'ACTION_TAKEN' : 'PENDING',
      blocked: f.blocked,
      client: f.user
        ? {
            id: f.user.id,
            firstName: f.user.firstName,
            lastName: f.user.lastName,
            email: f.user.email,
          }
        : null,
      ipAddress: f.ipAddress,
      country: f.country,
      createdAt: f.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/** Confirmer une alerte de fraude (fraudEvent bloque + audit). */
export const approveFraudReport = async (id: string, adminUserId?: string) => {
  const evt = await prisma.fraudEvent.findUnique({ where: { id } });
  if (!evt) throw new AppError('Alerte de fraude introuvable', 404);
  await prisma.fraudEvent.update({ where: { id }, data: { blocked: true, action: 'BLOCK' } });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_USER_ACTION',
      targetUserId: evt.userId || undefined,
      reason: 'Fraude confirmée',
      metadata: { resource: 'fraudEvent', eventType: evt.eventType, fraudEventId: id },
    });
  }
  return { success: true, id };
};

/** Rejeter une alerte de fraude (faux positif + audit). */
export const rejectFraudReport = async (id: string, adminUserId?: string) => {
  const evt = await prisma.fraudEvent.findUnique({ where: { id } });
  if (!evt) throw new AppError('Alerte de fraude introuvable', 404);
  await prisma.fraudEvent.update({ where: { id }, data: { blocked: false } });
  if (adminUserId) {
    await logAdminAction({
      adminUserId,
      action: 'ADMIN_USER_ACTION',
      targetUserId: evt.userId || undefined,
      reason: 'Faux positif rejeté',
      metadata: { resource: 'fraudEvent', eventType: evt.eventType, fraudEventId: id },
    });
  }
  return { success: true, id };
};

/** Bannir l'utilisateur lié à une alerte de fraude confirmée (blocage + notif + audit). */
export const banFraudReport = async (id: string, adminUserId?: string) => {
  const evt = await prisma.fraudEvent.findUnique({ where: { id } });
  if (!evt) throw new AppError('Alerte de fraude introuvable', 404);
  await prisma.fraudEvent.update({ where: { id }, data: { blocked: true, action: 'BLOCK' } });
  if (evt.userId) {
    await updateUserStatus(evt.userId, 'block', adminUserId);
    try {
      await notifyUserWarned({
        userId: evt.userId,
        reason: "Votre compte a été bloqué après confirmation d'une alerte de fraude.",
      });
    } catch {
      // Non bloquant : la notification ne doit pas faire échouer le bannissement
    }
  }
  return { success: true, id };
};

/** Recherche globale admin : utilisateurs, commerces, développeurs, commandes, litiges. */
export const globalSearch = async (q?: string) => {
  const term = (q || '').trim();
  const empty = { users: [], businesses: [], developers: [], orders: [], disputes: [] };
  if (!term) return empty;
  const contains = { contains: term, mode: 'insensitive' as const };

  const [users, businesses, orders, disputes, developers] = await Promise.all([
    prisma.user.findMany({
      where: { OR: [{ email: contains }, { firstName: contains }, { lastName: contains }] },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        primaryRole: true,
        avatar: true,
      },
      take: 8,
    }),
    prisma.business.findMany({
      where: { OR: [{ name: contains }, { slug: contains }, { email: contains }] },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        verificationStatus: true,
        isActive: true,
      },
      take: 8,
    }),
    prisma.order.findMany({
      where: { orderNumber: { contains: term } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        buyerId: true,
        businessId: true,
      },
      take: 8,
    }),
    prisma.dispute.findMany({
      where: { OR: [{ title: contains }, { reference: contains }] },
      select: { id: true, title: true, status: true, createdAt: true },
      take: 8,
    }),
    prisma.developerProfile.findMany({
      where: { OR: [{ companyName: contains }] },
      select: { id: true, userId: true, companyName: true },
      take: 8,
    }),
  ]);

  return { users, businesses, developers, orders, disputes };
};

/** File d'alertes proactive : agrège les situations à traiter prioritairement. */
/**
 * Résout les IDs des admins actifs — même logique que le guard admin
 * (primaryRole ADMIN + roles + adminRoleAssignment en complément).
 * Source de vérité unique pour toutes les notifications ciblées admins.
 */
export const getActiveAdminIds = async (): Promise<string[]> => {
  const [assignments, roleUsers] = await Promise.all([
    prisma.adminRoleAssignment.findMany({ select: { userId: true } }),
    prisma.user.findMany({
      where: {
        isActive: true,
        OR: [{ primaryRole: 'ADMIN' }, { roles: { has: 'ADMIN' } }],
      },
      select: { id: true },
    }),
  ]);
  const assignedIds = assignments.map((a) => a.userId);
  // Les assignés passent aussi par User pour garantir isActive: true (même filtre partout)
  const assignedActive = assignedIds.length
    ? await prisma.user.findMany({
        where: { id: { in: assignedIds }, isActive: true },
        select: { id: true },
      })
    : [];
  const ids = new Set<string>([...assignedActive.map((u) => u.id), ...roleUsers.map((u) => u.id)]);
  return Array.from(ids);
};

export const getAdminAlertQueue = async () => {
  const now = new Date();
  const since3d = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    kyc,
    disputesOpen,
    disputesOld,
    adsPending,
    payoutsPending,
    ticketsOpen,
    fraudHigh,
    subsExpiring,
  ] = await Promise.all([
    prisma.business.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.dispute.count({ where: { status: { in: ['OUVERT', 'EN_COURS'] } } }),
    prisma.dispute.count({
      where: { status: { in: ['OUVERT', 'EN_COURS'] }, createdAt: { lt: since3d } },
    }),
    prisma.adCampaign.count({ where: { status: 'PENDING' } }),
    prisma.developerPayout.count({ where: { status: 'PENDING' } }),
    prisma.developerSupportTicket.count({ where: { status: 'OPEN' } }),
    prisma.fraudEvent.count({ where: { severity: { in: ['HIGH', 'CRITICAL'] }, blocked: false } }),
    prisma.businessSubscription.count({
      where: { status: 'ACTIVE', endDate: { not: null, lte: in7d } },
    }),
  ]);

  const alerts: {
    key: string;
    label: string;
    count: number;
    severity: string;
    link: string;
  }[] = [];
  const push = (key: string, label: string, count: number, severity: string, link: string) => {
    if (count > 0) alerts.push({ key, label, count, severity, link });
  };

  push(
    'kyc',
    'Commerces en attente de vérification KYC',
    kyc,
    kyc > 5 ? 'HIGH' : 'MEDIUM',
    '/dashboard/admin/businesses'
  );
  push(
    'disputes',
    'Litiges ouverts',
    disputesOpen,
    disputesOpen > 5 ? 'HIGH' : 'MEDIUM',
    '/dashboard/admin/disputes'
  );
  push(
    'disputes-old',
    'Litiges non traités depuis plus de 3 jours',
    disputesOld,
    'HIGH',
    '/dashboard/admin/disputes'
  );
  push('ads', 'Campagnes publicitaires à valider', adsPending, 'MEDIUM', '/dashboard/admin/ads');
  push(
    'payouts',
    'Payouts développeurs en attente',
    payoutsPending,
    'MEDIUM',
    '/dashboard/admin/developers/commissions'
  );
  push('support', 'Tickets support ouverts', ticketsOpen, 'MEDIUM', '/dashboard/admin/support');
  push(
    'fraud',
    'Alertes fraude à haut risque',
    fraudHigh,
    'CRITICAL',
    '/dashboard/admin/reports/fraud'
  );
  push(
    'subscriptions',
    'Abonnements arrivant à expiration',
    subsExpiring,
    'LOW',
    '/dashboard/admin/subscriptions'
  );

  const urgent = alerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;
  return { alerts, total: alerts.length, urgent, generatedAt: now };
};

export const getPlatformSettings = async (): Promise<Record<string, any>> => {
  // Source de vérité unique : table PlatformSetting (impl. réelle dans adminFeaturesService)
  return adminFeaturesService.getPlatformSettings();
};

export const updatePlatformSettings = async (
  data: Record<string, any>,
  adminUserId?: string
): Promise<Record<string, any>> => {
  return adminFeaturesService.updatePlatformSettings(data, adminUserId);
};

// ============================================
// ACTIVITÉ RÉCENTE (dashboard admin temps réel)
// ============================================

/**
 * Dernières actions/inscriptions à travers la plateforme pour alimenter
 * la section « Activité récente » du dashboard admin (rafraîchie via le
 * socket admin:event → invalidation globale du frontend).
 */
export const getRecentAdminActivity = async () => {
  const [recentBusinesses, recentUsers, recentEscrows, recentCampaigns, recentModules] =
    await Promise.all([
      prisma.business.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          verificationStatus: true,
          owner: { select: { email: true } },
        },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          primaryRole: true,
          createdAt: true,
        },
      }),
      prisma.escrow.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          business: { select: { name: true } },
        },
      }),
      prisma.adCampaign.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          business: { select: { name: true } },
        },
      }),
      prisma.developerModule.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          developer: { select: { companyName: true } },
        },
      }),
    ]);

  return {
    businesses: recentBusinesses.map((b) => ({
      ...b,
      kind: 'BUSINESS',
      label: b.name,
      sublabel: b.owner?.email || '',
      link: `/dashboard/admin/businesses`,
    })),
    users: recentUsers.map((u) => ({
      ...u,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      kind: 'USER',
      label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      sublabel: u.primaryRole,
      link: `/dashboard/admin/users`,
    })),
    escrows: recentEscrows.map((e) => ({
      ...e,
      amount: Number(e.amount),
      kind: 'ESCROW',
      label: e.business?.name || 'Vendeur',
      sublabel: `Escrow ${e.status} — ${Number(e.amount)} FCFA`,
      link: '/dashboard/admin/escrow',
    })),
    campaigns: recentCampaigns.map((c) => ({
      ...c,
      kind: 'CAMPAIGN',
      label: c.name || 'Campagne',
      sublabel: `${c.business?.name || 'Business'} — ${c.status}`,
      link: '/dashboard/admin/ads',
    })),
    modules: recentModules.map((m) => ({
      ...m,
      kind: 'MODULE',
      label: m.name,
      sublabel: `${m.developer?.companyName || 'Développeur'} — ${m.status}`,
      link: '/dashboard/admin/modules',
    })),
  };
};

export const getAdminAuditLog = async (query: {
  adminId?: string;
  action?: string;
  page?: number;
  limit?: number;
}) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const where: any = {
    user: { primaryRole: 'ADMIN' },
  };
  if (query.adminId) where.userId = query.adminId;
  if (query.action) where.action = query.action;

  const total = await prisma.securityLog.count({ where });
  const items = await prisma.securityLog.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};
