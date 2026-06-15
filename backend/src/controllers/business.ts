import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';
import { Prisma } from '@prisma/client';
import { catchAsyncErrors } from '../middlewares/errorHandler';
import { AuthenticatedRequest } from '../middlewares/auth';
import * as businessService from '../services/business';
import * as documentService from '../services/documents';
import * as disputeService from '../services/disputes';
import { getTransactionCommissionRate, getEscrowCommissionRate } from '../services/monetizationConfig';

export const getPublicBusiness = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const business = await businessService.getPublicBusiness(slug);
  res.json({ success: true, data: business });
});

export const getBusinessProducts = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessProducts(slug);
  res.json({ success: true, data });
});

export const getBusinessServices = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessServices(slug);
  res.json({ success: true, data });
});

export const getBusinessMenu = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessMenu(slug);
  res.json({ success: true, data });
});

export const getBusinessRooms = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessRooms(slug);
  res.json({ success: true, data });
});

export const getBusinessEvents = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessEvents(slug);
  res.json({ success: true, data });
});

export const getBusinessRentals = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessRentals(slug);
  res.json({ success: true, data });
});

export const getBusinessPortfolio = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessPortfolio(slug);
  res.json({ success: true, data });
});

export const getBusinessPromotions = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessPromotions(slug);
  res.json({ success: true, data });
});

export const getBusinessPartners = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessPartners(slug);
  res.json({ success: true, data });
});

export const getBusinessReviews = catchAsyncErrors(async (req: Request, res: Response, _next: NextFunction) => {
  const { slug } = req.params;
  const data = await businessService.getBusinessReviews(slug);
  res.json({ success: true, data });
});

export const getMyBusinessClients = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id } });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

  const { search, limit } = req.query;
  const take = Math.min(Number(limit) || 50, 100);

  const where: any = { businessId: business.id, buyerId: { not: null } };
  if (search) {
    const q = search as string;
    where.buyer = {
      OR: [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { email: { contains: q } },
      ],
    };
  }

  const orders = await prisma.order.findMany({
    where,
    include: { buyer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true } } },
    distinct: ['buyerId'],
    take,
    orderBy: { createdAt: 'desc' },
  });

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
    }));

  res.json({ success: true, data: { clients, total: clients.length } });
});

export const getAggregatedStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const stats = await businessService.getAggregatedDashboardStats(req.user.id);
  res.json({ success: true, data: stats });
});

export const getMyBusinessStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const stats = await businessService.getMyBusinessStats(req.user.id);
  res.json({ success: true, data: stats });
});

export const getBusinessInstalledModules = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });

  const business = await prisma.business.findUnique({
    where: { ownerId: req.user.id },
    select: { id: true },
  });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

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
  const enriched = installations.map((inst) => {
    const settings = inst.settings as any || {};
    const isTrial = settings?.isTrial || false;
    const trialEndsAt = settings?.trialEndsAt ? new Date(settings.trialEndsAt) : null;
    const trialExpired = isTrial && trialEndsAt && now > trialEndsAt;
    const trialDaysLeft = isTrial && trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      ...inst,
      isTrial,
      trialEndsAt,
      trialExpired,
      trialDaysLeft: Math.max(0, trialDaysLeft),
      module: inst.module,
    };
  });

  res.json({ success: true, data: enriched });
});

export const getMyBusiness = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const business = await businessService.getMyBusiness(req.user.id);
  res.json({ success: true, data: business });
});

export const createBusiness = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const business = await businessService.createBusiness(req.user.id, req.body);
  res.status(201).json({ success: true, data: business, message: 'Business créé avec succès' });
});

export const toggleBusinessModule = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { module, enabled } = req.body;
  if (!module) return res.status(400).json({ success: false, error: 'Module requis' });

  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id } });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

  const currentModules = business.modules as string[];
  let updatedModules: string[];

  if (enabled) {
    if (currentModules.includes(module)) {
      return res.json({ success: true, data: { modules: currentModules }, message: 'Module déjà activé' });
    }
    updatedModules = [...currentModules, module];
  } else {
    updatedModules = currentModules.filter((m) => m !== module);
  }

  await prisma.business.update({
    where: { id: business.id },
    data: { modules: { set: updatedModules as any } },
  });

  res.json({ success: true, data: { modules: updatedModules }, message: enabled ? 'Module activé' : 'Module désactivé' });
});

export const updatePublicPage = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { name, slug, description, shortDescription, tagline, phone, email, whatsapp, address, googleMapsLink, seoTitle, seoDescription, socialLinks, logo, coverImage, hours } = req.body;
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id } });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

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

  await prisma.business.update({
    where: { id: business.id },
    data: updateData,
  });

  // Update hours if provided
  if (hours && Array.isArray(hours)) {
    const dayMap: Record<string, number> = {
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4,
      friday: 5, saturday: 6, sunday: 0,
    };
    for (const h of hours) {
      const dayNum = dayMap[h.day];
      if (dayNum !== undefined) {
        await prisma.businessHour.upsert({
          where: { businessId_day: { businessId: business.id, day: dayNum } },
          update: { open: h.open, close: h.close, isClosed: h.isClosed || false },
          create: { businessId: business.id, day: dayNum, open: h.open, close: h.close, isClosed: h.isClosed || false },
        });
      }
    }
  }

  res.json({ success: true, message: 'Page publique mise à jour avec succès' });
});

export const getBusinessPaymentMethods = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id } });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

  const methods = await prisma.businessPaymentMethod.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, data: methods });
});

export const addBusinessPaymentMethod = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { method, name, number, nameOnAccount } = req.body;
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id } });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

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
});

export const updateBusinessPaymentMethod = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const { method, name, number, nameOnAccount, isActive } = req.body;
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id } });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

  const pm = await prisma.businessPaymentMethod.updateMany({
    where: { id, businessId: business.id },
    data: { method, name, number, nameOnAccount, isActive },
  });
  res.json({ success: true, message: 'Moyen de paiement mis à jour' });
});

export const deleteBusinessPaymentMethod = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const { id } = req.params;
  const business = await prisma.business.findUnique({ where: { ownerId: req.user.id } });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

  await prisma.businessPaymentMethod.deleteMany({
    where: { id, businessId: business.id },
  });
  res.json({ success: true, message: 'Moyen de paiement supprimé' });
});

export const listBusinessDocuments = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const docs = await documentService.listDocuments(req.user!.id);
  res.json({ success: true, data: docs });
});

export const getBusinessDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const doc = await documentService.getDocument(req.user!.id, req.params.id);
  res.json({ success: true, data: doc });
});

export const createBusinessDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const doc = await documentService.createDocument(req.user!.id, req.body);
  res.status(201).json({ success: true, data: doc });
});

export const updateBusinessDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const doc = await documentService.updateDocument(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: doc });
});

export const deleteBusinessDocument = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  await documentService.deleteDocument(req.user!.id, req.params.id);
  res.json({ success: true, message: 'Document supprimé' });
});

export const listBusinessDisputes = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const disputes = await disputeService.listDisputes(req.user!.id, req.query);
  res.json({ success: true, data: disputes });
});

export const getBusinessDispute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const dispute = await disputeService.getDispute(req.user!.id, req.params.id);
  res.json({ success: true, data: dispute });
});

export const createBusinessDispute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const dispute = await disputeService.createDispute(req.user!.id, req.body);
  res.status(201).json({ success: true, data: dispute });
});

export const updateBusinessDispute = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  const dispute = await disputeService.updateDispute(req.user!.id, req.params.id, req.body);
  res.json({ success: true, data: dispute });
});

export const submitBusinessVerification = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const result = await businessService.submitVerification(req.user.id, req.body);
  res.json({ success: true, data: result, message: 'Documents de vérification soumis avec succès' });
});

export const getBusinessCommissionStats = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const business = await prisma.business.findUnique({
    where: { ownerId: req.user.id, deletedAt: null },
    select: { id: true },
  });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

  const period = (req.query.period as string) || '30d';
  const now = new Date();
  let dateFrom: Date | undefined;
  switch (period) {
    case '7d': dateFrom = new Date(now.getTime() - 7 * 86400000); break;
    case '30d': dateFrom = new Date(now.getTime() - 30 * 86400000); break;
    case '90d': dateFrom = new Date(now.getTime() - 90 * 86400000); break;
    case '1y': dateFrom = new Date(now.getTime() - 365 * 86400000); break;
    default: dateFrom = undefined;
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
});

export const getPublicPagePreview = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Non authentifié' });
  const business = await prisma.business.findUnique({
    where: { ownerId: req.user.id },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      hours: { orderBy: { day: 'asc' } },
      paymentMethods: { where: { isActive: true } },
      settings: true,
    },
  });
  if (!business) return res.status(404).json({ success: false, error: 'Business non trouvé' });

  const [products, services] = await Promise.all([
    prisma.product.findMany({ where: { businessId: business.id, isActive: true, deletedAt: null }, take: 12, orderBy: { createdAt: 'desc' } }),
    prisma.service.findMany({ where: { businessId: business.id, isActive: true, deletedAt: null }, take: 12, orderBy: { createdAt: 'desc' } }),
  ]);

  res.json({ success: true, data: { ...business, products, services } });
});
