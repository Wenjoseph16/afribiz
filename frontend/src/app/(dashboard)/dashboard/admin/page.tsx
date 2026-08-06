'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Building2,
  Briefcase,
  Code2,
  Package,
  ShoppingBag,
  Server,
  ShoppingCart,
  Wallet,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Newspaper,
  BarChart3,
  Scale,
  Headphones,
  Megaphone,
  Activity,
  ArrowLeft,
  BellRing,
  CheckCircle2,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';

function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      try {
        const res = await apiClient.adminGetDashboardStats();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement stats dashboard admin:', error);
        return {
          totalUsers: 0,
          totalClients: 0,
          totalBusiness: 0,
          totalDevelopers: 0,
          modules: 0,
          products: 0,
          services: 0,
          orders: 0,
          totalTransactions: 0,
          escrow: 0,
          platformRevenue: 0,
          adRevenue: 0,
          marketplaceRevenue: 0,
          dataHubRevenue: 0,
          openDisputes: 0,
          supportTickets: 0,
          activeAds: 0,
          growthRate: 0,
          dailyGrowth: 0,
          monthlyGrowth: 0,
          yearlyGrowth: 0,
        };
      }
    },
    refetchInterval: 30000,
    retry: false,
  });
}

function fmt(value: any): string {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return num.toLocaleString('fr-FR');
}

const sectionStyle = (accent: string) => ({
  borderTop: `3px solid ${accent}`,
});

function useAdminAlertQueue() {
  return useQuery({
    queryKey: ['admin', 'alerts'],
    queryFn: async () => {
      try {
        const res = await apiClient.adminGetAlertQueue();
        return res.data.data;
      } catch (error) {
        console.warn('Erreur chargement file d\'alertes:', error);
        return { alerts: [], total: 0, urgent: 0, generatedAt: new Date().toISOString() };
      }
    },
    // Rafraîchi en temps réel par SocketProvider (événement admin:event → invalidation globale)
    refetchInterval: 30000,
    retry: false,
  });
}

const severityStyles = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return {
        badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        dot: 'bg-red-500',
        pulse: 'animate-pulse',
        border: 'border-red-200 dark:border-red-800 hover:border-red-400 dark:hover:border-red-600',
      };
    case 'HIGH':
      return {
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        dot: 'bg-amber-500',
        pulse: '',
        border: 'border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600',
      };
    case 'MEDIUM':
      return {
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        dot: 'bg-blue-500',
        pulse: '',
        border: 'border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600',
      };
    default:
      return {
        badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
        dot: 'bg-gray-400',
        pulse: '',
        border: 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500',
      };
  }
};

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading, error, refetch } = useAdminDashboardStats();
  const { data: alertQueue, isLoading: alertsLoading } = useAdminAlertQueue();
  const alerts = alertQueue?.alerts ?? [];

  const isAdmin = user?.roles?.includes('ADMIN');

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Accès réservé</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Vous devez être administrateur pour accéder à cette page.
          </p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour au tableau de bord
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Administration AfriBiz
        </h1>
        <Loader className="py-16" size="xl" label="Chargement des statistiques..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Administration AfriBiz
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Centre de contrôle de la plateforme
        </p>
      </div>

      {/* Section 0 - File d'alertes (temps réel) */}
      <div style={sectionStyle('#ef4444')}>
        <div className="flex items-center justify-between gap-3 mb-4 pt-4">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">File d'alertes</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Temps réel
            </span>
          </div>
          {alertQueue?.urgent > 0 && (
            <span className="text-xs font-semibold text-red-600 dark:text-red-400 shrink-0">
              {alertQueue.urgent} prioritaire{alertQueue.urgent > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {alertsLoading ? (
          <Loader size="sm" label="Chargement des alertes..." className="py-8" />
        ) : alerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/30 px-4 py-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Aucune alerte en attente. La plateforme fonctionne normalement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {alerts.map((a: any) => {
              const s = severityStyles(a.severity);
              return (
                <Link key={a.key} href={a.link} className="group">
                  <div
                    className={`flex items-start justify-between gap-3 rounded-xl border bg-white dark:bg-gray-800/60 p-4 transition-all group-hover:shadow-md ${s.border}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                        {a.label}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Cliquez pour traiter
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold ${s.badge} ${s.pulse}`}
                      >
                        {a.count}
                      </span>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 1 - Plateforme */}
      <div style={sectionStyle('#f97316')}>
        <div className="flex items-center gap-2 mb-4 pt-4">
          <Building2 className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Plateforme</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Users className="h-5 w-5" />}
            iconColor="text-orange-600"
            iconBg="bg-orange-50 dark:bg-orange-900/30"
            label="Total utilisateurs"
            value={fmt(stats?.totalUsers)}
          />
          <StatsCard
            icon={<Briefcase className="h-5 w-5" />}
            iconColor="text-orange-600"
            iconBg="bg-orange-50 dark:bg-orange-900/30"
            label="Total clients"
            value={fmt(stats?.totalClients)}
          />
          <StatsCard
            icon={<Building2 className="h-5 w-5" />}
            iconColor="text-orange-600"
            iconBg="bg-orange-50 dark:bg-orange-900/30"
            label="Total business"
            value={fmt(stats?.totalBusiness)}
          />
          <StatsCard
            icon={<Code2 className="h-5 w-5" />}
            iconColor="text-orange-600"
            iconBg="bg-orange-50 dark:bg-orange-900/30"
            label="Total développeurs"
            value={fmt(stats?.totalDevelopers)}
          />
        </div>
      </div>

      {/* Section 2 - Contenu */}
      <div style={sectionStyle('#3b82f6')}>
        <div className="flex items-center gap-2 mb-4 pt-4">
          <Package className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contenu</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Package className="h-5 w-5" />}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            label="Modules"
            value={fmt(stats?.modules)}
          />
          <StatsCard
            icon={<ShoppingBag className="h-5 w-5" />}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            label="Produits"
            value={fmt(stats?.products)}
          />
          <StatsCard
            icon={<Server className="h-5 w-5" />}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            label="Services"
            value={fmt(stats?.services)}
          />
          <StatsCard
            icon={<ShoppingCart className="h-5 w-5" />}
            iconColor="text-blue-600"
            iconBg="bg-blue-50 dark:bg-blue-900/30"
            label="Commandes"
            value={fmt(stats?.orders)}
          />
        </div>
      </div>

      {/* Section 3 - Finances */}
      <div style={sectionStyle('#22c55e')}>
        <div className="flex items-center gap-2 mb-4 pt-4">
          <Wallet className="h-5 w-5 text-emerald-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Finances</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatsCard
            icon={<DollarSign className="h-5 w-5" />}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            label="Transactions (montant total)"
            value={fmt(stats?.totalTransactions)}
          />
          <StatsCard
            icon={<ShieldCheck className="h-5 w-5" />}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            label="Escrow"
            value={fmt(stats?.escrow)}
          />
          <StatsCard
            icon={<TrendingUp className="h-5 w-5" />}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            label="Revenus plateforme"
            value={fmt(stats?.platformRevenue)}
          />
          <StatsCard
            icon={<Newspaper className="h-5 w-5" />}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            label="Revenus publicitaires"
            value={fmt(stats?.adRevenue)}
          />
          <StatsCard
            icon={<ShoppingCart className="h-5 w-5" />}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            label="Revenus marketplace"
            value={fmt(stats?.marketplaceRevenue)}
          />
          <StatsCard
            icon={<BarChart3 className="h-5 w-5" />}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50 dark:bg-emerald-900/30"
            label="Revenus Data Hub"
            value={fmt(stats?.dataHubRevenue)}
          />
        </div>
      </div>

      {/* Section 4 - Activité */}
      <div style={sectionStyle('#a855f7')}>
        <div className="flex items-center gap-2 mb-4 pt-4">
          <Activity className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activité</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<Scale className="h-5 w-5" />}
            iconColor="text-purple-600"
            iconBg="bg-purple-50 dark:bg-purple-900/30"
            label="Litiges ouverts"
            value={fmt(stats?.openDisputes)}
          />
          <StatsCard
            icon={<Headphones className="h-5 w-5" />}
            iconColor="text-purple-600"
            iconBg="bg-purple-50 dark:bg-purple-900/30"
            label="Tickets support"
            value={fmt(stats?.supportTickets)}
          />
          <StatsCard
            icon={<Megaphone className="h-5 w-5" />}
            iconColor="text-purple-600"
            iconBg="bg-purple-50 dark:bg-purple-900/30"
            label="Publicités actives"
            value={fmt(stats?.activeAds)}
          />
          <StatsCard
            icon={<Activity className="h-5 w-5" />}
            iconColor="text-purple-600"
            iconBg="bg-purple-50 dark:bg-purple-900/30"
            label="Taux de croissance"
            value={fmt(stats?.growthRate)}
            trend={{
              value: `Q: ${fmt(stats?.dailyGrowth)} / M: ${fmt(stats?.monthlyGrowth)} / A: ${fmt(stats?.yearlyGrowth)}`,
              positive: (stats?.yearlyGrowth ?? 0) >= 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
