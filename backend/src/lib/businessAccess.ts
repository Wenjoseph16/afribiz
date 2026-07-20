import { prisma } from './db';
import { AppError } from '../middlewares/errorHandler';

/**
 * Retourne le business actif et non-supprimé associé à un propriétaire.
 * Utilise findUnique (ownerId est unique) + filtre deletedAt:null + isActive:true.
 * Tous les services doivent utiliser ce helper pour un comportement homogène.
 */
export async function getBusinessByOwner(ownerId: string) {
  const business = await prisma.business.findUnique({
    where: { ownerId, deletedAt: null, isActive: true },
    select: { id: true, name: true, latitude: true, longitude: true },
  });
  if (!business) throw new AppError('Business non trouvé ou inactif', 404);
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
    const business = await prisma.business.findUnique({
      where: { id: bodyBusinessId, isActive: true },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    if (business) return { businessId: business.id, businessName: business.name };
  }

  // ADMIN sans businessId spécifié : utilise son propre business s'il en a un
  if (isAdmin && !bodyBusinessId) {
    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    if (business) return { businessId: business.id, businessName: business.name };
  }

  // DEVELOPER : peut cibler un business via ses installations de modules
  if (isDev && bodyBusinessId) {
    const [business, installation] = await Promise.all([
      prisma.business.findUnique({
        where: { id: bodyBusinessId, isActive: true },
        select: { id: true, name: true, latitude: true, longitude: true },
      }),
      prisma.developerModuleInstallation.findFirst({
        where: {
          businessId: bodyBusinessId,
          module: {
            developer: {
              userId: userId,
            },
          },
        },
      }),
    ]);
    if (business && installation) {
      return { businessId: business.id, businessName: business.name };
    }
    // Fallback : le dev a aussi son propre business
    const ownBusiness = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    if (ownBusiness) return { businessId: ownBusiness.id, businessName: ownBusiness.name };
  }

  // BUSINESS owner : retourne son propre business
  if (isOwner) {
    const business = await prisma.business.findUnique({
      where: { ownerId: userId },
      select: { id: true, name: true, latitude: true, longitude: true },
    });
    if (business) return { businessId: business.id, businessName: business.name };
  }

  return null;
}
