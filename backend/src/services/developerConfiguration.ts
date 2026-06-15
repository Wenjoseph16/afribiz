import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

/**
 * Save module configuration for a business
 */
export async function saveModuleConfiguration(
  moduleId: string,
  businessId: string,
  installationId: string,
  settings: any
) {
  const existing = await prisma.moduleConfiguration.findUnique({
    where: { moduleId_businessId: { moduleId, businessId } },
  });

  if (existing) {
    return prisma.moduleConfiguration.update({
      where: { id: existing.id },
      data: { settings, isActive: true },
    });
  }

  return prisma.moduleConfiguration.create({
    data: {
      moduleId,
      businessId,
      installationId,
      settings,
    },
  });
}

/**
 * Get module configuration for a business
 */
export async function getModuleConfiguration(moduleId: string, businessId: string) {
  const config = await prisma.moduleConfiguration.findUnique({
    where: { moduleId_businessId: { moduleId, businessId } },
  });

  return config ?? { settings: {}, isActive: false };
}

/**
 * Toggle module active state for a business
 */
export async function toggleModuleActive(
  moduleId: string,
  businessId: string,
  isActive: boolean
) {
  const config = await prisma.moduleConfiguration.findUnique({
    where: { moduleId_businessId: { moduleId, businessId } },
  });

  if (!config) throw new AppError('Configuration non trouvée', 404);

  return prisma.moduleConfiguration.update({
    where: { id: config.id },
    data: { isActive },
  });
}

/**
 * Get all configurations for a module (developer view)
 */
export async function getModuleConfigurations(moduleId: string) {
  return prisma.moduleConfiguration.findMany({
    where: { moduleId, isActive: true },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
      installation: { select: { status: true, createdAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Get all installed modules for a business with their configurations
 */
export async function getBusinessModules(businessId: string) {
  return prisma.moduleConfiguration.findMany({
    where: { businessId },
    include: {
      module: {
        select: {
          id: true, name: true, slug: true, logo: true,
          description: true, version: true, category: true,
          developer: {
            select: {
              id: true, companyName: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
      installation: { select: { status: true, createdAt: true, updatedAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}
