import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { hasBusinessModule, activeModuleAssignmentsSelect } from '../lib/businessModules';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';
import { getMonetizationSettings } from './monetizationConfig';

// ===================== SUBSCRIPTION PLANS =====================

export async function listSubscriptionPlans(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.SubscriptionPlanWhereInput = { businessId: business.id };
  const { isActive, isPublic, type, search, page, limit } = filters;

  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (isPublic !== undefined) where.isPublic = isPublic === 'true';
  if (type) where.type = type;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const skip = (parseInt(page || '1') - 1) * parseInt(limit || '20');
  const take = parseInt(limit || '20');

  const [plans, total] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where,
      skip,
      take,
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        privileges: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { subscribers: { where: { status: 'ACTIVE' } } } },
      },
    }),
    prisma.subscriptionPlan.count({ where }),
  ]);

  return { plans, total, page: parseInt(page || '1'), limit: take };
}

export async function getSubscriptionPlan(ownerId: string, planId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, businessId: business.id },
    include: {
      privileges: { orderBy: { sortOrder: 'asc' } },
      subscribers: {
        where: { status: 'ACTIVE' },
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      },
    },
  });
  if (!plan) throw new AppError('Plan introuvable', 404);
  return plan;
}

export async function createSubscriptionPlan(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const plan = await prisma.subscriptionPlan.create({
    data: {
      businessId: business.id,
      name: data.name,
      description: data.description,
      type: data.type || 'STANDARD',
      price: data.price,
      currency: data.currency || 'FCFA',
      billingCycle: data.billingCycle || 'MONTHLY',
      trialDays: data.trialDays || 0,
      durationDays: data.durationDays,
      maxUsage: data.maxUsage,
      maxClients: data.maxClients,
      maxBookings: data.maxBookings,
      benefits: data.benefits || [],
      isPublic: data.isPublic !== false,
      isActive: true,
      sortOrder: data.sortOrder || 0,
      featured: data.featured || false,
      badge: data.badge,
    },
    include: { privileges: { orderBy: { sortOrder: 'asc' } } },
  });

  if (data.privileges && Array.isArray(data.privileges)) {
    await prisma.subscriptionPrivilege.createMany({
      data: data.privileges.map((p: any, i: number) => ({
        planId: plan.id,
        code: p.code,
        label: p.label,
        description: p.description,
        value: p.value,
        valueType: p.valueType,
        sortOrder: p.sortOrder || i,
      })),
    });
  }

  return prisma.subscriptionPlan.findUnique({
    where: { id: plan.id },
    include: { privileges: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function updateSubscriptionPlan(ownerId: string, planId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, businessId: business.id },
  });
  if (!existing) throw new AppError('Plan introuvable', 404);

  const updateData: any = {};
  [
    'name',
    'description',
    'type',
    'price',
    'currency',
    'billingCycle',
    'trialDays',
    'durationDays',
    'maxUsage',
    'maxClients',
    'maxBookings',
    'benefits',
    'isPublic',
    'isActive',
    'sortOrder',
    'featured',
    'badge',
  ].forEach((f) => {
    if (data[f] !== undefined) updateData[f] = data[f];
  });

  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: updateData,
    include: { privileges: { orderBy: { sortOrder: 'asc' } } },
  });

  if (data.privileges && Array.isArray(data.privileges)) {
    await prisma.subscriptionPrivilege.deleteMany({ where: { planId } });
    await prisma.subscriptionPrivilege.createMany({
      data: data.privileges.map((p: any, i: number) => ({
        planId,
        code: p.code,
        label: p.label,
        description: p.description,
        value: p.value,
        valueType: p.valueType,
        sortOrder: p.sortOrder || i,
      })),
    });
  }

  return prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    include: { privileges: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function deleteSubscriptionPlan(ownerId: string, planId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const existing = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, businessId: business.id },
  });
  if (!existing) throw new AppError('Plan introuvable', 404);

  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { isActive: false },
  });
  return { message: 'Plan desactive' };
}

// ===================== SUBSCRIBERS =====================

export async function listSubscribers(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.BusinessSubscriptionWhereInput = { businessId: business.id };
  const { status, planId, search, page, limit } = filters;

  if (status) where.status = status;
  if (planId) where.planId = planId;
  if (search) {
    where.client = {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ],
    };
  }

  const skip = (parseInt(page || '1') - 1) * parseInt(limit || '20');
  const take = parseInt(limit || '20');

  const [subscribers, total] = await Promise.all([
    prisma.businessSubscription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            price: true,
            currency: true,
            billingCycle: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        _count: { select: { payments: true, logs: true } },
      },
    }),
    prisma.businessSubscription.count({ where }),
  ]);

  return { subscribers, total, page: parseInt(page || '1'), limit: take };
}

export async function getSubscriber(ownerId: string, subscriptionId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const subscription = await prisma.businessSubscription.findFirst({
    where: { id: subscriptionId, businessId: business.id },
    include: {
      plan: { include: { privileges: true } },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatar: true,
          city: true,
        },
      },
      payments: { orderBy: { createdAt: 'desc' } },
      logs: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!subscription) throw new AppError('Abonnement introuvable', 404);
  return subscription;
}

export async function createSubscription(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  // Charger les dépendances (plan + existing) en parallèle — 2 requêtes au lieu de 2 séquentielles
  const [plan, existing] = await Promise.all([
    prisma.subscriptionPlan.findFirst({
      where: { id: data.planId, businessId: business.id, isActive: true },
    }),
    prisma.businessSubscription.findFirst({
      where: { businessId: business.id, clientId: data.clientId, status: 'ACTIVE' },
    }),
  ]);
  if (!plan) throw new AppError('Plan introuvable ou inactif', 404);
  if (existing) throw new AppError('Ce client a deja un abonnement actif', 409);

  const now = new Date();
  const durationDays = plan.durationDays || 30;
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const subscription = await prisma.businessSubscription.create({
    data: {
      businessId: business.id,
      planId: data.planId,
      clientId: data.clientId,
      status: 'ACTIVE',
      startDate: now,
      endDate,
      autoRenew: data.autoRenew !== false,
      nextBillingDate: endDate,
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          type: true,
          price: true,
          currency: true,
          billingCycle: true,
        },
      },
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  await logSubscriptionAction(
    business.id,
    data.planId,
    subscription.id,
    'ACTIVATED',
    'Nouvel abonnement cree',
    ownerId
  );

  return subscription;
}

export async function cancelSubscription(ownerId: string, subscriptionId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const subscription = await prisma.businessSubscription.findFirst({
    where: { id: subscriptionId, businessId: business.id },
  });
  if (!subscription) throw new AppError('Abonnement introuvable', 404);

  const updated = await prisma.businessSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: data.reason || 'Annule par le business',
      autoRenew: false,
    },
    include: {
      plan: { select: { id: true, name: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  await logSubscriptionAction(
    business.id,
    subscription.planId,
    subscriptionId,
    'CANCELLED',
    data.reason || 'Annulation',
    ownerId
  );

  return updated;
}

export async function renewSubscription(ownerId: string, subscriptionId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const subscription = await prisma.businessSubscription.findFirst({
    where: { id: subscriptionId, businessId: business.id },
    include: { plan: true },
  });
  if (!subscription) throw new AppError('Abonnement introuvable', 404);
  if (subscription.status === 'CANCELLED')
    throw new AppError('Abonnement annule, impossible de renouveler', 400);

  const durationDays = subscription.plan.durationDays || 30;
  const now = new Date();
  const newEndDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.businessSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      endDate: newEndDate,
      nextBillingDate: newEndDate,
      renewalStatus: 'ACTIVE',
      renewalCount: { increment: 1 },
      lastRenewedAt: now,
    },
    include: {
      plan: { select: { id: true, name: true } },
      client: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  const count = (subscription.renewalCount || 0) + 1;
  await logSubscriptionAction(
    business.id,
    subscription.planId,
    subscriptionId,
    'RENEWED',
    'Renouvellement #' + count,
    ownerId
  );

  return updated;
}

// ===================== PAYMENTS =====================

export async function listSubscriptionPayments(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.SubscriptionPaymentWhereInput = { businessId: business.id };
  const { subscriptionId, status, page, limit } = filters;

  if (subscriptionId) where.subscriptionId = subscriptionId;
  if (status) where.status = status;

  const skip = (parseInt(page || '1') - 1) * parseInt(limit || '20');
  const take = parseInt(limit || '20');

  const [payments, total] = await Promise.all([
    prisma.subscriptionPayment.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: { select: { id: true } },
      },
    }),
    prisma.subscriptionPayment.count({ where }),
  ]);

  return { payments, total, page: parseInt(page || '1'), limit: take };
}

export async function recordSubscriptionPayment(ownerId: string, data: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const subscription = await prisma.businessSubscription.findFirst({
    where: { id: data.subscriptionId, businessId: business.id },
    include: { plan: true },
  });
  if (!subscription) throw new AppError('Abonnement introuvable', 404);

  const payment = await prisma.subscriptionPayment.create({
    data: {
      subscriptionId: data.subscriptionId,
      businessId: business.id,
      amount: data.amount,
      currency: data.currency || 'FCFA',
      method: data.method || 'MANUAL',
      status: 'COMPLETED',
      reference: data.reference,
      notes: data.notes,
      isManual: data.isManual || false,
      verifiedBy: data.verifiedBy,
      verifiedAt: new Date(),
      periodStart: data.periodStart ? new Date(data.periodStart) : undefined,
      periodEnd: data.periodEnd ? new Date(data.periodEnd) : undefined,
    },
  });

  await logSubscriptionAction(
    business.id,
    subscription.planId,
    data.subscriptionId,
    'PAYMENT_RECEIVED',
    'Paiement de ' + data.amount + ' ' + (data.currency || 'FCFA') + ' recu',
    ownerId
  );

  return payment;
}

// ===================== LOGS =====================

export async function listSubscriptionLogs(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.SubscriptionLogWhereInput = { businessId: business.id };
  const { subscriptionId, action, page, limit } = filters;

  if (subscriptionId) where.subscriptionId = subscriptionId;
  if (action) where.action = action;

  const skip = (parseInt(page || '1') - 1) * parseInt(limit || '30');
  const take = parseInt(limit || '30');

  const [logs, total] = await Promise.all([
    prisma.subscriptionLog.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { id: true, name: true } },
        subscription: { select: { id: true } },
      },
    }),
    prisma.subscriptionLog.count({ where }),
  ]);

  return { logs, total, page: parseInt(page || '1'), limit: take };
}

// ===================== PUBLIC API =====================

export async function getPublicPlatformPlans() {
  // Plans plateforme (businessId = null) affichés sur la page publique /pricing
  const [plans, commissions] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where: { businessId: null, isActive: true, isPublic: true },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { price: 'asc' }],
      include: {
        privileges: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { subscribers: { where: { status: 'ACTIVE' } } } },
      },
    }),
    // Taux de commission courants (calculés depuis CommissionConfig / defaults)
    getMonetizationSettings(),
  ]);

  return {
    plans,
    commissions: commissions
      ? {
          transaction: commissions.transactionCommissionRate,
          escrow: commissions.escrowCommissionRate,
          developerModule: commissions.developerModuleCommissionRate,
          minimumEscrowFee: commissions.minimumEscrowFee,
          maximumEscrowFee: commissions.maximumEscrowFee,
        }
      : null,
  };
}

export async function getPublicSubscriptionPlans(slug: string) {
  const business = await prisma.business.findFirst({
    where: { slug, isActive: true },
    select: { id: true, ...activeModuleAssignmentsSelect },
  });
  if (!business) return [];
  if (!hasBusinessModule(business, 'SUBSCRIPTIONS')) return [];

  return prisma.subscriptionPlan.findMany({
    where: { businessId: business.id, isActive: true, isPublic: true },
    orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { price: 'asc' }],
    include: {
      privileges: { orderBy: { sortOrder: 'asc' } },
      _count: { select: { subscribers: { where: { status: 'ACTIVE' } } } },
    },
  });
}

// ===================== STATS =====================

export async function getSubscriptionStats(ownerId: string) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const bizId = business.id;
  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalPlans,
    activePlans,
    totalSubscribers,
    activeSubs,
    suspendedSubs,
    expiredSubs,
    cancelledSubs,
    totalPayments,
    totalRevenue,
    monthRevenue,
    activeSubscriptions,
    expiringSoon,
    expiring30d,
  ] = await Promise.all([
    prisma.subscriptionPlan.count({ where: { businessId: bizId } }),
    prisma.subscriptionPlan.count({ where: { businessId: bizId, isActive: true } }),
    prisma.businessSubscription.count({ where: { businessId: bizId } }),
    prisma.businessSubscription.count({ where: { businessId: bizId, status: 'ACTIVE' } }),
    prisma.businessSubscription.count({ where: { businessId: bizId, status: 'SUSPENDED' } }),
    prisma.businessSubscription.count({ where: { businessId: bizId, status: 'EXPIRED' } }),
    prisma.businessSubscription.count({ where: { businessId: bizId, status: 'CANCELLED' } }),
    prisma.subscriptionPayment.count({ where: { businessId: bizId, status: 'COMPLETED' } }),
    prisma.subscriptionPayment.aggregate({
      where: { businessId: bizId, status: 'COMPLETED' },
      _sum: { amount: true },
    }),
    prisma.subscriptionPayment.aggregate({
      where: { businessId: bizId, status: 'COMPLETED', createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.businessSubscription.findMany({
      where: { businessId: bizId, status: 'ACTIVE' },
      include: {
        plan: { select: { id: true, name: true, price: true, billingCycle: true, currency: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.businessSubscription.findMany({
      where: { businessId: bizId, status: 'ACTIVE', endDate: { gte: now, lte: in7d } },
      include: {
        plan: { select: { id: true, name: true, price: true, currency: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { endDate: 'asc' },
    }),
    prisma.businessSubscription.findMany({
      where: { businessId: bizId, status: 'ACTIVE', endDate: { gte: now, lte: in30d } },
      select: { id: true, endDate: true },
    }),
  ]);

  // MRR : revenu mensuel récurrent — chaque cycle est normalisé au mois
  const cycleToMonths: Record<string, number> = {
    WEEKLY: 1 / 4.33,
    MONTHLY: 1,
    QUARTERLY: 3,
    SEMI_ANNUAL: 6,
    SEMESTRIAL: 6,
    ANNUAL: 12,
    YEARLY: 12,
    CUSTOM: 1,
    DAILY: 1 / 30,
  };
  let mrr = 0;
  for (const s of activeSubscriptions) {
    const months = cycleToMonths[s.plan.billingCycle] || 1;
    mrr += Number(s.plan.price) / months;
  }

  // Revenu par plan : SubscriptionPayment est lié à la souscription → au plan
  const revenueBySub = await prisma.subscriptionPayment.findMany({
    where: { businessId: bizId, status: 'COMPLETED' },
    select: {
      amount: true,
      subscription: {
        select: { plan: { select: { id: true, name: true } } },
      },
    },
  });
  const revenueMap = new Map<string, { revenue: number; payments: number; planName: string }>();
  for (const p of revenueBySub) {
    const plan = p.subscription?.plan;
    const key = plan?.id || 'unknown';
    const entry = revenueMap.get(key) || {
      revenue: 0,
      payments: 0,
      planName: plan?.name || 'Plan',
    };
    entry.revenue += Number(p.amount || 0);
    entry.payments += 1;
    if (plan?.name) entry.planName = plan.name;
    revenueMap.set(key, entry);
  }
  const revenueByPlanDetailed = Array.from(revenueMap.entries()).map(([planId, v]) => ({
    planId,
    planName: v.planName,
    revenue: v.revenue,
    payments: v.payments,
  }));

  return {
    totalPlans,
    activePlans,
    totalSubscribers,
    activeSubs,
    suspendedSubs,
    expiredSubs,
    cancelledSubs,
    totalPayments,
    totalRevenue: totalRevenue._sum.amount || 0,
    monthRevenue: monthRevenue._sum.amount || 0,
    mrr: Math.round(mrr),
    churnRate: totalSubscribers > 0 ? Math.round((cancelledSubs / totalSubscribers) * 100) : 0,
    revenueByPlan: revenueByPlanDetailed,
    activeList: activeSubscriptions.map((s) => ({
      id: s.id,
      planName: s.plan.name,
      planPrice: s.plan.price,
      billingCycle: s.plan.billingCycle,
      currency: s.plan.currency,
      clientName: `${s.client.firstName} ${s.client.lastName}`,
      clientEmail: s.client.email,
      startDate: s.startDate,
      endDate: s.endDate,
      autoRenew: s.autoRenew,
    })),
    expiringSoon: expiringSoon.map((s) => ({
      id: s.id,
      planName: s.plan.name,
      planPrice: s.plan.price,
      currency: s.plan.currency,
      clientName: `${s.client.firstName} ${s.client.lastName}`,
      clientEmail: s.client.email,
      endDate: s.endDate,
      daysLeft: Math.max(0, Math.ceil((s.endDate!.getTime() - now.getTime()) / 86400000)),
    })),
    expiringIn30d: expiring30d.length,
  };
}

// ===================== MY SUBSCRIPTION (User-facing) =====================

export async function getMyCurrentSubscription(userId: string) {
  // Retourne la souscription la plus récente (ACTIVE ou SUSPENDED en attente de
  // paiement) pour que le client puisse confirmer son paiement Mobile Money.
  const subscription = await prisma.businessSubscription.findFirst({
    where: { clientId: userId, status: { in: ['ACTIVE', 'SUSPENDED'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          price: true,
          currency: true,
          billingCycle: true,
          benefits: true,
          badge: true,
          featured: true,
        },
      },
      business: { select: { id: true, name: true, slug: true } },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { id: true, status: true, amount: true, reference: true, createdAt: true },
      },
      _count: { select: { payments: true } },
    },
  });
  if (!subscription) return null;

  // Pour une souscription en attente de paiement, récupérer la référence du
  // paiement PENDING lié (via la transaction stockée au moment de l'initiation)
  if (subscription.status === 'SUSPENDED') {
    const pendingTx = await prisma.paymentTransaction.findFirst({
      where: {
        userId,
        metadata: { path: ['subscriptionId'], equals: subscription.id },
        status: { in: ['PENDING', 'SUCCESS'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { providerRef: true, provider: true, amount: true, status: true },
    });
    return {
      ...subscription,
      pendingPayment: pendingTx
        ? {
            providerRef: pendingTx.providerRef,
            provider: pendingTx.provider,
            amount: Number(pendingTx.amount),
            status: pendingTx.status,
          }
        : null,
    };
  }

  return subscription;
}

export async function subscribeToPlan(
  userId: string,
  data: { planId: string; provider?: string; phone?: string; autoRenew?: boolean }
) {
  // Charger plan + existing subscription en parallèle (indépendants)
  const [plan, existing] = await Promise.all([
    prisma.subscriptionPlan.findUnique({
      where: { id: data.planId },
      include: { business: { select: { id: true, name: true, ownerId: true } } },
    }),
    prisma.businessSubscription.findFirst({
      where: { clientId: userId, status: { in: ['ACTIVE', 'SUSPENDED'] } },
    }),
  ]);
  if (!plan) throw new AppError('Plan introuvable', 404);
  if (!plan.isActive) throw new AppError("Ce plan n'est plus actif", 400);
  if (!plan.businessId)
    throw new AppError("Ce plan plateforme n'est pas souscriptible pour le moment", 400);
  if (existing) throw new AppError('Vous avez deja un abonnement actif', 409);

  const now = new Date();
  const durationDays = plan.durationDays || 30;
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const amount = Number(plan.price);

  // ── 1. Créer la souscription en SUSPENDED (en attente de paiement) ──
  const subscription = await prisma.businessSubscription.create({
    data: {
      businessId: plan.businessId,
      planId: plan.id,
      clientId: userId,
      status: 'SUSPENDED',
      renewalStatus: 'PENDING',
      startDate: now,
      endDate,
      autoRenew: data.autoRenew !== false,
      nextBillingDate: endDate,
    },
    include: {
      plan: {
        select: {
          id: true,
          name: true,
          price: true,
          currency: true,
          billingCycle: true,
          benefits: true,
        },
      },
      business: { select: { id: true, name: true } },
    },
  });

  await logSubscriptionAction(
    plan.businessId,
    plan.id,
    subscription.id,
    'ACTIVATED',
    `Abonnement « ${plan.name} » initié (en attente de paiement) par ${userId}`,
    userId
  );

  const isCash = !data.provider || data.provider === 'CASH';

  // ── 2. Paiement comptant (CASH) → activation immédiate ──
  if (isCash) {
    await activateSubscription(subscription.id, {
      provider: 'CASH',
      providerRef: `CASH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amount,
      currency: plan.currency || 'FCFA',
      autoRenew: data.autoRenew !== false,
    });
    const activated = await prisma.businessSubscription.findUnique({
      where: { id: subscription.id },
      include: {
        plan: { select: { id: true, name: true, price: true, currency: true, benefits: true } },
        business: { select: { id: true, name: true } },
      },
    });
    return { subscription: activated, needsConfirmation: false, providerRef: null };
  }

  // ── 3. Initier le paiement Mobile Money / Stripe / FedaPay ──
  const { processMobileMoney, processStripePayment, processFedaPayPayment, saveTransaction } =
    await import('./paymentProcessor');

  let paymentResult: { providerRef: string; status: string; fee: number; message?: string } | null =
    null;
  try {
    if (data.provider === 'STRIPE') {
      paymentResult = await processStripePayment(amount, 'usd', data.phone || '');
    } else if (data.provider === 'FEDAPAY') {
      paymentResult = await processFedaPayPayment({
        amount,
        mode: 'mtn_open',
        description: `Abonnement ${plan.name}`,
        customerPhone: data.phone,
      });
    } else {
      paymentResult = await processMobileMoney(
        data.provider || 'MOBILE_MONEY',
        data.phone || '',
        amount,
        `Abonnement ${plan.name}`
      );
    }
  } catch (e) {
    logger.warn('Abonnement : init paiement échoué, souscription en attente', {
      error: (e as Error).message,
    });
  }

  if (paymentResult) {
    try {
      await saveTransaction({
        businessId: plan.businessId,
        userId,
        amount,
        currency: plan.currency || 'FCFA',
        provider: data.provider || 'MOBILE_MONEY',
        providerRef: paymentResult.providerRef,
        status: paymentResult.status,
        fee: paymentResult.fee || 0,
        metadata: { subscriptionId: subscription.id, type: 'SUBSCRIPTION' },
      });
    } catch (e) {
      logger.warn('Abonnement : saveTransaction échoué', { error: (e as Error).message });
    }
  }

  // ── 4. Si paiement déjà SUCCESS (mode test / Stripe instantané) → activer ──
  if (paymentResult?.status === 'SUCCESS') {
    await activateSubscription(subscription.id, {
      provider: data.provider || 'MOBILE_MONEY',
      providerRef: paymentResult.providerRef,
      amount,
      currency: plan.currency || 'FCFA',
      autoRenew: data.autoRenew !== false,
    });
    const activated = await prisma.businessSubscription.findUnique({
      where: { id: subscription.id },
      include: {
        plan: { select: { id: true, name: true, price: true, currency: true, benefits: true } },
        business: { select: { id: true, name: true } },
      },
    });
    return {
      subscription: activated,
      needsConfirmation: false,
      providerRef: paymentResult.providerRef,
    };
  }

  // PENDING → le client doit confirmer sur son téléphone (ou webhook)
  return {
    subscription,
    needsConfirmation: true,
    providerRef: paymentResult?.providerRef || null,
    paymentMessage:
      paymentResult?.message ||
      `Paiement ${data.provider || 'Mobile Money'} initié. Confirmez sur votre téléphone.`,
  };
}

export async function confirmSubscriptionPayment(userId: string, data: { providerRef: string }) {
  if (!data.providerRef) throw new AppError('Référence de paiement requise', 400);

  // Trouver la transaction liée à la souscription de l'utilisateur
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      providerRef: data.providerRef,
      userId,
      metadata: { path: ['type'], equals: 'SUBSCRIPTION' },
    },
  });
  if (!transaction) throw new AppError('Transaction introuvable', 404);

  const subscriptionId = (transaction.metadata as any)?.subscriptionId;
  if (!subscriptionId) throw new AppError('Abonnement lié introuvable', 404);

  // Si la transaction est encore PENDING, on la considère réussie en mode dev/test
  // (les providers réels confirment via webhook → même chemin d'activation)
  if (transaction.status === 'FAILED' || transaction.status === 'REFUNDED') {
    throw new AppError('Paiement échoué', 400);
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: { status: 'SUCCESS', paidAt: transaction.paidAt || new Date() },
  });

  const subscription = await prisma.businessSubscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!subscription) throw new AppError('Abonnement introuvable', 404);

  await activateSubscription(subscription.id, {
    provider: transaction.provider,
    providerRef: transaction.providerRef || data.providerRef,
    amount: Number(transaction.amount),
    currency: transaction.currency,
  });

  const activated = await prisma.businessSubscription.findUnique({
    where: { id: subscription.id },
    include: {
      plan: { select: { id: true, name: true, price: true, currency: true, benefits: true } },
      business: { select: { id: true, name: true } },
    },
  });
  return { subscription: activated, needsConfirmation: false };
}

/**
 * Confirmation déclenchée par webhook (FedaPay etc.) : la transaction a déjà été
 * marquée SUCCESS, on active la souscription liée. Idempotent.
 */
export async function confirmSubscriptionPaymentByRef(providerRef: string, userId: string) {
  if (!providerRef) throw new AppError('Référence de paiement requise', 400);
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { providerRef, userId, metadata: { path: ['type'], equals: 'SUBSCRIPTION' } },
  });
  if (!transaction) throw new AppError('Transaction introuvable', 404);
  const subscriptionId = (transaction.metadata as any)?.subscriptionId;
  if (!subscriptionId) throw new AppError('Abonnement lié introuvable', 404);

  const subscription = await prisma.businessSubscription.findUnique({
    where: { id: subscriptionId },
    include: { plan: true },
  });
  if (!subscription) throw new AppError('Abonnement introuvable', 404);
  if (subscription.status === 'ACTIVE') return { subscription, alreadyActive: true };

  await activateSubscription(subscription.id, {
    provider: transaction.provider,
    providerRef: transaction.providerRef || providerRef,
    amount: Number(transaction.amount),
    currency: transaction.currency,
  });
  return {
    subscription: await prisma.businessSubscription.findUnique({
      where: { id: subscription.id },
      include: {
        plan: { select: { id: true, name: true, price: true, currency: true, benefits: true } },
        business: { select: { id: true, name: true } },
      },
    }),
    alreadyActive: false,
  };
}

/**
 * Active une souscription (payée) : statut ACTIVE + SubscriptionPayment COMPLETED
 * + crédit du wallet business net de commission (WalletTransaction SUBSCRIPTION)
 * + notification au business. Idempotent : une souscription déjà ACTIVE ne double
 * jamais le crédit wallet.
 */
async function activateSubscription(
  subscriptionId: string,
  opts: {
    provider: string;
    providerRef?: string;
    amount: number;
    currency: string;
    autoRenew?: boolean;
  }
) {
  const { calculateCommission } = await import('./monetizationConfig');
  const { getOrCreateWallet } = await import('./wallet');

  const sub = await prisma.businessSubscription.findUnique({
    where: { id: subscriptionId },
    include: {
      plan: { include: { business: { select: { id: true, ownerId: true, name: true } } } },
    },
  });
  if (!sub) throw new AppError('Abonnement introuvable', 404);
  if (sub.status === 'ACTIVE') {
    // Déjà activé (idempotence webhook + confirmation client)
    return { alreadyActive: true };
  }

  const now = new Date();
  const { commission, netAmount } = await calculateCommission(opts.amount, 'transaction');
  const wallet = await getOrCreateWallet(sub.businessId);

  let alreadyActive = false;
  await prisma.$transaction(async (tx) => {
    // Claim atomique : seules les souscriptions non-ACTIVE sont activées ici.
    // Deux confirmations concurrentes (client + webhook) ne créditent jamais deux fois.
    const claimed = await tx.businessSubscription.updateMany({
      where: { id: subscriptionId, status: { not: 'ACTIVE' } },
      data: {
        status: 'ACTIVE',
        renewalStatus: 'ACTIVE',
        autoRenew: opts.autoRenew ?? sub.autoRenew,
        lastRenewedAt: now,
      },
    });
    if (claimed.count === 0) {
      alreadyActive = true;
      return;
    }

    await tx.subscriptionPayment.create({
      data: {
        subscriptionId,
        businessId: sub.businessId,
        amount: opts.amount,
        currency: opts.currency,
        method: opts.provider,
        status: 'COMPLETED',
        reference: opts.providerRef || null,
        isManual: false,
        verifiedAt: now,
        periodStart: sub.startDate,
        periodEnd: sub.endDate,
      },
    });

    // ── Crédit wallet business NET de commission (increment atomique) ──
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: netAmount } },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'SUBSCRIPTION',
        amount: netAmount,
        balanceBefore: Number(wallet.balance),
        balanceAfter: Number(updatedWallet.balance),
        reference: subscriptionId,
        description: `Abonnement « ${sub.plan.name} » payé (${opts.amount} ${opts.currency} − ${commission} commission)`,
        metadata: {
          subscriptionId,
          grossAmount: opts.amount,
          commission,
          netAmount,
          provider: opts.provider,
        },
      },
    });

    // Log financier de commission
    await tx.financialLog.create({
      data: {
        businessId: sub.businessId,
        userId: sub.clientId,
        action: 'PAYMENT_RECEIVED',
        amount: -commission,
        description: `Commission AfriBiz sur abonnement « ${sub.plan.name} » (${opts.amount} ${opts.currency})`,
        metadata: {
          commissionType: 'SUBSCRIPTION_FEE',
          subscriptionId,
          grossAmount: opts.amount,
          commissionRate: (commission / opts.amount).toFixed(4),
        },
      },
    });
  });

  if (alreadyActive) {
    return { alreadyActive: true };
  }

  // Notification + log (non bloquants)
  try {
    const { publishSubscriptionCreated } = await import('../events/publishers');
    publishSubscriptionCreated({
      userId: sub.plan.business?.ownerId || sub.clientId,
      subscriptionId,
      planName: sub.plan.name,
    });
  } catch {
    // non bloquant
  }
  await logSubscriptionAction(
    sub.businessId,
    sub.planId,
    subscriptionId,
    'PAYMENT_RECEIVED',
    `Paiement ${opts.amount} ${opts.currency} confirmé (${opts.provider}) — abonnement actif`,
    sub.clientId
  );

  return { alreadyActive: false, netAmount, commission };
}

export async function cancelMySubscription(userId: string) {
  // ACTIVE (abonnement en cours) ou SUSPENDED (paiement en attente/échoué) :
  // le client doit pouvoir sortir d'un SUSPENDED pour se réabonner.
  const subscription = await prisma.businessSubscription.findFirst({
    where: { clientId: userId, status: { in: ['ACTIVE', 'SUSPENDED'] } },
  });
  if (!subscription) throw new AppError('Aucun abonnement actif ou en attente trouve', 404);

  const updated = await prisma.businessSubscription.update({
    where: { id: subscription.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      autoRenew: false,
    },
    include: {
      plan: { select: { id: true, name: true } },
    },
  });

  await logSubscriptionAction(
    subscription.businessId,
    subscription.planId,
    subscription.id,
    'CANCELLED',
    "Annule par l'utilisateur",
    userId
  );

  return updated;
}

// ===================== INTERNAL HELPER =====================

async function logSubscriptionAction(
  businessId: string,
  planId: string | null | undefined,
  subscriptionId: string | null | undefined,
  action: string,
  description: string,
  performedBy?: string
) {
  try {
    await prisma.subscriptionLog.create({
      data: {
        businessId,
        planId: planId || undefined,
        subscriptionId: subscriptionId || undefined,
        action,
        description,
        performedBy,
      },
    });
  } catch (e) {
    logger.error('Subscription log failed', { error: e });
  }
}
