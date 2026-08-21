import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import * as crmService from './crm';
import { ActivityType } from '@prisma/client';

export async function trackPageView(data: {
  businessId: string;
  userId?: string;
  visitorId?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  duration?: number;
}) {
  await prisma.businessPageView.create({ data });

  // Update or create BusinessClient visit tracking
  if (data.userId) {
    await prisma.businessClient.upsert({
      where: { businessId_clientId: { businessId: data.businessId, clientId: data.userId } },
      create: {
        businessId: data.businessId,
        clientId: data.userId,
        visitCount: 1,
        lastVisitAt: new Date(),
      },
      update: { visitCount: { increment: 1 }, lastVisitAt: new Date() },
    });

    // Log activity
    await logActivity(data.businessId, data.userId, 'PAGE_VIEW', {
      description: 'Visite de la page business',
      metadata: { referrer: data.referrer },
    });
  }
}

export async function trackProductView(data: {
  businessId: string;
  productId: string;
  userId?: string;
  visitorId?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
  source?: string;
}) {
  await prisma.productView.create({ data });

  if (data.userId) {
    await logActivity(data.businessId, data.userId, 'PRODUCT_VIEW', {
      description: "Consultation d'un produit",
      link: `/products/${data.productId}`,
      metadata: { productId: data.productId, source: data.source },
    });
  }
}

export async function trackProductClick(data: {
  businessId: string;
  productId: string;
  userId?: string;
  visitorId?: string;
  source?: string;
}) {
  await prisma.productClick.create({ data });

  if (data.userId) {
    await logActivity(data.businessId, data.userId, 'PRODUCT_CLICK', {
      description: 'Clic sur un produit',
      link: `/products/${data.productId}`,
      metadata: { productId: data.productId, source: data.source },
    });
  }
}

export async function logActivity(
  businessId: string,
  clientId: string,
  type: ActivityType,
  options?: { description?: string; link?: string; metadata?: Record<string, unknown> }
) {
  const bc = await prisma.businessClient.findUnique({
    where: { businessId_clientId: { businessId, clientId } },
    select: { id: true },
  });
  if (!bc) return;

  await prisma.clientActivityLog.create({
    data: {
      businessId,
      clientId: bc.id,
      type,
      description: options?.description,
      link: options?.link,
      metadata: options?.metadata as any,
    },
  });
}

export async function getCustomer360(businessId: string, clientId: string) {
  // Get existing CRM detail (already aggregates orders, bookings, debts, loyalty, risk, notes, tags, segments)
  const crmDetail = await crmService.getClientDetail(businessId, clientId);

  // Verify client exists in this business
  const bc = await prisma.businessClient.findUnique({
    where: { businessId_clientId: { businessId, clientId } },
    select: { id: true },
  });

  if (!bc) throw new AppError('Client non trouvé', 404);

  // Get Customer 360° specific data (+ épargne achat : plans et progression + satisfaction)
  const [
    activityTimeline,
    pageViews,
    rawProductViews,
    rawProductClicks,
    layawayPlans,
    surveyResponses,
  ] = await Promise.all([
    prisma.clientActivityLog.findMany({
      where: { businessId, clientId: bc.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.businessPageView.findMany({
      where: { businessId, userId: clientId },
      orderBy: { viewedAt: 'desc' },
      take: 20,
    }),
    prisma.productView.findMany({
      where: { businessId, userId: clientId },
      orderBy: { viewedAt: 'desc' },
      take: 20,
    }),
    prisma.productClick.findMany({
      where: { businessId, userId: clientId },
      orderBy: { clickedAt: 'desc' },
      take: 20,
    }),
    prisma.layawayPlan.findMany({
      where: { businessId, clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        itemName: true,
        itemType: true,
        status: true,
        savedAmount: true,
        targetAmount: true,
        minInstallment: true,
        expiresAt: true,
        createdAt: true,
        completedAt: true,
      },
    }),
    prisma.satisfactionSurveyResponse.findMany({
      where: { businessId, userId: clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        score: true,
        feedback: true,
        orderId: true,
        bookingId: true,
        createdAt: true,
      },
    }),
  ]);

  const satisfactionCount = surveyResponses.length;
  const satisfactionAvg =
    satisfactionCount > 0
      ? Math.round(
          (surveyResponses.reduce((sum, s) => sum + s.score, 0) / satisfactionCount) * 10
        ) / 10
      : null;

  // Fetch product details for views and clicks
  const productIds = new Set([
    ...rawProductViews.map((v) => v.productId),
    ...rawProductClicks.map((c) => c.productId),
  ]);
  const products =
    productIds.size > 0
      ? await prisma.product.findMany({
          where: { id: { in: Array.from(productIds) } },
          select: { id: true, name: true, images: true, price: true },
        })
      : [];
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Épargne Achat — agrégation pour la fiche client (montant sécurisé en escrow,
  // progression par plan, statut : en cours / prêt à convertir / terminé).
  const savingsPlans = layawayPlans.map((lp) => {
    const savedAmount = Number(lp.savedAmount);
    const targetAmount = Number(lp.targetAmount);
    return {
      id: lp.id,
      itemName: lp.itemName,
      itemType: lp.itemType,
      status: lp.status,
      savedAmount,
      targetAmount,
      progress:
        targetAmount > 0 ? Math.min(100, Math.round((savedAmount / targetAmount) * 100)) : 0,
      remaining: Math.max(0, targetAmount - savedAmount),
      expiresAt: lp.expiresAt,
      createdAt: lp.createdAt,
      completedAt: lp.completedAt,
    };
  });
  const activeSavings = savingsPlans.filter((s) => s.status === 'ACTIVE');
  // « Épargné en escrow » = fonds encore séquestrés : ACTIVE + READY uniquement.
  // Les plans COMPLETED ont déjà libéré l'argent vers le business (plus en escrow).
  const escrowed = savingsPlans.filter((s) => s.status === 'ACTIVE' || s.status === 'READY');
  const totalSaved = escrowed.reduce((sum, s) => sum + s.savedAmount, 0);
  const totalTarget = escrowed.reduce((sum, s) => sum + s.targetAmount, 0);

  return {
    ...crmDetail,
    satisfaction: {
      count: satisfactionCount,
      average: satisfactionAvg,
      responses: surveyResponses.map((s) => ({
        id: s.id,
        score: s.score,
        feedback: s.feedback,
        orderId: s.orderId,
        bookingId: s.bookingId,
        createdAt: s.createdAt,
      })),
    },
    savings: {
      totalSaved,
      totalTarget,
      activePlans: activeSavings.length,
      readyPlans: savingsPlans.filter((s) => s.status === 'READY').length,
      completedPlans: savingsPlans.filter((s) => s.status === 'COMPLETED').length,
      plans: savingsPlans,
    },
    activityTimeline: activityTimeline.map((a) => ({
      id: a.id,
      type: a.type,
      description: a.description,
      link: a.link,
      metadata: a.metadata,
      createdAt: a.createdAt,
    })),
    pageViews: pageViews.map((v) => ({
      id: v.id,
      referrer: v.referrer,
      duration: v.duration,
      viewedAt: v.viewedAt,
    })),
    productViews: rawProductViews.map((v) => {
      const p = productMap.get(v.productId);
      return {
        id: v.id,
        product: p
          ? { id: p.id, name: p.name, image: p.images?.[0] || null, price: Number(p.price) }
          : null,
        source: v.source,
        viewedAt: v.viewedAt,
      };
    }),
    productClicks: rawProductClicks.map((c) => {
      const p = productMap.get(c.productId);
      return {
        id: c.id,
        product: p
          ? { id: p.id, name: p.name, image: p.images?.[0] || null, price: Number(p.price) }
          : null,
        source: c.source,
        clickedAt: c.clickedAt,
      };
    }),
    pageViewCount: pageViews.length,
    productViewCount: rawProductViews.length,
    productClickCount: rawProductClicks.length,
  };
}
