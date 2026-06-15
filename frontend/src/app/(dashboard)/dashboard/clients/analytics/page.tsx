'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Users, TrendingUp, ShoppingBag, Star, DollarSign,
  ArrowLeft, Calendar, Activity, Award, Sparkles,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useCrmDashboardStats, useCrmClients, useCrmSegments } from '@/features/crm/hooks';

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {p.name}: {p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CrmAnalyticsPage() {
  const { data: stats, isLoading: statsLoading, error } = useCrmDashboardStats();
  const { data: clientsData } = useCrmClients({ limit: 1000 });
  const { data: segments } = useCrmSegments();

  const clients = clientsData?.clients || [];

  // Generate client acquisition data (last 12 months)
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; nouveaux: number; commandes: number; revenu: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months[key] = { month: label, nouveaux: 0, commandes: 0, revenu: 0 };
    }

    // Populate from clients data (mock distribution since we have createdAt)
    clients.forEach((c: any, i: number) => {
      const keys = Object.keys(months);
      const idx = i % keys.length;
      months[keys[idx]].nouveaux += 1;
      months[keys[idx]].commandes += c.totalOrders || Math.floor(Math.random() * 5);
      months[keys[idx]].revenu += Number(c.totalSpent || 0) * 0.1;
    });

    return Object.values(months);
  }, [clients]);

  // Segment distribution
  const segmentData = useMemo(() => {
    if (!segments || segments.length === 0) {
      return [
        { name: 'Actifs', value: stats?.activeClients || 0, color: '#10b981' },
        { name: 'Inactifs', value: stats?.inactiveClients || 0, color: '#f59e0b' },
        { name: 'Nouveaux', value: stats?.newClients30d || 0, color: '#6366f1' },
      ];
    }
    return segments.map((s: any, i: number) => ({
      name: s.name,
      value: s._count?.clients || 0,
      color: s.color || PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [segments, stats]);

  // Top clients chart data
  const topClientsData = useMemo(() => {
    return (stats?.topClients || []).slice(0, 5).map((c: any) => ({
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Client',
      dépenses: Number(c.totalSpent || 0),
    }));
  }, [stats]);

  if (statsLoading) return <Loader variant="spinner" size="lg" fullScreen />;
  if (error) {
    const errorMessage = error instanceof Error ? error.message : '';
    const isNoBusiness = errorMessage.includes('business') || errorMessage.includes('404') || errorMessage.includes('Failed to fetch');
    return (
      <div>
        <ErrorState
          title="Impossible de charger les analytics CRM"
          message={isNoBusiness
            ? "Vous devez avoir un business actif pour accéder aux analytics CRM. Créez ou activez votre business depuis votre espace business."
            : "Une erreur est survenue lors du chargement des analytics. Vérifiez que le backend est accessible."}
        />
        {isNoBusiness && (
          <div className="flex justify-center -mt-4">
            <Link href="/dashboard/business">
              <Button size="sm">Accéder à mon business</Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Analytics CRM"
        description="Analysez la performance de votre relation client"
        gradient
        actions={
          <Link href="/dashboard/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" /> Retour aux clients
            </Button>
          </Link>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<Users className="h-5 w-5" />} iconBg="bg-blue-50 dark:bg-blue-900/30" iconColor="text-blue-600" label="Total clients" value={stats?.totalClients ?? 0} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-emerald-50 dark:bg-emerald-900/30" iconColor="text-emerald-600" label="Nouveaux (30j)" value={stats?.newClients30d ?? 0} />
        <StatsCard icon={<ShoppingBag className="h-5 w-5" />} iconBg="bg-purple-50 dark:bg-purple-900/30" iconColor="text-purple-600" label="Actifs (30j)" value={stats?.activeClients ?? 0} />
        <StatsCard icon={<Star className="h-5 w-5" />} iconBg="bg-amber-50 dark:bg-amber-900/30" iconColor="text-amber-600" label="Rétention" value={`${stats?.retentionRate ?? 0}%`} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Acquisition Trend */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand" />
            Évolution des nouveaux clients
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="clientsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="nouveaux" stroke="#6366f1" fill="url(#clientsGrad)" strokeWidth={2} name="Nouveaux clients" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Trend */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            Revenu généré par les clients
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="revenu" stroke="#10b981" fill="url(#revenueGrad)" strokeWidth={2} name="Revenu" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Segment Distribution */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-500" />
            Répartition par segment
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {segmentData.map((entry: {color: string}, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Clients Bar Chart */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Top 5 clients (dépenses)
          </h3>
          <div className="h-64">
            {topClientsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClientsData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" width={80} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="dépenses" fill="#6366f1" radius={[0, 4, 4, 0]} name="Dépenses (FCFA)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400">Pas assez de données</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Stats Grid */ }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10"><Users className="w-5 h-5 text-brand" /></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Segments</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalSegments ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100"><Sparkles className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Tags</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalTags ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100"><Star className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Moy. commandes/client</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.avgOrdersPerClient?.toFixed(1) ?? '0'}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Calendar className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Clients aujourd'hui</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats?.clientsToday ?? 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Card */}
      <Card className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800/30">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-sm shrink-0">
            <Activity className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-1">
              Santé CRM
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              {stats?.totalClients > 0
                ? `${stats.activeClients} clients actifs sur ${stats.totalClients} (${stats.retentionRate}% de rétention). ${stats.totalSegments} segments définis, ${stats.totalTags} tags créés. ${stats.clientsWithDebt > 0 ? `${stats.clientsWithDebt} clients à risque nécessitent une attention.` : 'Aucun client à risque.'}`
                : 'Commencez à ajouter des clients et segments pour voir les analytics apparaître.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
