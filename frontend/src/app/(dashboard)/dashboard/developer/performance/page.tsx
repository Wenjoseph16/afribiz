'use client';

import { useMemo } from 'react';
import { Star, Download, DollarSign, MessageCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperDashboard } from '@/features/developerHooks';

export default function PerformancePage() {
  const { data: dashboard, isLoading, error, refetch } = useDeveloperDashboard();

  const metrics = useMemo(() => {
    if (!dashboard) return null;
    const rev = dashboard.revenue || {};
    const mod = dashboard.modules || {};
    const revs = dashboard.reviews || {};
    return {
      averageRating: revs.averageRating || 0,
      totalInstalls: mod.totalInstalls || 0,
      totalRevenue: rev.total || 0,
      totalReviews: revs.total || 0,
      totalModules: mod.total || 0,
      publishedModules: mod.published || 0,
      thisMonthRevenue: rev.thisMonth || 0,
    };
  }, [dashboard]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!metrics) return null;

  const avgPerModule = metrics.totalModules > 0 ? metrics.totalRevenue / metrics.totalModules : 0;
  const formatCFA = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' FCFA';

  const cards = [
    {
      icon: Star,
      label: 'Note moyenne',
      value: `${metrics.averageRating.toFixed(1)} / 5`,
      trend: { value: '+0.2', positive: true },
      color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600',
    },
    {
      icon: Download,
      label: "Taux d'installation",
      value: metrics.totalInstalls.toString(),
      trend: { value: '+12%', positive: true },
      color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
    },
    {
      icon: DollarSign,
      label: 'Revenu moyen par module',
      value: formatCFA(Math.round(avgPerModule)),
      trend: { value: '+8%', positive: true },
      color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
    },
    {
      icon: MessageCircle,
      label: 'Avis reçus',
      value: metrics.totalReviews.toString(),
      trend: { value: '+3', positive: true },
      color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Performance"
        description="Indicateurs clés de performance de vos modules"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Performance' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('p-2.5 rounded-lg', c.color)}><c.icon className="h-5 w-5" /></div>
              {c.trend && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold',
                  c.trend.positive ? 'text-emerald-600' : 'text-red-600',
                )}>
                  {c.trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {c.trend.value}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{c.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{c.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Vue d&apos;ensemble</h3>
          <div className="space-y-4">
            {[
              { label: 'Modules publiés', value: metrics.publishedModules, max: Math.max(metrics.totalModules, 1), color: 'bg-brand' },
              { label: 'Modules total', value: metrics.totalModules, max: Math.max(metrics.totalModules, 1), color: 'bg-gray-400' },
              { label: 'Revenu du mois', value: metrics.thisMonthRevenue, max: Math.max(metrics.totalRevenue, 1), color: 'bg-emerald-400' },
              { label: 'Note moyenne', value: metrics.averageRating, max: 5, color: 'bg-amber-400' },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{m.label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {typeof m.value === 'number' && m.label === 'Revenu du mois' ? formatCFA(m.value) : m.value}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', m.color)} style={{ width: `${(Number(m.value) / m.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Répartition des revenus</h3>
          <div className="space-y-4">
            {[
              { label: 'Ventes uniques', value: 60, color: 'bg-brand' },
              { label: 'Abonnements', value: 25, color: 'bg-emerald-400' },
              { label: 'Commissions', value: 10, color: 'bg-blue-400' },
              { label: 'Upgrades', value: 5, color: 'bg-purple-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{item.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', item.color)} style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Note par étoiles</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const pct = star === 5 ? 55 : star === 4 ? 25 : star === 3 ? 12 : star === 2 ? 5 : 3;
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-12">{star} étoile{star > 1 ? 's' : ''}</span>
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Objectifs</h3>
          <div className="space-y-4">
            {[
              { label: 'Atteindre 100 installations', current: metrics.totalInstalls, target: 100 },
              { label: 'Note moyenne ≥ 4.5', current: Math.round(metrics.averageRating * 10), target: 45 },
              { label: 'Générer 1 000 000 FCFA', current: metrics.totalRevenue, target: 1000000 },
            ].map((o) => {
              const pct = Math.min(100, Math.round((o.current / o.target) * 100));
              return (
                <div key={o.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500 dark:text-gray-400">{o.label}</span>
                    <span className={cn('font-semibold', pct >= 100 ? 'text-emerald-600' : 'text-gray-700 dark:text-gray-300')}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', pct >= 100 ? 'bg-emerald-400' : 'bg-brand')} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
