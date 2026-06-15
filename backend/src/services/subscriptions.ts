import { Prisma } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { logger } from '../lib/logger';

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
      where, skip, take,
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
        include: { client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
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
  ['name', 'description', 'type', 'price', 'currency', 'billingCycle',
    'trialDays', 'durationDays', 'maxUsage', 'maxClients', 'maxBookings',
    'benefits', 'isPublic', 'isActive', 'sortOrder', 'featured', 'badge'
  ].forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

  const plan = await prisma.subscriptionPlan.update({
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
      where, skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        plan: { select: { id: true, name: true, type: true, price: true, currency: true, billingCycle: true } },
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
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
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, city: true } },
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

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: data.planId, businessId: business.id, isActive: true },
  });
  if (!plan) throw new AppError('Plan introuvable ou inactif', 404);

  const existing = await prisma.businessSubscription.findFirst({
    where: { businessId: business.id, clientId: data.clientId, status: 'ACTIVE' },
  });
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
      plan: { select: { id: true, name: true, type: true, price: true, currency: true, billingCycle: true } },
      client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    },
  });

  await logSubscriptionAction(business.id, data.planId, subscription.id, 'ACTIVATED', 'Nouvel abonnement cree', ownerId);

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

  await logSubscriptionAction(business.id, subscription.planId, subscriptionId, 'CANCELLED', data.reason || 'Annulation', ownerId);

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
  if (subscription.status === 'CANCELLED') throw new AppError('Abonnement annule, impossible de renouveler', 400);

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
  await logSubscriptionAction(business.id, subscription.planId, subscriptionId, 'RENEWED', 'Renouvellement #' + count, ownerId);

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
      where, skip, take,
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

  await logSubscriptionAction(business.id, subscription.planId, data.subscriptionId, 'PAYMENT_RECEIVED', 'Paiement de ' + data.amount + ' ' + (data.currency || 'FCFA') + ' recu', ownerId);

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
      where, skip, take,
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

export async function getPublicSubscriptionPlans(slug: string) {
  const business = await prisma.business.findFirst({
    where: { slug, isActive: true },
    select: { id: true, modules: true },
  });
  if (!business) return [];
  if (!business.modules.includes('SUBSCRIPTIONS')) return [];

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

  const [totalPlans, activePlans, totalSubscribers, activeSubs, expiredSubs, cancelledSubs, totalPayments, totalRevenue] = await Promise.all([
    prisma.subscriptionPlan.count({ where: { businessId: bizId } }),
    prisma.subscriptionPlan.count({ where: { businessId: bizId, isActive: true } }),
    prisma.businessSubscription.count({ where: { businessId: bizId } }),
    prisma.businessSubscription.count({ where: { businessId: bizId, status: 'ACTIVE' } }),
    prisma.businessSubscription.count({ where: { businessId: bizId, status: 'EXPIRED' } }),
    prisma.businessSubscription.count({ where: { businessId: bizId, status: 'CANCELLED' } }),
    prisma.subscriptionPayment.count({ where: { businessId: bizId, status: 'COMPLETED' } }),
    prisma.subscriptionPayment.aggregate({ where: { businessId: bizId, status: 'COMPLETED' }, _sum: { amount: true } }),
  ]);

  return {
    totalPlans, activePlans, totalSubscribers, activeSubs, expiredSubs, cancelledSubs,
    totalPayments,
    totalRevenue: totalRevenue._sum.amount || 0,
    churnRate: totalSubscribers > 0 ? Math.round((cancelledSubs / totalSubscribers) * 100) : 0,
  };
}

// ===================== MY SUBSCRIPTION (User-facing) =====================

export async function getMyCurrentSubscription(userId: string) {
  // Find active subscription for this user (as client) to any platform business
  const subscription = await prisma.businessSubscription.findFirst({
    where: { clientId: userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: {
        select: {
          id: true, name: true, description: true, type: true,
          price: true, currency: true, billingCycle: true,
          benefits: true, badge: true, featured: true,
        },
      },
      business: { select: { id: true, name: true, slug: true } },
      _count: { select: { payments: true } },
    },
  });
  return subscription;
}

export async function subscribeToPlan(userId: string, data: { planId: string; businessId?: string }) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: data.planId },
    include: { business: { select: { id: true, ownerId: true } } },
  });
  if (!plan) throw new AppError('Plan introuvable', 404);
  if (!plan.isActive) throw new AppError('Ce plan n\'est plus actif', 400);

  // Check no active subscription already
  const existing = await prisma.businessSubscription.findFirst({
    where: { clientId: userId, status: 'ACTIVE' },
  });
  if (existing) throw new AppError('Vous avez deja un abonnement actif', 409);

  const now = new Date();
  const durationDays = plan.durationDays || 30;
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const subscription = await prisma.businessSubscription.create({
    data: {
      businessId: plan.businessId,
      planId: plan.id,
      clientId: userId,
      status: 'ACTIVE',
      startDate: now,
      endDate,
      autoRenew: true,
      nextBillingDate: endDate,
    },
    include: {
      plan: { select: { id: true, name: true, price: true, currency: true, billingCycle: true, benefits: true } },
      business: { select: { id: true, name: true } },
    },
  });

  await logSubscriptionAction(plan.businessId, plan.id, subscription.id, 'ACTIVATED',
    `Abonnement souscrit par l'utilisateur ${userId}`, userId);

  return subscription;
}

export async function cancelMySubscription(userId: string) {
  const subscription = await prisma.businessSubscription.findFirst({
    where: { clientId: userId, status: 'ACTIVE' },
  });
  if (!subscription) throw new AppError('Aucun abonnement actif trouve', 404);

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

  await logSubscriptionAction(subscription.businessId, subscription.planId, subscription.id,
    'CANCELLED', 'Annule par l\'utilisateur', userId);

  return updated;
}

// ===================== INTERNAL HELPER =====================

async function logSubscriptionAction(businessId: string, planId: string | null | undefined, subscriptionId: string | null | undefined, action: string, description: string, performedBy?: string) {
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
