import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';
import { Prisma, BusinessModule } from '@prisma/client';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as businessService from '../services/business';
import * as documentService from '../services/documents';
import * as disputeService from '../services/disputes';
import * as faqService from '../services/businessFaq';
import * as analyticsService from '../services/dataHubAnalytics';
import {
  getTransactionCommissionRate,
  getEscrowCommissionRate,
} from '../services/monetizationConfig';
import { getBusinessPlanOverview } from '../services/planAccessService';
import { getBusinessAlertQueue } from '../services/businessAlerts';

/**
 * Résout le business actif du requérant.
 * MULTI-ACTIVITÉ : header `x-business-id` (ou query/body `businessId`) → ce business
 * précis si le user le possède ; sinon le premier business du user (comportement
 * single-business d'avant, zéro régression).
 */
async function getBusinessId(req: AuthenticatedRequest) {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const requestedId =
    (req.headers['x-business-id'] as string) ||
    (req.query.businessId as string) ||
    (req.body?.businessId as string) ||
    null;
  const business = await getBusinessByOwner(req.user.id, requestedId);
  return business.id;
}

export const getBusinessFunnel = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const data = await analyticsService.getConversionFunnel(businessId);
    res.json({ success: true, data });
  }
);

export const getBusinessEngagement = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const businessId = await getBusinessId(req);
    const data = await analyticsService.getEngagementAnalytics(businessId);
    res.json({ success: true, data });
  }
);

export const getPublicBusiness = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const business = await businessService.getPublicBusiness(slug);
    res.json({ success: true, data: business });
  }
);

export const getBusinessProducts = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessProducts(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessServices = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessServices(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessMenu = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessMenu(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessRooms = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessRooms(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessEvents = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessEvents(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessRentals = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessRentals(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessPortfolio = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessPortfolio(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessPromotions = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessPromotions(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessPartners = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessPartners(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessReviews = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessReviews(slug);
    res.json({ success: true, data });
  }
);

export const createBusinessReview = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { slug } = req.params;
    const { rating, title, comment } = req.body;
    const data = await businessService.createBusinessReview(slug, req.user.id, {
      rating: Number(rating),
      title,
      comment,
    });
    res.status(201).json({ success: true, data, message: 'Avis publié' });
  }
);

export const getBusinessBookings = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessBookings(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessTrainings = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const data = await businessService.getBusinessTrainings(slug);
    res.json({ success: true, data });
  }
);

export const getBusinessSubscriptionPlans = catchAsyncErrors(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { slug } = req.params;
    const { getPublicSubscriptionPlans } = await import('../services/subscriptions');
    const data = await getPublicSubscriptionPlans(slug);
    res.json({ success: true, data });
  }
);

async function getBusinessByOwner(userId: string, businessId?: string | null) {
  const where = businessId
    ? { id: businessId, ownerId: userId, deletedAt: null }
    : { ownerId: userId, deletedAt: null };
  const business = await prisma.business.findFirst({
    where,
    orderBy: { createdAt: 'asc' },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business;
}

function buildClientQuery(businessId: string, search?: string) {
  const where: any = { businessId, buyerId: { not: null } };
  if (search) {
    where.buyer = {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ],
    };
  }
  return where;
}

export const getMyBusinessClients = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await getBusinessByOwner(req.user.id);

    const { search, limit } = req.query;
    const take = Math.min(Number(limit) || 50, 100);
    const where = buildClientQuery(business.id, search as string | undefined);

    const orders = await prisma.order.findMany({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      distinct: ['buyerId'],
      take,
      orderBy: { createdAt: 'desc' },
    });

    // Soldes dus par client (dettes actives) — affiché en rouge au Point de Vente
    const debts = await prisma.debt.groupBy({
      by: ['buyerId'],
      where: {
        businessId: business.id,
        buyerId: { not: null },
        status: { in: ['ACTIVE', 'PARTIALLY_PAID'] },
      },
      _sum: { remainingAmount: true },
    });
    const debtMap = new Map(
      debts.map((d) => [d.buyerId as string, Number(d._sum.remainingAmount || 0)])
    );

    const clients = orders
      .filter((o): o is typeof o & Record<'buyer', NonNullable<typeof o.buyer>> => o.buyer !== null)
      .map((o) => ({
        id: o.buyer.id,
        name: `${o.buyer.firstName} ${o.buyer.lastName}`,
        email: o.buyer.email,
        phone: o.buyer.phone,
        createdAt: o.buyer.createdAt,
        totalOrders: 1,
        totalSpent: Number(o.totalAmount),
        reviewCount: 0,
        loyal: false,
        debtBalance: debtMap.get(o.buyer.id) || 0,
      }));

    res.json({ success: true, data: { clients, total: clients.length } });
  }
);

export const getAggregatedStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const stats = await businessService.getAggregatedDashboardStats(req.user.id);
    res.json({ success: true, data: stats });
  }
);

export const getMyBusinessStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const stats = await businessService.getMyBusinessStats(req.user.id);
    res.json({ success: true, data: stats });
  }
);

export const getBusinessInstalledModules = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);

    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
    });
    if (!business) throw new AppError('Business non trouvé', 404);

    const installations = await prisma.developerModuleInstallation.findMany({
      where: { businessId: business.id },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            description: true,
            category: true,
            price: true,
            currency: true,
            version: true,
            rating: true,
            reviewCount: true,
            dashboardUrl: true,
            sidebarLabel: true,
            sidebarIcon: true,
            developer: {
              select: {
                companyName: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
      orderBy: { installedAt: 'desc' },
    });

    const now = new Date();
    const moduleIds = installations.map((i) => i.moduleId);

    // Get latest version info per module
    const latestVersions = await prisma.developerModuleVersion.findMany({
      where: { moduleId: { in: moduleIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['moduleId'],
      select: { id: true, version: true, moduleId: true },
    });
    const latestVersionMap = new Map(
      latestVersions.map((v) => [v.moduleId, { id: v.id, version: v.version }])
    );

    // Get active subscriptions for these modules
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptions = await (prisma as any).developerModuleSubscription.findMany({
      where: { businessId: business.id, moduleId: { in: moduleIds }, status: 'ACTIVE' },
      select: {
        moduleId: true,
        currentPeriodEnd: true,
        nextBillingAt: true,
        autoRenew: true,
        period: true,
        amount: true,
        currency: true,
      },
    });
    const subMap = new Map(subscriptions.map((s: any) => [s.moduleId, s]));

    const enriched = installations.map((inst) => {
      const settings = (inst.settings as Record<string, any>) || {};
      const isTrial = settings?.isTrial || false;
      const trialEndsAt = settings?.trialEndsAt ? new Date(settings.trialEndsAt) : null;
      const trialExpired = isTrial && trialEndsAt && now > trialEndsAt;
      const trialDaysLeft =
        isTrial && trialEndsAt
          ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

      const latestV = latestVersionMap.get(inst.moduleId);
      const hasUpdate = latestV ? latestV.id !== (inst as any).currentVersionId : false;

      const sub = subMap.get(inst.moduleId);

      return {
        ...inst,
        isTrial,
        trialEndsAt,
        trialExpired,
        trialDaysLeft: Math.max(0, trialDaysLeft),
        module: inst.module,
        hasUpdate,
        latestVersion: latestV?.version || inst.module.version,
        subscription: sub || null,
      };
    });

    res.json({ success: true, data: enriched });
  }
);

export const getMyBusiness = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const requestedId =
    (req.headers['x-business-id'] as string) ||
    (req.query.businessId as string) ||
    (req.body?.businessId as string) ||
    null;
  const [business, businesses] = await Promise.all([
    businessService.getMyBusiness(req.user.id, requestedId),
    businessService.getMyBusinesses(req.user.id),
  ]);
  res.json({ success: true, data: business, businesses });
});

export const getMyBusinessPlan = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await getBusinessByOwner(req.user.id);
    const overview = await getBusinessPlanOverview(business.id);
    res.json({ success: true, data: overview });
  }
);

export const getMyBusinessAlertQueue = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await getBusinessByOwner(req.user.id);
    const queue = await getBusinessAlertQueue(business.id);
    res.json({ success: true, data: queue });
  }
);

export const createBusiness = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const business = await businessService.createBusiness(req.user.id, req.body);
  res.status(201).json({ success: true, data: business, message: 'Business créé avec succès' });
});

export const toggleBusinessModule = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { module, enabled } = req.body;
    if (!module) throw new AppError('Module requis', 400);

    const business = await prisma.business.findFirst({ where: { ownerId: req.user.id } });
    if (!business) throw new AppError('Business non trouvé', 404);

    const currentModules = business.modules as string[];
    let updatedModules: string[];

    if (enabled) {
      if (currentModules.includes(module)) {
        return res.json({
          success: true,
          data: { modules: currentModules },
          message: 'Module déjà activé',
        });
      }
      updatedModules = [...currentModules, module];
    } else {
      updatedModules = currentModules.filter((m) => m !== module);
    }

    await prisma.business.update({
      where: { id: business.id },
      data: { modules: { set: updatedModules as BusinessModule[] } },
    });

    res.json({
      success: true,
      data: { modules: updatedModules },
      message: enabled ? 'Module activé' : 'Module désactivé',
    });
  }
);

export const updatePublicPage = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const {
      name,
      slug,
      description,
      shortDescription,
      tagline,
      phone,
      email,
      whatsapp,
      address,
      googleMapsLink,
      seoTitle,
      seoDescription,
      socialLinks,
      logo,
      coverImage,
      theme,
      gallery,
      hours,
    } = req.body;
    const business = await prisma.business.findFirst({ where: { ownerId: req.user.id } });
    if (!business) throw new AppError('Business non trouvé', 404);

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;
    if (address !== undefined) updateData.address = address;
    if (logo !== undefined) updateData.logo = logo;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (googleMapsLink !== undefined) updateData.googleMapsLink = googleMapsLink;
    // Thème de la vitrine : fusion avec l'existant pour ne pas écraser les clés non envoyées
    if (theme !== undefined && theme !== null && typeof theme === 'object') {
      const current =
        business.theme && typeof business.theme === 'object'
          ? (business.theme as Record<string, unknown>)
          : {};
      updateData.theme = { ...current, ...theme };
    }
    if (gallery !== undefined && Array.isArray(gallery)) {
      updateData.gallery = gallery.filter((u: unknown) => typeof u === 'string' && u.length > 0);
    }

    try {
      await prisma.business.update({
        where: { id: business.id },
        data: updateData,
      });
    } catch (err: any) {
      // P2002 = violation d'unicité (le slug est déjà pris par un autre business)
      if (err?.code === 'P2002') {
        throw new AppError('Ce slug est déjà utilisé par un autre business', 409);
      }
      throw err;
    }

    // Update hours if provided
    if (hours && Array.isArray(hours)) {
      const dayMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      };
      for (const h of hours) {
        const dayNum = dayMap[h.day];
        if (dayNum !== undefined) {
          await prisma.businessHour.upsert({
            where: { businessId_day: { businessId: business.id, day: dayNum } },
            update: { open: h.open, close: h.close, isClosed: h.isClosed || false },
            create: {
              businessId: business.id,
              day: dayNum,
              open: h.open,
              close: h.close,
              isClosed: h.isClosed || false,
            },
          });
        }
      }
    }

    res.json({ success: true, message: 'Page publique mise à jour avec succès' });
  }
);

export const getBusinessPaymentMethods = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await prisma.business.findFirst({ where: { ownerId: req.user.id } });
    if (!business) throw new AppError('Business non trouvé', 404);

    const methods = await prisma.businessPaymentMethod.findMany({
      where: { businessId: business.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: methods });
  }
);

export const addBusinessPaymentMethod = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { method, name, number, nameOnAccount } = req.body;
    const business = await prisma.business.findFirst({ where: { ownerId: req.user.id } });
    if (!business) throw new AppError('Business non trouvé', 404);

    const pm = await prisma.businessPaymentMethod.create({
      data: {
        businessId: business.id,
        method,
        name,
        number,
        nameOnAccount,
        isActive: true,
      },
    });
    res.status(201).json({ success: true, data: pm, message: 'Moyen de paiement ajouté' });
  }
);

export const updateBusinessPaymentMethod = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { id } = req.params;
    const { method, name, number, nameOnAccount, isActive } = req.body;
    const business = await prisma.business.findFirst({ where: { ownerId: req.user.id } });
    if (!business) throw new AppError('Business non trouvé', 404);

    await prisma.businessPaymentMethod.updateMany({
      where: { id, businessId: business.id },
      data: { method, name, number, nameOnAccount, isActive },
    });
    res.json({ success: true, message: 'Moyen de paiement mis à jour' });
  }
);

export const deleteBusinessPaymentMethod = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { id } = req.params;
    const business = await prisma.business.findFirst({ where: { ownerId: req.user.id } });
    if (!business) throw new AppError('Business non trouvé', 404);

    await prisma.businessPaymentMethod.deleteMany({
      where: { id, businessId: business.id },
    });
    res.json({ success: true, message: 'Moyen de paiement supprimé' });
  }
);

export const listBusinessDocuments = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const docs = await documentService.listDocuments(req.user!.id);
    res.json({ success: true, data: docs });
  }
);

export const getBusinessDocument = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const doc = await documentService.getDocument(req.user!.id, req.params.id);
    res.json({ success: true, data: doc });
  }
);

export const createBusinessDocument = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const doc = await documentService.createDocument(req.user!.id, req.body);
    res.status(201).json({ success: true, data: doc });
  }
);

export const updateBusinessDocument = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const doc = await documentService.updateDocument(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: doc });
  }
);

export const deleteBusinessDocument = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    await documentService.deleteDocument(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Document supprimé' });
  }
);

export const listBusinessDisputes = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const disputes = await disputeService.listDisputes(req.user!.id, req.query);
    res.json({ success: true, data: disputes });
  }
);

export const getBusinessDispute = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const dispute = await disputeService.getDispute(req.user!.id, req.params.id);
    res.json({ success: true, data: dispute });
  }
);

export const createBusinessDispute = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const dispute = await disputeService.createDispute(req.user!.id, req.body);
    res.status(201).json({ success: true, data: dispute });
  }
);

export const updateBusinessDispute = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const dispute = await disputeService.updateDispute(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: dispute });
  }
);

export const submitBusinessVerification = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const result = await businessService.submitVerification(req.user.id, req.body);
    res.json({
      success: true,
      data: result,
      message: 'Documents de vérification soumis avec succès',
    });
  }
);

export const getBusinessCommissionStats = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!business) throw new AppError('Business non trouvé', 404);

    const period = (req.query.period as string) || '30d';
    const now = new Date();
    let dateFrom: Date | undefined;
    switch (period) {
      case '7d':
        dateFrom = new Date(now.getTime() - 7 * 86400000);
        break;
      case '30d':
        dateFrom = new Date(now.getTime() - 30 * 86400000);
        break;
      case '90d':
        dateFrom = new Date(now.getTime() - 90 * 86400000);
        break;
      case '1y':
        dateFrom = new Date(now.getTime() - 365 * 86400000);
        break;
      default:
        dateFrom = undefined;
    }

    const dateFilter = dateFrom ? { createdAt: { gte: dateFrom } } : {};

    // Total revenue from orders
    const orderAgg = await prisma.order.aggregate({
      where: { businessId: business.id, ...dateFilter },
      _sum: { totalAmount: true },
    });
    const totalRevenue = Number(orderAgg._sum.totalAmount || 0);

    // Commissions prélevées via FinancialLogs
    const commissionLogs = await prisma.financialLog.findMany({
      where: {
        businessId: business.id,
        action: 'MANUAL_ADJUSTMENT',
        ...dateFilter,
        metadata: { path: ['commissionType'], not: Prisma.JsonNull },
      },
    });

    let totalCommissions = 0;
    for (const log of commissionLogs) {
      totalCommissions += Math.abs(Number(log.amount || 0));
    }

    // Nombre de transactions sur la période
    const transactionCount = await prisma.paymentTransaction.count({
      where: { businessId: business.id, status: 'SUCCESS', ...dateFilter },
    });

    // Taux actuels
    const transactionRate = await getTransactionCommissionRate();
    const escrowRate = await getEscrowCommissionRate();

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalCommissions,
        netRevenue: totalRevenue - totalCommissions,
        transactionCount,
        commissionRate: transactionRate,
        escrowRate,
        period,
      },
    });
  }
);

export const getBusinessLiveStats = catchAsyncErrors(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const business = await prisma.business.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });
  if (!business) throw new AppError('Business not found', 404);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const [visitorsToday, ordersToday, bookingsWeek, activeClients] = await Promise.all([
    prisma.businessPageView.count({
      where: { businessId: business.id, viewedAt: { gte: today } },
    }),
    prisma.order.count({
      where: { businessId: business.id, createdAt: { gte: today }, status: { not: 'CANCELLED' } },
    }),
    prisma.booking.count({
      where: {
        providerId: business.ownerId,
        createdAt: { gte: weekStart },
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      },
    }),
    prisma.businessPageView.groupBy({
      by: ['visitorId'],
      where: {
        businessId: business.id,
        viewedAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        visitorId: { not: null },
      }, // last 30 min
      _count: true,
    }),
  ]);

  res.json({
    success: true,
    data: {
      visitorsToday,
      ordersToday,
      bookingsWeek,
      activeClients: activeClients.length,
    },
  });
});

export const respondToBusinessReview = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { slug, reviewId } = req.params;
    const { response } = req.body;
    if (!response?.trim()) throw new AppError('La réponse est requise', 400);
    const result = await businessService.respondToBusinessReview(
      slug,
      reviewId,
      req.user.id,
      response
    );
    res.json({ success: true, data: result, message: 'Réponse publiée' });
  }
);

export const getPublicPagePreview = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        hours: { orderBy: { day: 'asc' } },
        paymentMethods: { where: { isActive: true } },
        settings: true,
      },
    });
    if (!business) throw new AppError('Business non trouvé', 404);

    const [products, services] = await Promise.all([
      prisma.product.findMany({
        where: { businessId: business.id, isActive: true, deletedAt: null },
        take: 12,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.service.findMany({
        where: { businessId: business.id, isActive: true, deletedAt: null },
        take: 12,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({ success: true, data: { ...business, products, services } });
  }
);

// ===== FAQ =====
export const getPublicFaqs = catchAsyncErrors(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const faqs = await faqService.getBusinessFaqs(slug);
  res.json({ success: true, data: faqs });
});

export const getMyFaqs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const faqs = await faqService.getMyFaqs(req.user.id);
  res.json({ success: true, data: faqs });
});

export const createFaq = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const faq = await faqService.createFaq(req.user.id, req.body);
  res.status(201).json({ success: true, data: faq });
});

export const updateFaq = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  const faq = await faqService.updateFaq(req.user.id, req.params.faqId, req.body);
  res.json({ success: true, data: faq });
});

export const deleteFaq = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await faqService.deleteFaq(req.user.id, req.params.faqId);
  res.json({ success: true, data: null });
});

export const reorderFaqs = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) throw new AppError('Non authentifié', 401);
  await faqService.reorderFaqs(req.user.id, req.body.faqIds);
  res.json({ success: true, message: 'FAQs réordonnées' });
});

// ===== Disputes (owner-based) =====
export const deleteBusinessDispute = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    await disputeService.deleteDispute(req.user.id, req.params.id);
    res.json({ success: true, data: null });
  }
);

// ===== Modules =====
export const getDeveloperModuleInstallations = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { getDeveloperInstallations } = await import('../services/developerModules');
    const result = await getDeveloperInstallations(req.user.id, req.query.status as string);
    res.json({ success: true, data: result });
  }
);

export const getModuleAssignments = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
    });
    if (!business) throw new AppError('Business non trouvé', 404);
    const { getBusinessModules } = await import('../services/developerConfiguration');
    const result = await getBusinessModules(business.id);
    res.json({ success: true, data: result });
  }
);

export const getModuleAnalysis = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { getBusinessModules } = await import('../services/developerConfiguration');
    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
    });
    if (!business) throw new AppError('Business non trouvé', 404);
    const result = await getBusinessModules(business.id);
    res.json({ success: true, data: result });
  }
);

/**
 * POST /business/modules/update/:installationId
 * Update an installed module to its latest version
 * Records the new version on the installation and logs the activity
 */
export const confirmModuleUpdate = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new AppError('Non authentifié', 401);
    const { installationId } = req.params;

    const business = await prisma.business.findFirst({
      where: { ownerId: req.user.id },
      select: { id: true },
    });
    if (!business) throw new AppError('Business non trouvé', 404);

    const installation = await prisma.developerModuleInstallation.findFirst({
      where: { id: installationId, businessId: business.id },
      include: { module: { include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } } } },
    });
    if (!installation) throw new AppError('Installation non trouvée', 404);

    const latestVersion = installation.module.versions[0];
    if (!latestVersion) throw new AppError('Aucune version disponible', 404);

    // Update installation to track the new version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).developerModuleInstallation.update({
      where: { id: installationId },
      data: { currentVersionId: latestVersion.id },
    });

    // Increment download count on version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).developerModuleVersion.update({
      where: { id: latestVersion.id },
      data: { downloadCount: { increment: 1 } },
    });

    // Log the update activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).moduleActivityLog.create({
      data: {
        moduleId: installation.moduleId,
        businessId: business.id,
        activityType: 'UPDATED',
        description: `Module mis à jour vers la version ${latestVersion.version}`,
      },
    });

    res.json({
      success: true,
      message: `Module mis à jour vers la version ${latestVersion.version}`,
    });
  }
);
