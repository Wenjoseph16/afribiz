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

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const { data: stats, isLoading, error, refetch } = useAdminDashboardStats();

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
