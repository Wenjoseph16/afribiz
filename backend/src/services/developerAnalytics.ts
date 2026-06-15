import { prisma } from '../lib/db';
import { AppError } from '../middlewares/errorHandler';

/**
 * Track a module analytics event
 */
export async function trackAnalytics(
  moduleId: string,
  data: {
    installs?: number;
    uninstalls?: number;
    activeUsers?: number;
    errors?: number;
    apiCalls?: number;
    revenue?: number;
    refunds?: number;
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await (prisma as any).moduleAnalytics.findUnique({
    where: { moduleId_date: { moduleId, date: today } },
  });

  if (existing) {
    return (prisma as any).moduleAnalytics.update({
      where: { id: existing.id },
      data: {
        installs: { increment: data.installs || 0 },
        uninstalls: { increment: data.uninstalls || 0 },
        activeUsers: data.activeUsers ?? existing.activeUsers,
        errors: { increment: data.errors || 0 },
        apiCalls: { increment: data.apiCalls || 0 },
        revenue: { increment: data.revenue || 0 },
        refunds: { increment: data.refunds || 0 },
      },
    });
  }

  return (prisma as any).moduleAnalytics.create({
    data: {
      moduleId,
      date: today,
      ...data,
    },
  });
}

/**
 * Get analytics for a module (daily aggregates)
 */
export async function getModuleAnalytics(
  moduleId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = { moduleId };
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = startDate;
    if (endDate) where.date.lte = endDate;
  }

  const data = await (prisma as any).moduleAnalytics.findMany({
    where,
    orderBy: { date: 'asc' },
  });

  const totals = data.reduce(
    (acc: any, d: any) => ({
      totalInstalls: acc.totalInstalls + d.installs,
      totalUninstalls: acc.totalUninstalls + d.uninstalls,
      totalErrors: acc.totalErrors + d.errors,
      totalApiCalls: acc.totalApiCalls + d.apiCalls,
      totalRevenue: acc.totalRevenue + Number(d.revenue || 0),
      totalRefunds: acc.totalRefunds + Number(d.refunds || 0),
      avgResponseTime: d.avgResponseTime
        ? (acc.avgResponseTime || 0) + d.avgResponseTime
        : acc.avgResponseTime,
    }),
    {
      totalInstalls: 0,
      totalUninstalls: 0,
      totalErrors: 0,
      totalApiCalls: 0,
      totalRevenue: 0,
      totalRefunds: 0,
      avgResponseTime: 0 as number | null,
    }
  );

  const daysWithResponse = data.filter((d: any) => d.avgResponseTime).length;
  if (daysWithResponse > 0 && totals.avgResponseTime) {
    totals.avgResponseTime = totals.avgResponseTime / daysWithResponse;
  }

  return {
    daily: data,
    totals,
    retention: data.length > 1
      ? (data[data.length - 1].activeUsers / Math.max(data[0].activeUsers, 1)) * 100
      : 0,
  };
}

/**
 * Log a module error
 */
export async function logModuleError(
  moduleId: string,
  data: {
    installationId?: string;
    businessId?: string;
    errorType: string;
    errorMessage?: string;
    stackTrace?: string;
    metadata?: any;
  }
) {
  return (prisma as any).moduleErrorLog.create({
    data: {
      moduleId,
      installationId: data.installationId,
      businessId: data.businessId,
      errorType: data.errorType,
      errorMessage: data.errorMessage,
      stackTrace: data.stackTrace,
      metadata: data.metadata,
    },
  });
}

/**
 * Get error logs for a module
 */
export async function getModuleErrors(
  moduleId: string,
  resolved?: boolean,
  limit: number = 50
) {
  const where: any = { moduleId };
  if (resolved !== undefined) where.resolved = resolved;

  return (prisma as any).moduleErrorLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Resolve a module error
 */
export async function resolveError(errorId: string) {
  return (prisma as any).moduleErrorLog.update({
    where: { id: errorId },
    data: { resolved: true, resolvedAt: new Date() },
  });
}

/**
 * Get developer analytics overview
 */
export async function getDeveloperAnalyticsOverview(developerId: string) {
  const modules = await prisma.developerModule.findMany({
    where: { developerId },
    select: { id: true, name: true },
  });

  const moduleIds = modules.map((m) => m.id);

  const [totalAnalytics, totalErrors, recentErrors] = await Promise.all([
    (prisma as any).moduleAnalytics.aggregate({
      where: { moduleId: { in: moduleIds } },
      _sum: {
        installs: true,
        uninstalls: true,
        errors: true,
        apiCalls: true,
        revenue: true,
        refunds: true,
      },
    }),
    (prisma as any).moduleErrorLog.count({
      where: { moduleId: { in: moduleIds }, resolved: false },
    }),
    (prisma as any).moduleErrorLog.findMany({
      where: { moduleId: { in: moduleIds }, resolved: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        module: { select: { id: true, name: true, slug: true } },
      },
    }),
  ]);

  return {
    totalModules: modules.length,
    analytics: {
      totalInstalls: totalAnalytics._sum.installs || 0,
      totalUninstalls: totalAnalytics._sum.uninstalls || 0,
      totalErrors: totalAnalytics._sum.errors || 0,
      totalApiCalls: totalAnalytics._sum.apiCalls || 0,
      totalRevenue: totalAnalytics._sum.revenue || 0,
      totalRefunds: totalAnalytics._sum.refunds || 0,
    },
    unresolvedErrors: totalErrors,
    recentErrors,
  };
}
