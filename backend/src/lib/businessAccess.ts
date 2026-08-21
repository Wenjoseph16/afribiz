import { prisma } from './db';
import { AppError } from '../middlewares/errorHandler';

const BUSINESS_SELECT = {
  id: true,
  name: true,
  latitude: true,
  longitude: true,
  type: true,
  logo: true,
} as const;

/**
 * Retourne le business d'un propriétaire.
 *
 * MULTI-ACTIVITÉ (Chantier 5) : un boss peut posséder N business (boutique + gym
 * + locations). Quand `businessId` est fourni et appartient au propriétaire, on le
 * retourne ; sinon on retombe sur le premier business actif — comportement
 * identique à l'ancien single-business, donc zéro régression.
 */
export async function getBusinessByOwner(ownerId: string, businessId?: string | null) {
  let business: any = null;

  if (businessId) {
    business = await prisma.business.findFirst({
      where: { id: businessId, ownerId, deletedAt: null, isActive: true },
      select: BUSINESS_SELECT,
    });
  }

  if (!business) {
    business = await prisma.business.findFirst({
      where: { ownerId, deletedAt: null, isActive: true },
      orderBy: { createdAt: 'asc' },
      select: BUSINESS_SELECT,
    });
  }

  if (!business) throw new AppError('Business non trouvé ou inactif', 404);
  return business;
}

/** Tous les business d'un boss (pour la bascule + la vue consolidée). */
export async function getBusinessesByOwner(ownerId: string) {
  return prisma.business.findMany({
    where: { ownerId, deletedAt: null, isActive: true },
    orderBy: { createdAt: 'asc' },
    select: BUSINESS_SELECT,
  });
}

/** Vérifie qu'un business appartient bien à l'utilisateur (sécurité multi-tenant). */
export async function assertBusinessOwnership(ownerId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, ownerId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!business) throw new AppError('Accès refusé à ce business', 403);
  return business;
}

export async function resolveBusinessAccess(params: {
  userId: string;
  roles: string[];
  bodyBusinessId?: string;
}): Promise<{ businessId: string; businessName: string } | null> {
  const { userId, roles, bodyBusinessId } = params;
  const isAdmin = roles.some((r) => r === 'ADMIN');
  const isDev = roles.some((r) => r === 'DEVELOPER');
  const isOwner = roles.some((r) => r === 'BUSINESS');

  // ADMIN : peut cibler n'importe quel business actif
  if (isAdmin && bodyBusinessId) {
    const business = await prisma.business.findFirst({
      where: { id: bodyBusinessId, isActive: true },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    if (business) return { businessId: business.id, businessName: business.name };
  }

  // ADMIN sans businessId spécifié : son propre premier business s'il en a un
  if (isAdmin && !bodyBusinessId) {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    if (business) return { businessId: business.id, businessName: business.name };
  }

  // DEVELOPER : peut cibler un business via ses installations de modules
  if (isDev && bodyBusinessId) {
    const [business, installation] = await Promise.all([
      prisma.business.findFirst({
        where: { id: bodyBusinessId, isActive: true },
        select: { id: true, name: true, latitude: true, longitude: true },
      }),
      prisma.developerModuleInstallation.findFirst({
        where: {
          businessId: bodyBusinessId,
          module: { developer: { userId } },
        },
      }),
    ]);
    if (business && installation) {
      return { businessId: business.id, businessName: business.name };
    }
    // Fallback : le dev a aussi son propre business
    const ownBusiness = await prisma.business.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    if (ownBusiness) return { businessId: ownBusiness.id, businessName: ownBusiness.name };
  }

  // BUSINESS owner : son premier business actif
  if (isOwner) {
    const business = await prisma.business.findFirst({
      where: { ownerId: userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    if (business) return { businessId: business.id, businessName: business.name };
  }

  return null;
}
