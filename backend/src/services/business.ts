import { Prisma, BusinessType, BusinessModule, BusinessVerificationStatus } from '@prisma/client';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { getPublicPortfolio } from './portfolio';

export async function getPublicBusiness(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true, deletedAt: null },
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
    },
  });
  if (!business) throw new AppError('Business non trouvé', 404);

  return {
    ...business,
    owner: business.owner ? {
      ...business.owner,
      yearsOfExperience: null,
      skills: [],
      certifications: [],
    } : null,
  };
}

async function getBusinessIdBySlug(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug, isActive: true, deletedAt: null },
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
  website?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
  modules: BusinessModule[];
  paymentMethods?: {
    method: string;
    name: string;
    number: string;
    isActive: boolean;
  }[];
}

export async function getMyBusiness(ownerId: string) {
  return prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    include: {
      settings: true,
      owner: {
        select: {
          id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true,
        },
      },
    },
  });
}

export async function getMyBusinessStats(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true, _count: { select: { orders: true, reviews: true, products: true, services: true } } },
  });

  if (!business) {
    return { clients: 0, orders: 0, revenue: 0, reviewsReceived: 0, visitors: 0, conversionRate: 0 };
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
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
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
    prisma.order.aggregate({ where: { businessId, paidAt: { gte: startOfDay, lt: endOfDay } }, _sum: { totalAmount: true } }).then(r => Number(r._sum.totalAmount || 0)),
    prisma.payment.aggregate({ where: { order: { businessId }, status: 'COMPLETED', paidAt: { gte: startOfDay, lt: endOfDay } }, _sum: { amount: true } }).then(r => Number(r._sum.amount || 0)),
    prisma.order.findMany({ where: { businessId, createdAt: { gte: startOfDay, lt: endOfDay }, buyerId: { not: null } }, select: { buyerId: true }, distinct: ['buyerId'] }).then(orders => orders.length),
    prisma.order.count({ where: { businessId, status: { in: ['PENDING', 'CONFIRMED'] } } }),
    prisma.quote.count({ where: { businessId, status: { in: ['DRAFT', 'SENT'] } } }),
    prisma.invoice.aggregate({ where: { businessId, status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] } }, _sum: { totalAmount: true } }).then(r => Number(r._sum.totalAmount || 0)),
    prisma.dispute.count({ where: { businessId, status: { in: ['OUVERT', 'EN_COURS'] } } }),
    prisma.debt.aggregate({ where: { businessId, status: { in: ['ACTIVE', 'OVERDUE', 'CRITICAL'] } }, _sum: { remainingAmount: true } }).then(r => Number(r._sum.remainingAmount || 0)),
    prisma.product.count({ where: { businessId, stock: { lte: 5 }, isActive: true, deletedAt: null } }),
    prisma.debt.count({ where: { businessId, status: 'OVERDUE' } }),
    prisma.invoice.count({ where: { businessId, status: 'OVERDUE' } }),
    prisma.businessDocument.count({ where: { businessId, expiresAt: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) } } }),
    prisma.order.aggregate({ where: { businessId, paidAt: { gte: startOfYesterday, lt: endOfYesterday } }, _sum: { totalAmount: true } }).then(r => Number(r._sum.totalAmount || 0)),
    prisma.payment.aggregate({ where: { order: { businessId }, status: 'COMPLETED', paidAt: { gte: startOfYesterday, lt: endOfYesterday } }, _sum: { amount: true } }).then(r => Number(r._sum.amount || 0)),
    prisma.order.count({ where: { businessId, createdAt: { gte: startOfWeek, lt: endOfWeek } } }),
    prisma.booking.count({ where: { businessId, startDate: { gte: startOfWeek, lt: endOfWeek } } }),
  ]);

  const todayRevenue = todayPaidOrdersSum + todayPaymentsSum;

  return {
    today: {
      ordersCount: todayOrdersCount,
      bookingsCount: todayBookingsCount,
      revenue: todayRevenue,
      newClients: todayNewClients,
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
  };
}

export async function createBusiness(ownerId: string, data: OnboardingInput) {
  const existing = await prisma.business.findUnique({ where: { ownerId }, select: { id: true } });
  if (existing) throw new AppError('Vous avez déjà un business', 409);

  const slug = await generateUniqueSlug(data.name);

  // Mandatory modules always activated
  const mandatoryModules: BusinessModule[] = [];

  const allModules: BusinessModule[] = [...mandatoryModules, ...data.modules];

  const { latitude, longitude, modules: inputModules, paymentMethods: inputPaymentMethods, ...rest } = data;

  const business = await prisma.$transaction(async (tx) => {
    const created = await tx.business.create({
      data: {
        slug,
        latitude,
        longitude,
        modules: { set: allModules },
        onboardingCompleted: true,
        onboardedAt: new Date(),
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
        facebook: rest.facebook || undefined,
        instagram: rest.instagram || undefined,
        tiktok: rest.tiktok || undefined,
        linkedin: rest.linkedin || undefined,
      },
    });

    await tx.businessSettings.create({
      data: {
        businessId: created.id,
      },
    });

    // Create payment methods if provided
    if (inputPaymentMethods && inputPaymentMethods.length > 0) {
      await tx.businessPaymentMethod.createMany({
        data: inputPaymentMethods.map(pm => ({
          businessId: created.id,
          method: pm.method,
          name: pm.name || null,
          number: pm.number || null,
          isActive: pm.isActive ?? true,
        })),
      });
    }

    return created;
  });

  const currentUser = await prisma.user.findUnique({ where: { id: ownerId }, select: { roles: true } });
  const roles = currentUser?.roles ?? [];
  const updateData: Prisma.UserUpdateArgs['data'] = { primaryRole: 'BUSINESS' };
  if (!roles.includes('BUSINESS')) {
    updateData.roles = { push: 'BUSINESS' } as any;
  }
  await prisma.user.update({ where: { id: ownerId }, data: updateData });

  return prisma.business.findUnique({
    where: { id: business.id },
    include: {
      settings: true,
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

export async function submitVerification(userId: string, data: { identityDocument: string; companyDocument: string; taxDocument?: string; responsiblePhoto: string }) {
  const business = await prisma.business.findUnique({ where: { ownerId: userId } });
  if (!business) throw new AppError('Aucun commerce trouvé pour cet utilisateur', 404);
  if (business.verificationStatus === 'VERIFIED') throw new AppError('Votre commerce est déjà vérifié', 409);

  const updated = await prisma.business.update({
    where: { ownerId: userId },
    data: {
      identityDocument: data.identityDocument,
      companyDocument: data.companyDocument,
      taxDocument: data.taxDocument || null,
      responsiblePhoto: data.responsiblePhoto,
      verificationStatus: BusinessVerificationStatus.PENDING,
    },
  });
  return updated;
}

