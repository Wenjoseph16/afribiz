import { prisma } from '../lib/db';
import { VERIFICATION_LIMITS } from '../config/verificationLimits';
import { AppError } from '../middlewares/errorHandler';

export async function getVerificationLevel(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      verificationLevel: true,
      verificationStatus: true,
      verifiedAt: true,
      identityDocument: true,
      companyDocument: true,
      rejectionReason: true,
    },
  });

  if (!business) throw new AppError('Business introuvable', 404);

  const limits = VERIFICATION_LIMITS[business.verificationLevel];

  return {
    level: business.verificationLevel,
    status: business.verificationStatus,
    verifiedAt: business.verifiedAt,
    rejectionReason: business.rejectionReason,
    hasIdentityDoc: !!business.identityDocument,
    hasCompanyDoc: !!business.companyDocument,
    limits: {
      maxTransactionAmount: limits.maxTransactionAmount,
      maxDailyTransactions: limits.maxDailyTransactions,
      maxEscrowAmount: limits.maxEscrowAmount,
      commissionRate: limits.commissionRate,
      escrowReleaseDelay: limits.escrowReleaseDelay,
      badgeVerifie: limits.badgeVerifie,
      canMarketplacePriority: limits.canMarketplacePriority,
    },
    nextLevel: getNextLevel(business.verificationLevel),
  };
}

function getNextLevel(
  current: string
): { level: string; label: string; requirements: string[] } | null {
  switch (current) {
    case 'ARGENT':
      return {
        level: 'OR',
        label: 'Or',
        requirements: [
          "Pièce d'identité (passeport, CNI, permis)",
          'Photo du commerce ou du responsable',
        ],
      };
    case 'OR':
      return {
        level: 'PLATINE',
        label: 'Platine',
        requirements: [
          'Registre de commerce ou patente',
          'Visite de vérification terrain',
          "Au moins 30 jours d'activité sur AfriBiz",
        ],
      };
    default:
      return null;
  }
}

export async function upgradeToOr(
  businessId: string,
  identityDocument: string,
  responsiblePhoto: string
) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { verificationLevel: true },
  });

  if (!business) throw new AppError('Business introuvable', 404);
  if (business.verificationLevel !== 'ARGENT') {
    throw new AppError('Vous êtes déjà au niveau Or ou supérieur', 400);
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      identityDocument,
      responsiblePhoto,
      verificationStatus: 'VERIFIED',
      verificationLevel: 'OR',
      verifiedAt: new Date(),
    },
  });

  return updated;
}

export async function upgradeToPlatine(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { verificationLevel: true, createdAt: true },
  });

  if (!business) throw new AppError('Business introuvable', 404);
  if (business.verificationLevel !== 'OR') {
    throw new AppError("Vous devez d'abord être au niveau Or", 400);
  }

  const daysSinceCreation = Math.floor(
    (Date.now() - business.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceCreation < 30) {
    throw new AppError("Le niveau Platine nécessite au moins 30 jours d'activité sur AfriBiz", 400);
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: {
      verificationLevel: 'PLATINE',
      verifiedAt: new Date(),
    },
  });

  return updated;
}

export async function getTransactionStats(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId },
    select: { id: true, verificationLevel: true },
  });

  if (!business) throw new AppError('Business introuvable', 404);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayCount = await prisma.order.count({
    where: {
      business: { ownerId },
      createdAt: { gte: today },
    },
  });

  const limits = VERIFICATION_LIMITS[business.verificationLevel];

  return {
    todayTransactions: todayCount,
    maxDailyTransactions: limits.maxDailyTransactions,
    dailyRemaining: limits.maxDailyTransactions
      ? Math.max(0, limits.maxDailyTransactions - todayCount)
      : null,
    currentLevel: business.verificationLevel,
  };
}
