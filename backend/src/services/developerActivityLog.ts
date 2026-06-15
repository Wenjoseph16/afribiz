import { prisma } from '../lib/db';

/**
 * Log a module activity event
 */
export async function logActivity(
  userId: string,
  moduleId: string,
  activityType: string,
  data?: {
    businessId?: string;
    installationId?: string;
    description?: string;
    metadata?: any;
  }
) {
  return prisma.moduleActivityLog.create({
    data: {
      moduleId,
      businessId: data?.businessId,
      installationId: data?.installationId,
      activityType: activityType as any,
      description: data?.description,
      metadata: data?.metadata,
    },
  });
}

/**
 * Get activity feed for a module
 */
export async function getModuleActivity(
  moduleId: string,
  limit: number = 50
) {
  return prisma.moduleActivityLog.findMany({
    where: { moduleId },
    include: {
      business: { select: { id: true, name: true, slug: true, logo: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get activity feed for a developer
 */
export async function getDeveloperActivity(
  developerId: string,
  limit: number = 50
) {
  return prisma.moduleActivityLog.findMany({
    where: { module: { developerId } },
    include: {
      module: { select: { id: true, name: true, slug: true } },
      business: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get activity feed for a business
 */
export async function getBusinessActivity(
  businessId: string,
  limit: number = 50
) {
  return prisma.moduleActivityLog.findMany({
    where: { businessId },
    include: {
      module: { select: { id: true, name: true, slug: true, logo: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get activity stats for a module
 */
export async function getActivityStats(moduleId: string) {
  const [total, byType, recent] = await Promise.all([
    prisma.moduleActivityLog.count({ where: { moduleId } }),
    prisma.moduleActivityLog.groupBy({
      by: ['activityType'],
      where: { moduleId },
      _count: true,
    }),
    prisma.moduleActivityLog.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return { total, byType, recent };
}
