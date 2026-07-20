import { prisma } from '../lib/db';

interface DevModuleMetrics {
  moduleId: string;
  moduleName: string;
  totalInstalls: number;
  activeInstallations: number;
  uninstalls30d: number;
  errors30d: number;
  avgRating: number;
  reviewCount: number;
  healthStatus: 'good' | 'warning' | 'critical';
}

interface DevAnalyticsResult {
  developerId: string;
  developerName: string;
  totalModules: number;
  totalInstalls: number;
  modules: DevModuleMetrics[];
  overview: {
    totalErrors30d: number;
    avgResponseTime: number;
    topModule: string;
    growth: number;
  };
}

export async function getDeveloperAnalytics(userId: string): Promise<DevAnalyticsResult> {
  const profile = await prisma.developerProfile.findUnique({ where: { userId } });
  const name = profile?.companyName || 'Developer';

  const modules = await prisma.developerModule.findMany({
    where: { developerId: userId },
    select: {
      id: true,
      name: true,
      totalInstalls: true,
      rating: true,
      reviewCount: true,
      _count: {
        select: { installations: { where: { status: 'ACTIVE' } } },
      },
    },
  });

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const moduleMetrics: DevModuleMetrics[] = [];
  let totalErrors30d = 0;

  for (const mod of modules) {
    const [errors, uninstalls, analytics] = await Promise.all([
      prisma.moduleErrorLog.count({
        where: { moduleId: mod.id, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.developerModuleInstallation.count({
        where: { moduleId: mod.id, uninstalledAt: { gte: thirtyDaysAgo } },
      }),
      prisma.moduleAnalytics.findMany({
        where: { moduleId: mod.id, date: { gte: thirtyDaysAgo } },
        select: { apiCalls: true, errors: true, avgResponseTime: true },
      }),
    ]);

    totalErrors30d += errors;
    const avgRT =
      analytics.length > 0
        ? Math.round(analytics.reduce((s, a) => s + (a.avgResponseTime || 0), 0) / analytics.length)
        : 0;

    let healthStatus: 'good' | 'warning' | 'critical' = 'good';
    if (errors > 20 || (mod.totalInstalls > 10 && uninstalls > mod.totalInstalls * 0.3)) {
      healthStatus = 'critical';
    } else if (errors > 5 || avgRT > 1000) {
      healthStatus = 'warning';
    }

    moduleMetrics.push({
      moduleId: mod.id,
      moduleName: mod.name,
      totalInstalls: mod.totalInstalls,
      activeInstallations: mod._count.installations,
      uninstalls30d: uninstalls,
      errors30d: errors,
      avgRating: mod.rating || 0,
      reviewCount: mod.reviewCount || 0,
      healthStatus,
    });
  }

  const totalInstalls = modules.reduce((s, m) => s + m.totalInstalls, 0);
  const topModule = moduleMetrics.sort((a, b) => b.totalInstalls - a.totalInstalls)[0];

  // Growth compared to previous 30 days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const prevInstalls = await prisma.developerModuleInstallation.count({
    where: {
      module: { developerId: userId },
      createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
    },
  });
  const currInstalls = await prisma.developerModuleInstallation.count({
    where: {
      module: { developerId: userId },
      createdAt: { gte: thirtyDaysAgo },
    },
  });
  const growth =
    prevInstalls > 0
      ? Math.round(((currInstalls - prevInstalls) / prevInstalls) * 100)
      : currInstalls > 0
        ? 100
        : 0;

  return {
    developerId: userId,
    developerName: name,
    totalModules: modules.length,
    totalInstalls,
    modules: moduleMetrics,
    overview: {
      totalErrors30d,
      avgResponseTime:
        moduleMetrics.reduce((s, m) => s + m.activeInstallations, 0) > 0
          ? Math.round(
              moduleMetrics.reduce((s, m) => s + m.errors30d * 100, 0) /
                Math.max(
                  moduleMetrics.reduce((s, m) => s + m.activeInstallations, 0),
                  1
                )
            )
          : 0,
      topModule: topModule?.moduleName || '—',
      growth,
    },
  };
}
