import {
  NotificationType,
  ModulePricingType,
  ModuleStatus,
} from '@prisma/client';
import * as paymentProcessor from './paymentProcessor';
import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { DeveloperRepository } from '../repositories/developerRepository';
import { searchIdsByText } from '../lib/fulltext';

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

async function generateUniqueModuleSlug(name: string): Promise<string> {
  let slug = slugify(name);
  if (!slug) slug = 'module';
  let exists = await prisma.developerModule.findUnique({ where: { slug }, select: { id: true } });
  let counter = 1;
  while (exists) {
    const newSlug = `${slug}-${counter}`;
    exists = await prisma.developerModule.findUnique({ where: { slug: newSlug }, select: { id: true } });
    if (!exists) return newSlug;
    counter++;
  }
  return slug;
}

async function getDeveloperIdByUserId(userId: string): Promise<string> {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);
  return profile.id;
}

async function getBusinessIdByOwnerId(ownerId: string): Promise<string> {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw new AppError('Business non trouvé', 404);
  return business.id;
}

/**
 * Create a new module
 */
export async function createModule(userId: string, data: {
  name: string;
  category: string;
  description?: string;
  shortDescription?: string;
  price?: number;
  currency?: string;
  fullDescription?: string;
  logo?: string;
  images?: string[];
  subcategory?: string;
  demoVideo?: string;
  documentation?: string;
  installationGuide?: string;
  hasFreeVersion?: boolean;
  hasPremiumVersion?: boolean;
  freeVersionFeatures?: string[];
  premiumVersionFeatures?: string[];
  termsOfUse?: string;
  supportPolicy?: string;
  licenseType?: string;
  requires?: string[];
}) {
  const developerId = await getDeveloperIdByUserId(userId);
  const slug = await generateUniqueModuleSlug(data.name);

  return prisma.developerModule.create({
    data: {
      developerId,
      slug,
      name: data.name,
      category: data.category,
      description: data.description || data.shortDescription || undefined,
      price: data.price || undefined,
      currency: data.currency || 'FCFA',
      fullDescription: data.fullDescription || undefined,
      logo: data.logo || undefined,
      images: data.images || [],
      subcategory: data.subcategory || undefined,
      // map installationGuide -> setupGuide, requires -> requirements, combine features arrays
      setupGuide: data.installationGuide || undefined,
      requirements: data.requires ? (Array.isArray(data.requires) ? data.requires.join(',') : String(data.requires)) : undefined,
      features: ((data.freeVersionFeatures || []) as string[]).concat((data.premiumVersionFeatures || []) as string[]),
      isFree: data.hasFreeVersion || false,
    },
  });
}

/**
 * Update a module
 */
export async function updateModule(moduleId: string, userId: string, data: any) {
  const developerId = await getDeveloperIdByUserId(userId);
  const module = await prisma.developerModule.findFirst({
    where: { id: moduleId, developerId },
  });
  if (!module) throw new AppError('Module non trouvé', 404);

  return prisma.developerModule.update({
    where: { id: moduleId },
    data,
  });
}

/**
 * Publish a module
 */
export async function publishModule(moduleId: string, userId: string) {
  const developerId = await getDeveloperIdByUserId(userId);
  const module = await prisma.developerModule.findFirst({
    where: { id: moduleId, developerId },
  });
  if (!module) throw new AppError('Module non trouvé', 404);

  if ((module as any).isPublished) {
    throw new AppError('Module déjà publié', 409);
  }

  return prisma.developerModule.update({
    where: { id: moduleId },
    data: {
      isPublished: true,
      publishedAt: new Date(),
    },
  });
}

/**
 * Archive a module
 */
export async function archiveModule(moduleId: string, userId: string) {
  const developerId = await getDeveloperIdByUserId(userId);
  const module = await prisma.developerModule.findFirst({
    where: { id: moduleId, developerId },
  });
  if (!module) throw new AppError('Module non trouvé', 404);

  return prisma.developerModule.update({
    where: { id: moduleId },
    data: {
      isPublished: false,
      archivedAt: new Date(),
    },
  });
}

/**
 * Get all modules for a developer, optionally filtered by status
 */
export async function getDeveloperModules(userId: string, status?: string) {
  const developerId = await getDeveloperIdByUserId(userId);
  const where: any = { developerId };
  if (status) {
    if (status === 'PUBLISHED') where.isPublished = true;
    else if (status === 'UNPUBLISHED') where.isPublished = false;
  }

  return prisma.developerModule.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      versions: { orderBy: { createdAt: 'desc' } },
      _count: { select: { installations: true, reviews: true, supportTickets: true } },
    },
  });
}

/**
 * Get module by ID
 */
export async function getModuleById(moduleId: string) {
  const module = await prisma.developerModule.findUnique({
    where: { id: moduleId },
    include: {
      developer: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      versions: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          installations: true,
          reviews: true,
        },
      },
    },
  });
  if (!module) throw new AppError('Module non trouvé', 404);
  return module;
}

/**
 * Get module by slug
 */
export async function getModuleBySlug(slug: string) {
  const module = await prisma.developerModule.findUnique({
    where: { slug },
    include: {
      developer: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
      // versions handled separately via getModuleVersions
      _count: {
        select: {
          installations: true,
          reviews: true,
        },
      },
    },
  });
  if (!module) throw new AppError('Module non trouvé', 404);
  return module;
}

/**
 * Get marketplace modules with filtering, search, sort, pagination
 */
export async function getMarketplaceModules(
  category?: string,
  search?: string,
  sort?: string,
  page: number = 1,
  limit: number = 10
) {
  const where: any = { isPublished: true };

  if (category) where.category = category;
  if (search) {
    const ids = await searchIdsByText('DeveloperModule', ['name', 'description', 'fullDescription'], search, '"isPublished" = true');
    where.id = ids.length > 0 ? { in: ids } : { in: [] };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'popular') orderBy = { createdAt: 'desc' };
  else if (sort === 'rating') orderBy = { rating: 'desc' };
  else if (sort === 'sales') orderBy = { totalSales: 'desc' };
  else if (sort === 'price_asc') orderBy = { price: 'asc' };
  else if (sort === 'price_desc') orderBy = { price: 'desc' };
  else if (sort === 'name') orderBy = { name: 'asc' };

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.developerModule.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        developer: {
          select: {
            id: true,
            companyName: true,
            rating: true,
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    }),
    prisma.developerModule.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Purchase a module (paid) — initiates payment before installation
 */
export async function purchaseModule(moduleId: string, userId: string, data: {
  provider: string;
  phone: string;
}) {
  const module = await prisma.developerModule.findUnique({
    where: { id: moduleId },
  });
  if (!module) throw new AppError('Module non trouvé', 404);
  if (!(module as any).isPublished) {
    throw new AppError('Ce module n\'est pas disponible', 400);
  }

  const businessId = await getBusinessIdByOwnerId(userId);

  // Check if already installed
  const existing = await prisma.developerModuleInstallation.findFirst({
    where: { moduleId, businessId },
  });
  if (existing) throw new AppError('Module déjà installé sur ce business', 409);

  const amount = Number(module.price) || 0;

  // Free module — install immediately
  if (amount <= 0 || (module as any).isFree) {
    return installModule(moduleId, userId);
  }

  // Paid module — initiate payment first
  const result = await paymentProcessor.processMobileMoney(
    data.provider,
    data.phone,
    amount,
    `Module: ${module.name}`
  );

  // Save the transaction
  await paymentProcessor.saveTransaction({
    businessId,
    userId,
    amount,
    currency: module.currency || 'FCFA',
    provider: data.provider,
    providerRef: result.providerRef,
    status: result.status,
    fee: result.fee || 0,
    metadata: { moduleId, moduleName: module.name },
  });

  if (result.status === 'SUCCESS') {
    // Payment confirmed immediately (test mode) — install module
    return completeModulePurchase(moduleId, userId, businessId, amount);
  }

  return {
    success: true,
    message: result.message || `Paiement ${data.provider} initié. Confirmez sur votre téléphone.`,
    providerRef: result.providerRef,
    status: 'PENDING',
  };
}

/**
 * Confirm payment and complete module installation
 */
export async function completeModulePurchase(
  moduleId: string,
  userId: string,
  businessId: string,
  amount: number
) {
  const module = await prisma.developerModule.findUnique({
    where: { id: moduleId },
  });
  if (!module) throw new AppError('Module non trouvé', 404);

  // Create installation
  const installation = await prisma.developerModuleInstallation.create({
    data: {
      moduleId,
      businessId,
      status: 'ACTIVE',
      installedAt: new Date(),
    },
  });

  // Create license for the module
  const license = await createLicenseForModule(moduleId, businessId, amount, module.currency || 'FCFA');

  // Record developer revenue
  const commissionRate = 0.30;
  const commissionAmount = amount * commissionRate;
  const netAmount = amount - commissionAmount;

  try {
    // Revenue recording is best-effort (schema may vary)
    try {
      await (prisma.developerRevenue.create as any)({
        data: {
          developerId: (module as any).developerId,
          moduleId,
          type: 'MODULE_SALE',
          amount,
          commissionAmount,
          netAmount,
          status: 'COMPLETED',
        },
      });
    } catch (e) {
      // Non-blocking
    }
  } catch (e) {
    // Revenue table might have different schema; non-blocking
  }

  // Notify the business owner
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: NotificationType.SYSTEM,
        title: 'Module installé avec succès',
        description: `Le module ${module.name} a été installé et est prêt à être utilisé.`,
        link: `/dashboard/marketplace/${module.slug}`,
        metadata: { moduleId, moduleName: module.name, businessId },
      },
    });
  } catch (e) {
    // Non-blocking
  }

  return {
    success: true,
    message: 'Module installé avec succès !',
    installation,
    license,
  };
}

/**
 * Start a 7-day free trial for a paid module
 */
export async function startTrial(moduleId: string, userId: string) {
  const module = await prisma.developerModule.findUnique({
    where: { id: moduleId },
  });
  if (!module) throw new AppError('Module non trouvé', 404);
  if (!(module as any).isPublished) {
    throw new AppError('Ce module n\'est pas disponible', 400);
  }
  if ((module as any).isFree || !module.price || Number(module.price) <= 0) {
    throw new AppError('Ce module est gratuit, utilisez l\'installation directe', 400);
  }

  const businessId = await getBusinessIdByOwnerId(userId);

  // Check if already installed
  const existing = await prisma.developerModuleInstallation.findFirst({
    where: { moduleId, businessId },
  });
  if (existing) throw new AppError('Module déjà installé sur ce business', 409);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 7);

  const installation = await prisma.developerModuleInstallation.create({
    data: {
      moduleId,
      businessId,
      status: 'TRIAL',
      installedAt: new Date(),
      settings: { isTrial: true, trialEndsAt: trialEndsAt.toISOString() },
    },
  });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true, name: true },
  });

  if (business) {
    await createLicenseForModule(moduleId, businessId, 0, module.currency || 'FCFA');

    try {
      await prisma.notification.create({
        data: {
          userId: business.ownerId,
          type: NotificationType.SYSTEM,
          title: 'Essai gratuit commencé',
          description: `Vous utilisez ${module.name} en essai gratuit jusqu'au ${trialEndsAt.toLocaleDateString('fr-FR')}.`,
          link: `/dashboard/marketplace/${module.slug}`,
          metadata: { moduleId, moduleName: module.name, businessId, isTrial: true, trialEndsAt },
        },
      });
    } catch (e) {}
  }

  return {
    success: true,
    message: `Essai gratuit de 7 jours commencé ! Vous pouvez utiliser ${module.name} jusqu'au ${trialEndsAt.toLocaleDateString('fr-FR')}.`,
    installation,
    trialEndsAt,
  };
}

/**
 * Helper: create a license for a module purchase
 */
async function createLicenseForModule(
  moduleId: string,
  businessId: string,
  amount: number,
  currency: string
) {
  try {
    const licenseData = {
      moduleId,
      businessId,
      licenseType: amount > 0 ? 'STANDARD' : 'FREE',
      price: amount || undefined,
      currency,
      status: 'ACTIVE',
      startsAt: new Date(),
    };

    return await (prisma as any).moduleLicense.create({
      data: licenseData,
    });
  } catch (e) {
    return null; // Non-blocking if license table doesn't exist
  }
}

/**
 * Confirm a pending payment for a module (called by webhook or manual confirm)
 */
export async function confirmModulePayment(
  userId: string,
  providerRef: string
) {
  // Find the transaction
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { providerRef, userId },
  });
  if (!transaction) throw new AppError('Transaction non trouvée', 404);

  if (transaction.status === 'SUCCESS') {
    throw new AppError('Transaction déjà confirmée', 400);
  }

  // Update transaction status
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCESS',
      paidAt: new Date(),
    },
  });

  const metadata = transaction.metadata as any;
  if (metadata?.moduleId) {
    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });
    if (business) {
      return completeModulePurchase(
        metadata.moduleId,
        userId,
        business.id,
        transaction.amount
      );
    }
  }

  return { success: true, message: 'Paiement confirmé' };
}

/**
 * Install a module for a business (free / direct install)
 */
export async function installModule(moduleId: string, userId: string) {
  const module = await prisma.developerModule.findUnique({
    where: { id: moduleId },
  });
  if (!module) throw new AppError('Module non trouvé', 404);
  if (!(module as any).isPublished) {
    throw new AppError('Ce module n\'est pas disponible', 400);
  }

  const businessId = await getBusinessIdByOwnerId(userId);

  const existing = await prisma.developerModuleInstallation.findFirst({
    where: { moduleId, businessId },
  });
  if (existing) throw new AppError('Module déjà installé sur ce business', 409);

  const installation = await prisma.developerModuleInstallation.create({
    data: {
      moduleId,
      businessId,

      installedAt: new Date(),
    },
  });

    // Incrementing install counters or revenue is optional depending on schema

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { ownerId: true, name: true },
  });

  if (business) {
    const amount = module.price || 0;
    const commissionRate = 0.30;
    const commissionAmount = Number(amount) * commissionRate;
    const netAmount = Number(amount) - commissionAmount;

    await Promise.all([
      prisma.notification.create({
        data: {
          userId: business.ownerId,
          type: NotificationType.SYSTEM,
          title: 'Nouveau module installé',
          description: `Le module ${module.name} a été installé avec succès.`,
          link: `/dashboard/${module.slug}`,
          metadata: {
            moduleId: module.id,
            moduleName: module.name,
            businessId,
          },
        },
      }),
      prisma.businessSettings.upsert({
        where: { businessId },
        create: {
          businessId,
          currency: 'FCFA',
          timezone: 'Africa/Lome',
          language: 'fr',
          dateFormat: 'DD/MM/YYYY',
        },
        update: {},
      }),
      // developerRevenue table may not exist in schema; skip revenue recording here
    ]);
  }

  return installation;
}

/**
 * Uninstall a module
 */
export async function uninstallModule(installationId: string) {
  const installation = await prisma.developerModuleInstallation.findUnique({
    where: { id: installationId },
  });
  if (!installation) throw new AppError('Installation non trouvée', 404);

  return prisma.developerModuleInstallation.update({
    where: { id: installationId },
    data: {
      status: 'UNINSTALLED',
      uninstalledAt: new Date(),
    },
  });
}

/**
 * Create a new module version
 */
export async function createModuleVersion(moduleId: string, data: {
  version: string;
  releaseNotes?: string;
  changelog?: string;
}) {
  const module = await prisma.developerModule.findUnique({
    where: { id: moduleId },
  });
  if (!module) throw new AppError('Module non trouvé', 404);

  const version = await prisma.developerModuleVersion.create({
    data: {
      moduleId,
      version: data.version,
      releaseNotes: data.releaseNotes || undefined,
      changelog: data.changelog || undefined,
    },
  });

  await prisma.developerModule.update({
    where: { id: moduleId },
    data: { version: data.version },
  });

  return version;
}

/**
 * Get all versions of a module
 */
export async function getModuleVersions(moduleId: string) {
  return prisma.developerModuleVersion.findMany({
    where: { moduleId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Search modules with filters
 */
export async function searchModules(
  query: string,
  filters: {
    category?: string;
    pricingType?: ModulePricingType;
    isFree?: boolean;
    minRating?: number;
    sort?: string;
    page?: number;
    limit?: number;
  }
) {
  const where: any = { status: ModuleStatus.PUBLISHED };

  if (query) {
    const ids = await searchIdsByText('DeveloperModule', ['name', 'description', 'fullDescription'], query, `"status" = '${ModuleStatus.PUBLISHED}'`);
    where.id = ids.length > 0 ? { in: ids } : { in: [] };
  }

  if (filters.category) where.category = filters.category;
  if (filters.pricingType) where.pricingType = filters.pricingType;
  if (filters.isFree) where.pricingType = ModulePricingType.FREE;
  if (filters.minRating) where.rating = { gte: filters.minRating };

  let orderBy: any = { createdAt: 'desc' };
  if (filters.sort === 'popular') orderBy = { totalInstalls: 'desc' };
  else if (filters.sort === 'rating') orderBy = { rating: 'desc' };
  else if (filters.sort === 'sales') orderBy = { totalSales: 'desc' };

  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.developerModule.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        developer: {
          select: {
            id: true,
            companyName: true,
            rating: true,
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    }),
    prisma.developerModule.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ============================================
// MODULE REVIEW FUNCTIONS
// ============================================

/**
 * Create a review for a module
 */
export async function createReview(moduleId: string, userId: string, data: { rating: number; title?: string; comment?: string }) {
  const module = await prisma.developerModule.findUnique({
    where: { id: moduleId },
    select: { id: true, developerId: true },
  });
  if (!module) throw new AppError('Module non trouvé', 404);

  const existing = await prisma.developerModuleReview.findUnique({
    where: { moduleId_userId: { moduleId, userId } },
  });
  if (existing) throw new AppError('Vous avez déjà noté ce module', 409);

  const review = await prisma.developerModuleReview.create({
    data: {
      moduleId,
      developerId: module.developerId,
      userId,
      rating: data.rating,
      title: data.title || undefined,
      comment: data.comment || undefined,
    },
  });

  await recalculateModuleRating(moduleId);
  await recalculateDeveloperRating(module.developerId);

  return review;
}

/**
 * Get reviews for a module
 */
export async function getModuleReviews(moduleId: string) {
  return prisma.developerModuleReview.findMany({
    where: { moduleId, isActive: true },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Respond to a review
 */
export async function respondToReview(reviewId: string, userId: string, response: string) {
  const review = await prisma.developerModuleReview.findUnique({
    where: { id: reviewId },
    include: { module: { select: { developer: { select: { userId: true } } } } },
  });
  if (!review) throw new AppError('Avis non trouvé', 404);
  if (review.module.developer.userId !== userId) {
    throw new AppError('Vous n\'êtes pas autorisé à répondre à cet avis', 403);
  }

  return prisma.developerModuleReview.update({
    where: { id: reviewId },
    data: { response, responseAt: new Date() },
  });
}

async function recalculateModuleRating(moduleId: string) {
  const stats = await prisma.developerModuleReview.aggregate({
    where: { moduleId, isActive: true },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.developerModule.update({
    where: { id: moduleId },
    data: {
      rating: stats._avg.rating || 0,
      reviewCount: stats._count,
    },
  });
}

async function recalculateDeveloperRating(developerId: string) {
  const stats = await prisma.developerModuleReview.aggregate({
    where: { developerId, isActive: true },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.developerProfile.update({
    where: { id: developerId },
    data: {
      rating: stats._avg.rating || 0,
      reviewCount: stats._count,
    },
  });
}

// ============================================
// SUPPORT TICKET FUNCTIONS
// ============================================

/**
 * Create a support ticket (by developer or business)
 */
export async function createTicket(userId: string, data: {
  businessId: string;
  subject: string;
  description: string;
  priority?: string;
  category?: string;
  moduleId?: string;
}) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  return prisma.developerSupportTicket.create({
    data: {
      developerId: developerProfile.id,
      businessId: data.businessId,
      moduleId: data.moduleId || undefined,
      subject: data.subject,
      description: data.description,
      priority: data.priority || 'NORMAL',
      category: data.category || 'OTHER',
    },
  });
}

/**
 * Get tickets for a developer
 */
export async function getMyTickets(userId: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  return prisma.developerSupportTicket.findMany({
    where: { developerId: developerProfile.id },
    include: {
      module: { select: { id: true, name: true, slug: true } },
      messages: {
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get a ticket by ID
 */
export async function getTicketById(ticketId: string, userId: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  const ticket = await prisma.developerSupportTicket.findFirst({
    where: { id: ticketId, developerId: developerProfile.id },
    include: {
      module: { select: { id: true, name: true, slug: true } },
      messages: {
        include: { sender: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!ticket) throw new AppError('Ticket non trouvé', 404);
  return ticket;
}

/**
 * Reply to a ticket
 */
export async function replyToTicket(ticketId: string, userId: string, content: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  const ticket = await prisma.developerSupportTicket.findFirst({
    where: { id: ticketId, developerId: developerProfile.id },
  });
  if (!ticket) throw new AppError('Ticket non trouvé', 404);

  return prisma.developerSupportMessage.create({
    data: {
      ticketId,
      senderId: userId,
      content,
    },
  });
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId: string, userId: string, status: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  const ticket = await prisma.developerSupportTicket.findFirst({
    where: { id: ticketId, developerId: developerProfile.id },
  });
  if (!ticket) throw new AppError('Ticket non trouvé', 404);

  const data: any = { status };
  if (status === 'RESOLVED' || status === 'CLOSED') {
    data.resolvedAt = new Date();
  }

  return prisma.developerSupportTicket.update({
    where: { id: ticketId },
    data,
  });
}

// ============================================
// REVENUE FUNCTIONS
// ============================================

/**
 * Get revenue history for a developer
 */
export async function getRevenueHistory(userId: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  return prisma.developerRevenue.findMany({
    where: { developerId: developerProfile.id },
    include: {
      module: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get revenue summary for a developer
 */
export async function getRevenueSummary(userId: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  const [totalRevenue, totalCommissions, monthlyRevenue, byType] = await Promise.all([
    prisma.developerRevenue.aggregate({
      where: { developerId: developerProfile.id, status: 'COMPLETED' },
      _sum: { netAmount: true, amount: true, commissionAmount: true },
    }),
    prisma.developerRevenue.aggregate({
      where: { developerId: developerProfile.id, status: 'COMPLETED' },
      _sum: { commissionAmount: true },
    }),
    prisma.developerRevenue.findMany({
      where: {
        developerId: developerProfile.id,
        status: 'COMPLETED',
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.developerRevenue.groupBy({
      by: ['type'],
      where: { developerId: developerProfile.id, status: 'COMPLETED' },
      _sum: { netAmount: true },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.netAmount || 0,
    totalGross: totalRevenue._sum.amount || 0,
    totalCommissions: totalCommissions._sum.commissionAmount || 0,
    monthlyRevenue: monthlyRevenue.reduce((sum, r) => sum + Number(r.netAmount), 0),
    byType: byType.reduce((acc: Record<string, number>, curr) => {
      acc[curr.type] = Number(curr._sum.netAmount) || 0;
      return acc;
    }, {}),
  };
}

// ============================================
// PAYOUT FUNCTIONS
// ============================================

/**
 * Get payout history for a developer
 */
export async function getDeveloperInstallations(userId: string, status?: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur introuvable', 404);

  const where: any = {
    module: { developerId: developerProfile.id },
  };
  if (status) where.status = status;

  return prisma.developerModuleInstallation.findMany({
    where,
    include: {
      module: { select: { id: true, name: true, slug: true, logo: true } },
      business: { select: { id: true, name: true, slug: true, logo: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDeveloperOrders(userId: string, params?: { type?: string; page?: number; limit?: number }) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur introuvable', 404);

  const where: any = { developerId: developerProfile.id };
  if (params?.type) where.type = params.type;

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.developerRevenue.findMany({
      where,
      include: { module: { select: { id: true, name: true, slug: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.developerRevenue.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getDeveloperSubscriptions(userId: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur introuvable', 404);

  const installations = await prisma.developerModuleInstallation.findMany({
    where: {
      module: { developerId: developerProfile.id },
      status: 'ACTIVE',
      autoUpdate: true,
    },
    include: {
      module: { select: { id: true, name: true, slug: true, logo: true, pricingType: true, price: true, currency: true } },
      business: { select: { id: true, name: true, slug: true, logo: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return installations;
}

export async function getPayoutHistory(userId: string) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  return prisma.developerPayout.findMany({
    where: { developerId: developerProfile.id },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Request a payout
 */
export async function requestPayout(userId: string, data: {
  amount: number;
  method: string;
  currency?: string;
  notes?: string;
}) {
  const developerProfile = await DeveloperRepository.findByUserId(userId);
  if (!developerProfile) throw new AppError('Profil développeur non trouvé', 404);

  const commissionRate = 0.30;
  const commissionAmount = data.amount * commissionRate;
  const netAmount = data.amount - commissionAmount;

  return prisma.developerPayout.create({
    data: {
      developerId: developerProfile.id,
      amount: data.amount,
      currency: data.currency || 'FCFA',
      commissionAmount,
      method: data.method,
      notes: data.notes || undefined,
    },
  });
}
