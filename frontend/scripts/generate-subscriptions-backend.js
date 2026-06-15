const fs = require('fs');

// ============================================================
// SERVICE
// ============================================================
const serviceContent = `import { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

// ===================== SUBSCRIPTION PLANS =====================

export async function listSubscriptionPlans(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.SubscriptionPlanWhereInput = { businessId: business.id };
  const { isActive, isPublic, type, search, page = '1', limit = '20' } = filters;

  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (isPublic !== undefined) where.isPublic = isPublic === 'true';
  if (type) where.type = type;
  if (search) where.name = { contains: search, mode: 'insensitive' };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

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

  return { plans, total, page: parseInt(page), limit: take };
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

  // Create privileges if provided
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
  const fields = ['name', 'description', 'type', 'price', 'currency', 'billingCycle',
    'trialDays', 'durationDays', 'maxUsage', 'maxClients', 'maxBookings',
    'benefits', 'isPublic', 'isActive', 'sortOrder', 'featured', 'badge'];
  fields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

  const plan = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: updateData,
    include: { privileges: { orderBy: { sortOrder: 'asc' } } },
  });

  // Update privileges if provided (replace all)
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

  // Deactivate plan (don't delete, keep subscribers history)
  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { isActive: false },
  });
  return { message: 'Plan désactivé' };
}

// ===================== SUBSCRIBERS =====================

export async function listSubscribers(ownerId: string, filters: any) {
  const business = await prisma.business.findFirst({
    where: { ownerId, isActive: true },
    select: { id: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const where: Prisma.BusinessSubscriptionWhereInput = { businessId: business.id };
  const { status, planId, search, page = '1', limit = '20' } = filters;

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

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

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

  return { subscribers, total, page: parseInt(page), limit: take };
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

  // Check if client already has active subscription
  const existing = await prisma.businessSubscription.findFirst({
    where: { businessId: business.id, clientId: data.clientId, status: 'ACTIVE' },
  });
  if (existing) throw new AppError('Ce client a déjà un abonnement actif', 409);

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

  // Log
  await prisma.subscriptionLog.create({
    data: {
      businessId: business.id,
      planId: data.planId,
      subscriptionId: subscription.id,
      action: 'ACTIVATED',
      description: `Nouvel abonnement ${plan.name} créé`,
      performedBy: ownerId,
    },
  });

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
      cancelReason: data.reason || 'Annulé par le business',
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
  if (subscription.status === 'CANCELLED') throw new AppError('Abonnement annulé, impossible de renouveler', 400);

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

  await logSubscriptionAction(business.id, subscription.planId, subscriptionId, 'RENEWED', `Renouvellement #${(subscription.renewalCount || 0) + 1}`, ownerId);

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
  const { subscriptionId, status, page = '1', limit = '20' } = filters;

  if (subscriptionId) where.subscriptionId = subscriptionId;
  if (status) where.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

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

  return { payments, total, page: parseInt(page), limit: take };
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

  await logSubscriptionAction(business.id, subscription.planId, data.subscriptionId, 'PAYMENT_RECEIVED', `Paiement de ${data.amount} ${data.currency || 'FCFA'} reçu`, ownerId);

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
  const { subscriptionId, action, page = '1', limit = '30' } = filters;

  if (subscriptionId) where.subscriptionId = subscriptionId;
  if (action) where.action = action;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

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

  return { logs, total, page: parseInt(page), limit: take };
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
    console.error('Subscription log failed:', e);
  }
}
`;

fs.writeFileSync('backend/src/services/subscriptions.ts', serviceContent);
console.log('✅ Service created');

// ============================================================
// CONTROLLER
// ============================================================
const controllerContent = `import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import * as subscriptionService from '../services/subscriptions';

export const listSubscriptionPlans = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await subscriptionService.listSubscriptionPlans(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const plan = await subscriptionService.getSubscriptionPlan(req.user.id, req.params.id);
  res.json({ success: true, data: plan });
});

export const createSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const plan = await subscriptionService.createSubscriptionPlan(req.user.id, req.body);
  res.status(201).json({ success: true, data: plan, message: 'Plan créé' });
});

export const updateSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const plan = await subscriptionService.updateSubscriptionPlan(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: plan, message: 'Plan mis à jour' });
});

export const deleteSubscriptionPlan = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await subscriptionService.deleteSubscriptionPlan(req.user.id, req.params.id);
  res.json({ success: true, data: result });
});

export const listSubscribers = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await subscriptionService.listSubscribers(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getSubscriber = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const subscription = await subscriptionService.getSubscriber(req.user.id, req.params.id);
  res.json({ success: true, data: subscription });
});

export const createSubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const subscription = await subscriptionService.createSubscription(req.user.id, req.body);
  res.status(201).json({ success: true, data: subscription, message: 'Abonnement créé' });
});

export const cancelSubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const subscription = await subscriptionService.cancelSubscription(req.user.id, req.params.id, req.body);
  res.json({ success: true, data: subscription, message: 'Abonnement annulé' });
});

export const renewSubscription = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const subscription = await subscriptionService.renewSubscription(req.user.id, req.params.id);
  res.json({ success: true, data: subscription, message: 'Abonnement renouvelé' });
});

export const listSubscriptionPayments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await subscriptionService.listSubscriptionPayments(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const recordSubscriptionPayment = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const payment = await subscriptionService.recordSubscriptionPayment(req.user.id, req.body);
  res.status(201).json({ success: true, data: payment, message: 'Paiement enregistré' });
});

export const listSubscriptionLogs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const result = await subscriptionService.listSubscriptionLogs(req.user.id, req.query);
  res.json({ success: true, data: result });
});

export const getSubscriptionStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return;
  const stats = await subscriptionService.getSubscriptionStats(req.user.id);
  res.json({ success: true, data: stats });
});
`;

fs.writeFileSync('backend/src/controllers/subscriptions.ts', controllerContent);
console.log('✅ Controller created');

// ============================================================
// ROUTES
// ============================================================
const routesContent = `import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import {
  listSubscriptionPlans, getSubscriptionPlan, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan,
  listSubscribers, getSubscriber, createSubscription, cancelSubscription, renewSubscription,
  listSubscriptionPayments, recordSubscriptionPayment,
  listSubscriptionLogs, getSubscriptionStats,
} from '../controllers/subscriptions';

const router = Router();
router.use(authMiddleware);

// Stats (must be before /:id)
router.get('/stats', getSubscriptionStats);

// Plans
router.get('/plans', listSubscriptionPlans);
router.post('/plans', createSubscriptionPlan);
router.patch('/plans/:id', updateSubscriptionPlan);
router.delete('/plans/:id', deleteSubscriptionPlan);

// Subscribers
router.get('/subscribers', listSubscribers);
router.post('/subscribers', createSubscription);
router.get('/subscribers/:id', getSubscriber);
router.patch('/subscribers/:id/cancel', cancelSubscription);
router.post('/subscribers/:id/renew', renewSubscription);

// Payments
router.get('/payments', listSubscriptionPayments);
router.post('/payments', recordSubscriptionPayment);

// Logs
router.get('/logs', listSubscriptionLogs);

// Plan detail (after all plan/:id sub-routes)
router.get('/plans/:id', getSubscriptionPlan);

export default router;
`;

fs.writeFileSync('backend/src/routes/subscriptions.ts', routesContent);
console.log('✅ Routes created');
console.log('✅ All backend files generated');
