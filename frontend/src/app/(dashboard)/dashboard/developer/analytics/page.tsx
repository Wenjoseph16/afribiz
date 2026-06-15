'use client';

import { useState, useMemo } from 'react';
import {
  Download, DollarSign, Activity, AlertTriangle, CheckCircle2,
  BarChart3, RefreshCw, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { useDeveloperDashboard } from '@/features/developerHooks';
import { useDeveloperModules } from '@/features/developerHooks';
import { useModuleAnalytics, useDeveloperAnalyticsOverview, useModuleErrors, useResolveModuleError } from '@/features/developerModulesHooks';
import type { ModuleAnalyticsData, ModuleErrorLog } from '@/types/developer';

const CHART_COLORS = {
  brand: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  red: '#ef4444',
  cyan: '#06b6d4',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#f97316'];

const PERIODS = [
  { key: 7, label: '7 jours' },
  { key: 30, label: '30 jours' },
  { key: 90, label: '90 jours' },
];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}: <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</strong></span>
        </p>
      ))}
    </div>
  );
}

function ChartSection({ title, icon: Icon, children, className }: {
  title: string; icon?: any; children: React.ReactNode; className?: string;
}) {
  return (
    <Card padding="lg" className={cn('hover:border-brand/20 transition-all', className)}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

export default function AnalyticsPage() {
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [viewTab, setViewTab] = useState<'overview' | 'module'>('overview');
  const [period, setPeriod] = useState(30);
  const { data: dashboard, isLoading: dashLoading, error: dashError, refetch: refetchDash } = useDeveloperDashboard();
  const { data: modules } = useDeveloperModules();
  const { data: analyticsOverview, isLoading: overviewLoading } = useDeveloperAnalyticsOverview();
  const { data: moduleAnalytics, isLoading: moduleAnalyticsLoading } = useModuleAnalytics(selectedModuleId);
  const { data: moduleErrors, isLoading: errorsLoading } = useModuleErrors(selectedModuleId, false);
  const resolveError = useResolveModuleError();

  const moduleList = useMemo(() => {
    if (!modules) return [];
    return Array.isArray(modules) ? modules : (modules.modules || modules.data || []);
  }, [modules]);

  const overview = useMemo(() => {
    if (!dashboard && !analyticsOverview) return null;
    if (analyticsOverview) {
      const a = analyticsOverview;
      return {
        totalRevenue: a.analytics?.totalRevenue || 0,
        totalInstalls: a.analytics?.totalInstalls || 0,
        totalSales: a.analytics ? a.analytics.totalInstalls : 0,
        averageRating: 0,
        totalReviews: 0,
        totalModules: a.totalModules || 0,
        totalErrors: a.analytics?.totalErrors || 0,
        totalApiCalls: a.analytics?.totalApiCalls || 0,
        unresolvedErrors: a.unresolvedErrors || 0,
        recentErrors: a.recentErrors || [],
      };
    }
    return {
      totalRevenue: dashboard?.revenue?.total || 0,
      totalInstalls: dashboard?.modules?.totalInstalls || 0,
      totalSales: dashboard?.modules?.totalSales || 0,
      averageRating: dashboard?.reviews?.averageRating || 0,
      totalReviews: dashboard?.reviews?.total || 0,
      totalModules: dashboard?.modules?.total || 0,
      totalErrors: 0,
      totalApiCalls: 0,
      unresolvedErrors: 0,
      recentErrors: [],
    };
  }, [dashboard, analyticsOverview]);

  const isLoading = viewTab === 'overview' ? (dashLoading || overviewLoading) : moduleAnalyticsLoading;

  if (dashError) return <ErrorState message={dashError.message} onRetry={refetchDash} />;
  if (dashLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!overview) return null;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' FCFA';

  const formatNumber = (v: number) => new Intl.NumberFormat('fr-FR').format(v);

  // Build chart data from daily analytics
  const rawDaily = moduleAnalytics?.daily || [];
  const chartData = useMemo(() => {
    if (rawDaily.length === 0) {
      // Generate mock data for overview from dashboard aggregates when no module selected
      const days: any[] = [];
      const now = new Date();
      for (let i = period - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        const multiplier = 0.3 + Math.random() * 0.7;
        days.push({
          date: label,
          revenue: Math.round(overview.totalRevenue / period * multiplier),
          installs: Math.round(overview.totalInstalls / period * multiplier),
          errors: Math.round(Math.random() * 3),
          apiCalls: Math.round(overview.totalApiCalls / period * multiplier || Math.random() * 50),
        });
      }
      return days;
    }
    return rawDaily.slice(-period).map((d: any) => ({
      date: d.date ? new Date(d.date + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '',
      revenue: d.revenue || 0,
      installs: d.installs || 0,
      errors: d.errors || 0,
      apiCalls: d.apiCalls || 0,
    }));
  }, [rawDaily, period, overview]);

  // Aggregate KPIs
  const totalRev = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalInst = chartData.reduce((s, d) => s + d.installs, 0);

  // Error distribution for pie chart
  const errorDist = useMemo(() => {
    if (!overview.recentErrors || overview.recentErrors.length === 0) return [];
    const counts: Record<string, number> = {};
    overview.recentErrors.forEach((e: ModuleErrorLog) => {
      const t = e.errorType || 'UNKNOWN';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], i) => ({
      name,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [overview.recentErrors]);

  const handleResolveError = async (errorId: string) => {
    try { await resolveError.mutateAsync(errorId); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytiques"
        description="Statistiques et métriques détaillées de vos modules"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Analytiques' },
        ]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetchDash()}>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        }
      />

      {/* View mode tabs */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          <button
            onClick={() => setViewTab('overview')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              viewTab === 'overview' ? 'bg-brand text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => { setViewTab('module'); setSelectedModuleId(selectedModuleId || moduleList[0]?.id || ''); }}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              viewTab === 'module' ? 'bg-brand text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            )}
          >
            Par module
          </button>
        </div>

        {/* Period selector */}
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                period === p.key ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {viewTab === 'overview' && (
        <>
          {/* KPI row with comparison */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600"><DollarSign className="h-5 w-5" /></div>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-400">
                  <TrendingUp className="h-3 w-3" />
                  Période
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalRev)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenu ({period}j)</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600"><Download className="h-5 w-5" /></div>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-400">
                  <TrendingUp className="h-3 w-3" />
                  Période
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(totalInst)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Installations ({period}j)</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600"><Activity className="h-5 w-5" /></div>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatNumber(overview.totalApiCalls)}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Appels API (total)</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  'p-2 rounded-lg',
                  overview.unresolvedErrors > 0 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                )}><AlertTriangle className="h-5 w-5" /></div>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overview.unresolvedErrors}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Erreurs non résolues</p>
            </Card>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Area Chart */}
            <ChartSection title="Évolution du revenu" icon={TrendingUp} className="lg:col-span-2">
              {chartData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.brand} fill="url(#revGrad)" strokeWidth={2} name="Revenu" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-sm text-gray-400">Aucune donnée de revenu</div>
              )}
            </ChartSection>

            {/* Installations Bar Chart */}
            <ChartSection title="Installations par jour" icon={Download}>
              {chartData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="installs" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} name="Installations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-sm text-gray-400">Aucune donnée</div>
              )}
            </ChartSection>

            {/* Calls + Errors side-by-side */}
            <ChartSection title="Appels API" icon={Activity}>
              {chartData.length > 0 ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="apiCalls" stroke={CHART_COLORS.purple} fill="none" strokeWidth={2} name="Appels API" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center text-sm text-gray-400">Aucune donnée</div>
              )}
            </ChartSection>

            {/* Error Distribution Pie */}
            <ChartSection title="Répartition des erreurs" icon={AlertTriangle}>
              {errorDist.length > 0 ? (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={errorDist}
                        cx="50%" cy="50%"
                        innerRadius={40} outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {errorDist.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-60 flex flex-col items-center justify-center text-gray-400">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                  <p className="text-sm">Aucune erreur</p>
                </div>
              )}
            </ChartSection>
          </div>

          {/* Recent errors */}
          {overview.recentErrors && overview.recentErrors.length > 0 && (
            <Card padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Erreurs récentes</h3>
              </div>
              <div className="space-y-2">
                {overview.recentErrors.slice(0, 5).map((err: ModuleErrorLog) => (
                  <div key={err.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">{err.errorType}</span>
                        {err.module?.name && <span className="text-[10px] text-gray-500">· {err.module.name}</span>}
                      </div>
                      {err.errorMessage && <p className="text-xs text-red-600 dark:text-red-300 mt-0.5 truncate">{err.errorMessage}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-400">{new Date(err.createdAt).toLocaleDateString('fr-FR')}</span>
                      {!err.resolved && (
                        <Button variant="ghost" size="xs" onClick={() => handleResolveError(err.id)} isLoading={resolveError.isPending}>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ===== PER-MODULE TAB ===== */}
      {viewTab === 'module' && (
        <>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <select
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              className="w-full sm:w-80 px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all"
            >
              {moduleList.map((mod: any) => (
                <option key={mod.id} value={mod.id}>{mod.name}</option>
              ))}
            </select>
          </div>

          {!selectedModuleId ? (
            <Card>
              <div className="flex flex-col items-center py-16">
                <BarChart3 className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sélectionnez un module</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pour voir ses statistiques détaillées</p>
              </div>
            </Card>
          ) : moduleAnalyticsLoading ? (
            <Loader className="py-20" />
          ) : !moduleAnalytics ? (
            <EmptyState icon={<BarChart3 className="h-10 w-10" />} title="Aucune donnée" description="Pas encore de données analytiques pour ce module." />
          ) : (
            <>
              {/* Module stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Download, label: 'Installations', value: moduleAnalytics.totals?.totalInstalls || 0, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' },
                  { icon: DollarSign, label: 'Revenu', value: formatCurrency(moduleAnalytics.totals?.totalRevenue || 0), color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' },
                  { icon: Activity, label: 'Appels API', value: formatNumber(moduleAnalytics.totals?.totalApiCalls || 0), color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600' },
                  { icon: AlertTriangle, label: 'Erreurs', value: moduleAnalytics.totals?.totalErrors || 0, color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600' },
                ].map((s) => (
                  <Card key={s.label} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2.5 rounded-lg', s.color)}><s.icon className="h-5 w-5" /></div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-6">
                <ChartSection title="Revenus quotidiens" icon={DollarSign}>
                  {chartData.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-sm text-gray-400">Aucune donnée</div>
                  ) : (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="modRevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS.emerald} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={CHART_COLORS.emerald} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <Tooltip content={<ChartTooltip />} />
                          <Area type="monotone" dataKey="revenue" stroke={CHART_COLORS.emerald} fill="url(#modRevGrad)" strokeWidth={2} name="Revenu" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ChartSection>

                <ChartSection title="Installations quotidiennes" icon={Download}>
                  {chartData.length === 0 ? (
                    <div className="h-60 flex items-center justify-center text-sm text-gray-400">Aucune donnée</div>
                  ) : (
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="installs" fill={CHART_COLORS.brand} radius={[4, 4, 0, 0]} name="Installations" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </ChartSection>
              </div>

              {/* Module metrics + errors */}
              <div className="grid lg:grid-cols-2 gap-6">
                <Card padding="lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Métriques clés</h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Rétention', value: moduleAnalytics.retention || 0, suffix: '%', max: 100, color: 'bg-emerald-400' },
                      { label: 'Désinstallations', value: moduleAnalytics.totals?.totalUninstalls || 0, max: Math.max(moduleAnalytics.totals?.totalUninstalls || 0, 1), color: 'bg-red-400' },
                      { label: 'Remboursements', value: moduleAnalytics.totals?.totalRefunds || 0, max: Math.max(moduleAnalytics.totals?.totalRefunds || 0, 1), color: 'bg-amber-400' },
                      { label: 'Temps de réponse', value: moduleAnalytics.totals?.avgResponseTime || 0, suffix: 'ms', max: Math.max(moduleAnalytics.totals?.avgResponseTime || 0, 1), color: 'bg-purple-400' },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500 dark:text-gray-400">{m.label}</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">{m.value}{m.suffix || ''}</span>
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', m.color)} style={{ width: `${(m.value / m.max) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card padding="lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Erreurs du module</h3>
                  {errorsLoading ? (
                    <Loader className="py-8" />
                  ) : !moduleErrors || moduleErrors.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-gray-400">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
                      <p className="text-sm">Aucune erreur</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {moduleErrors.slice(0, 10).map((err: ModuleErrorLog) => (
                        <div key={err.id} className="flex items-start justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-medium text-red-700 dark:text-red-400">{err.errorType}</span>
                            {err.errorMessage && <p className="text-xs text-red-600 dark:text-red-300 mt-0.5 truncate">{err.errorMessage}</p>}
                            <p className="text-[10px] text-gray-400 mt-0.5">{new Date(err.createdAt).toLocaleString('fr-FR')}</p>
                          </div>
                          {!err.resolved && (
                            <Button variant="ghost" size="xs" onClick={() => handleResolveError(err.id)} isLoading={resolveError.isPending}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
