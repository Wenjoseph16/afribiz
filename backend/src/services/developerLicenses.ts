import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { DeveloperRepository } from '../repositories/developerRepository';
import { v4 as uuidv4 } from 'uuid';

function generateLicenseKey(): string {
  const segments = [
    uuidv4().substring(0, 8).toUpperCase(),
    uuidv4().substring(0, 4).toUpperCase(),
    uuidv4().substring(0, 4).toUpperCase(),
    uuidv4().substring(0, 12).toUpperCase(),
  ];
  return segments.join('-');
}

/**
 * Create a license for a module installation
 */
export async function createLicense(
  moduleId: string,
  businessId: string,
  data: {
    licenseType: string;
    price?: number;
    currency?: string;
    expiresAt?: Date;
    autoRenew?: boolean;
  }
) {
  const existing = await prisma.moduleLicense.findFirst({
    where: { moduleId, businessId, status: 'ACTIVE' },
  });
  if (existing) throw new AppError('Une licence active existe déjà', 409);

  const licenseKey = generateLicenseKey();

  return prisma.moduleLicense.create({
    data: {
      moduleId,
      businessId,
      licenseType: data.licenseType as any,
      licenseKey,
      price: data.price,
      currency: data.currency || 'FCFA',
      expiresAt: data.expiresAt,
      autoRenew: data.autoRenew ?? false,
    },
  });
}

/**
 * Activate a license by key
 */
export async function activateLicense(licenseKey: string) {
  const license = await prisma.moduleLicense.findUnique({
    where: { licenseKey },
  });
  if (!license) throw new AppError('Licence non trouvée', 404);

  if (license.status !== 'PENDING') {
    throw new AppError('Cette licence ne peut pas être activée', 400);
  }

  return prisma.moduleLicense.update({
    where: { id: license.id },
    data: {
      status: 'ACTIVE',
      startsAt: new Date(),
    },
  });
}

/**
 * Revoke a license
 */
export async function revokeLicense(userId: string, licenseId: string, reason?: string) {
  const license = await prisma.moduleLicense.findUnique({
    where: { id: licenseId },
    include: {
      module: { select: { developerId: true } },
    },
  });
  if (!license) throw new AppError('Licence non trouvée', 404);

  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile || license.module.developerId !== profile.id) {
    throw new AppError('Non autorisé', 403);
  }

  return prisma.moduleLicense.update({
    where: { id: licenseId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokeReason: reason,
    },
  });
}

/**
 * Renew a license
 */
export async function renewLicense(
  licenseId: string,
  options?: { durationDays?: number; amount?: number; currency?: string }
) {
  const license = await prisma.moduleLicense.findUnique({
    where: { id: licenseId },
    include: {
      module: {
        select: { id: true, developerId: true, totalRevenue: true, currency: true, price: true },
      },
    },
  });
  if (!license) throw new AppError('Licence non trouvée', 404);

  const durationDays = options?.durationDays ?? 365;
  const amount = options?.amount ?? (license.price || Number(license.module?.price || 0));
  const currency = options?.currency || license.currency || license.module?.currency || 'FCFA';

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  // Record revenue for the renewal
  const amountNum = Number(amount);
  if (amountNum > 0 && license.module) {
    try {
      const { getMonetizationSettings } = await import('./monetizationConfig');
      const settings = await getMonetizationSettings();
      const commissionRate = settings.developerModuleCommissionRate;
      const commissionAmount = amountNum * commissionRate;
      const netAmount = amountNum - commissionAmount;

      await prisma.developerRevenue.create({
        data: {
          developerId: license.module.developerId,
          moduleId: license.moduleId,
          type: 'MODULE_SALE' as any,
          amount: amountNum,
          commissionAmount,
          netAmount,
          commissionRate,
          status: 'COMPLETED',
        },
      });

      // Update total revenue on module
      await prisma.developerModule.update({
        where: { id: license.moduleId },
        data: { totalRevenue: { increment: netAmount } },
      });
    } catch {
      /* non-blocking */
    }
  }

  return prisma.moduleLicense.update({
    where: { id: licenseId },
    data: {
      status: 'ACTIVE',
      expiresAt,
      price: amount,
      currency,
    },
  });
}

/**
 * Check if a business has a valid license for a module
 */
export async function checkLicense(moduleId: string, businessId: string) {
  const license = await prisma.moduleLicense.findFirst({
    where: {
      moduleId,
      businessId,
      status: 'ACTIVE',
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
  });

  return {
    valid: !!license,
    license,
    expiresIn: license?.expiresAt
      ? Math.ceil((license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

/**
 * Get all licenses for a module (developer view)
 */
export async function getModuleLicenses(moduleId: string) {
  return prisma.moduleLicense.findMany({
    where: { moduleId },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all licenses for a business
 */
export async function getBusinessLicenses(businessId: string) {
  return prisma.moduleLicense.findMany({
    where: { businessId },
    include: {
      module: { select: { id: true, name: true, slug: true, logo: true, version: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get license statistics for a developer
 */
export async function getLicenseStats(developerId: string) {
  const [total, active, expired, revoked, revenue] = await Promise.all([
    prisma.moduleLicense.count({
      where: { module: { developerId } },
    }),
    prisma.moduleLicense.count({
      where: { module: { developerId }, status: 'ACTIVE' },
    }),
    prisma.moduleLicense.count({
      where: { module: { developerId }, status: 'EXPIRED' },
    }),
    prisma.moduleLicense.count({
      where: { module: { developerId }, status: 'REVOKED' },
    }),
    prisma.moduleLicense.aggregate({
      where: { module: { developerId }, status: 'ACTIVE' },
      _sum: { price: true },
    }),
  ]);

  return {
    total,
    active,
    expired,
    revoked,
    monthlyRevenue: revenue._sum.price || 0,
  };
}
