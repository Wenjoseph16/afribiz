import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';
import { DeveloperRepository } from '../repositories/developerRepository';

/**
 * Get all permissions for a module
 */
export async function getModulePermissions(moduleId: string) {
  return prisma.modulePermission.findMany({
    where: { moduleId },
    orderBy: [{ resource: 'asc' }, { accessLevel: 'asc' }],
  });
}

/**
 * Add a permission to a module
 */
export async function addModulePermission(
  userId: string,
  moduleId: string,
  data: {
    resource: string;
    accessLevel: string;
    description?: string;
    isRequired?: boolean;
  }
) {
  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile) throw new AppError('Profil développeur non trouvé', 404);

  const module = await prisma.developerModule.findFirst({
    where: { id: moduleId, developerId: profile.id },
  });
  if (!module) throw new AppError('Module non trouvé ou non autorisé', 404);

  const existing = await prisma.modulePermission.findUnique({
    where: {
      moduleId_resource_accessLevel: {
        moduleId,
        resource: data.resource as any,
        accessLevel: data.accessLevel as any,
      },
    },
  });
  if (existing) throw new AppError('Cette permission existe déjà', 409);

  return prisma.modulePermission.create({
    data: {
      moduleId,
      resource: data.resource as any,
      accessLevel: data.accessLevel as any,
      description: data.description,
      isRequired: data.isRequired ?? true,
    },
  });
}

/**
 * Remove a permission from a module
 */
export async function removeModulePermission(userId: string, permissionId: string) {
  const permission = await prisma.modulePermission.findUnique({
    where: { id: permissionId },
    include: { module: { select: { developerId: true } } },
  });
  if (!permission) throw new AppError('Permission non trouvée', 404);

  const profile = await DeveloperRepository.findByUserId(userId);
  if (!profile || permission.module.developerId !== profile.id) {
    throw new AppError('Non autorisé', 403);
  }

  await prisma.modulePermission.delete({ where: { id: permissionId } });
  return { success: true };
}

/**
 * Check if a module has required permissions for a business
 */
export async function checkModulePermissions(moduleId: string, businessId: string) {
  const permissions = await prisma.modulePermission.findMany({
    where: { moduleId, isRequired: true },
  });

  const businessConfig = await prisma.moduleConfiguration.findUnique({
    where: { moduleId_businessId: { moduleId, businessId } },
  });

  return {
    permissions,
    granted: businessConfig?.isActive ?? false,
    config: businessConfig,
  };
}

/**
 * Get permission summary for a module (used in marketplace listing)
 */
export async function getPermissionSummary(moduleId: string) {
  const permissions = await prisma.modulePermission.findMany({
    where: { moduleId },
    select: {
      resource: true,
      accessLevel: true,
      isRequired: true,
      description: true,
    },
    orderBy: [{ resource: 'asc' }, { accessLevel: 'asc' }],
  });

  return {
    readPermissions: permissions.filter((p) => p.accessLevel === 'READ'),
    writePermissions: permissions.filter((p) => p.accessLevel === 'WRITE'),
    adminPermissions: permissions.filter((p) => p.accessLevel === 'ADMIN'),
    total: permissions.length,
    required: permissions.filter((p) => p.isRequired).length,
  };
}
