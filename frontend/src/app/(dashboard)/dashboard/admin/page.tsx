'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Users, Building2, Briefcase, Code2, Package, ShoppingBag, Server, ShoppingCart,
  Wallet, ShieldCheck, TrendingUp, DollarSign, Newspaper, BarChart3,
  Scale, Headphones, Megaphone, Activity,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';

function useAdminDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard/stats');
      return res.data.data;
    },
    refetchInterval: 30000,
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

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading, error, refetch } = useAdminDashboardStats();

  const isAdmin = user?.roles?.includes('ADMIN');

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Administration AfriBiz
        </h1>
        <Card padding="lg">
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <ShieldCheck className="h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Accès réservé</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vous devez être administrateur pour accéder à cette page.
            </p>
          </div>
        </Card>
      </div>
    );
  }

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
