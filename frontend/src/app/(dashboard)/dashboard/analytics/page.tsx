'use client';

import { useState } from 'react';
import {
  Activity,
  Eye,
  ShoppingBag,
  TrendingUp,
  Users,
  Search,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  useBusinessHealth,
  useConversionFunnel,
  useEngagementAnalytics,
  useSearchTrends,
  useRetentionCohorts,
  useProductRecommendations,
} from '@/features/afriScoreHooks';

const PERIODS = [
  { value: 7, label: '7 jours' },
  { value: 30, label: '30 jours' },
  { value: 90, label: '90 jours' },
];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const health = useBusinessHealth();
  const engagement = useEngagementAnalytics();
  const funnel = useConversionFunnel();
  const trends = useSearchTrends(days);
  const cohorts = useRetentionCohorts();
  const recommendations = useProductRecommendations(5);

  const loading =
    health.isLoading || engagement.isLoading || funnel.isLoading || trends.isLoading;

  const healthData = (health.data ?? {}) as any;
  const engagementData = (engagement.data ?? {}) as any;
  const funnelData = (funnel.data ?? {}) as any;
  const trendsData = Array.isArray(trends.data) ? trends.data : [];
  const cohortsData = Array.isArray(cohorts.data) ? cohorts.data : [];
  const recommendationsData = Array.isArray(recommendations.data) ? recommendations.data : [];

  const healthScore = healthData.healthScore ?? 0;
  const healthStatus = healthData.status ?? 'fair';
  const statusColors: Record<string, string> = {
    excellent: 'text-emerald-600',
    good: 'text-emerald-500',
    fair: 'text-amber-500',
    poor: 'text-red-500',
  };

  const funnelStages = Array.isArray(funnelData.stages) ? funnelData.stages : [];
  const funnelRates = funnelData.conversionRates ?? {};
  const totalVisitors = funnelData.totalVisitors ?? 0;

  const summaryCards = [
    {
      icon: <Activity className="h-5 w-5" />,
      iconBg: 'bg-emerald-50 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600',
      label: 'Santé du business',
      value: `${healthScore}/100`,
      sub: (
        <span className={cn('text-xs font-medium', statusColors[healthStatus] ?? 'text-gray-500')}>
          {healthStatus === 'excellent'
            ? 'Excellent'
            : healthStatus === 'good'
              ? 'Bon'
              : healthStatus === 'fair'
                ? 'À surveiller'
                : 'À améliorer'}
        </span>
      ),
    },
    {
      icon: <Users className="h-5 w-5" />,
      iconBg: 'bg-blue-50 dark:bg-blue-900/30',
      iconColor: 'text-blue-600',
      label: 'Clients actifs',
      value: engagementData.activeClients ?? 0,
      sub: `${engagementData.totalClients ?? 0} clients au total`,
    },
    {
      icon: <Eye className="h-5 w-5" />,
      iconBg: 'bg-purple-50 dark:bg-purple-900/30',
      iconColor: 'text-purple-600',
      label: 'Visites (30j)',
      value: engagementData.pageViews30d ?? 0,
      sub: `Taux d'engagement ${engagementData.engagementRate ?? 0}%`,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      iconBg: 'bg-teal-50 dark:bg-teal-900/30',
      iconColor: 'text-teal-600',
      label: 'Conversations (30j)',
      value: engagementData.conversations30d ?? 0,
      sub: `${totalVisitors} visiteurs dans le funnel`,
    },
  ];

  const maxStage = funnelStages.length
    ? Math.max(...funnelStages.map((s: any) => s.count ?? 0), 1)
    : 1;

  const maxTrend = trendsData.length
    ? Math.max(...trendsData.map((t: any) => t.count ?? 0), 1)
    : 1;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics"
        description="Pilotez votre activité avec des données en temps réel"
        gradient
        actions={
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {PERIODS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setDays(p.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                    days === p.value
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                health.refetch();
                engagement.refetch();
                funnel.refetch();
                trends.refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        }
      />

      {loading ? (
        <Loader variant="spinner" size="lg" fullScreen />
      ) : (
        <>
          {/* Summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card, i) => (
              <StatsCard key={i} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion funnel */}
            <Card title="Entonnoir de conversion">
              {funnelStages.length === 0 ? (
                <EmptyState
                  icon={<Layers className="h-10 w-10 text-gray-300 dark:text-gray-600" />}
                  title="Pas encore de données"
                  description="L'entonnoir se remplira dès les premières visites de votre page publique."
                />
              ) : (
                <div className="space-y-4">
                  {funnelStages.map((stage: any, i: number) => {
                    const rate =
                      funnelRates[stage.name] ??
                      (totalVisitors > 0 ? (stage.count / totalVisitors) * 100 : 0);
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {stage.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {stage.count} · {Number(rate || 0).toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              i === funnelStages.length - 1
                                ? 'bg-emerald-500'
                                : 'bg-brand'
                            )}
                            style={{ width: `${Math.max((stage.count / maxStage) * 100, 2)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Search trends */}
            <Card title={`Tendances de recherche (${days}j)`}>
              {trendsData.length === 0 ? (
                <EmptyState
                  icon={<Search className="h-10 w-10 text-gray-300 dark:text-gray-600" />}
                  title="Aucune recherche"
                  description="Les termes recherchés par vos visiteurs apparaîtront ici."
                />
              ) : (
                <div className="space-y-4">
                  {trendsData.slice(0, 6).map((trend: any, i: number) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-2">
                          <Search className="w-3.5 h-3.5 text-gray-400" />
                          {trend.term}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">{trend.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full"
                          style={{ width: `${Math.max((trend.count / maxTrend) * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Retention cohorts */}
            <Card title="Rétention des clients" className="lg:col-span-1">
              {cohortsData.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-10 w-10 text-gray-300 dark:text-gray-600" />}
                  title="Pas encore de cohortes"
                  description="La rétention se calcule après plusieurs cycles d'achat."
                />
              ) : (
                <div className="space-y-3">
                  {cohortsData.slice(0, 8).map((c: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0"
                    >
                      <span className="text-gray-600 dark:text-gray-300">
                        {new Date(c.cohort).toLocaleDateString('fr-FR', {
                          month: 'short',
                          year: '2-digit',
                        })}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {c.retentionRate ?? 0}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recommendations */}
            <Card title="Produits recommandés" className="lg:col-span-2">
              {recommendationsData.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600" />}
                  title="Aucune recommandation"
                  description="Les recommandations produit s'affinent avec le comportement de vos clients."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendationsData.map((rec: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-5 h-5 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {rec.name ?? rec.productName ?? 'Produit'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {rec.reason ?? `Score de pertinence ${rec.score ?? '—'}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
