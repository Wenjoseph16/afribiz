'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, Eye, ShoppingBag,
  Wallet, Users, Download, CalendarDays,
  Activity, Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '3 mois' },
  { value: '1y', label: '1 an' },
];

export default function StatisticsPage() {
  const [period, setPeriod] = useState('30d');

  const { data: statsData, isLoading, error, refetch } = useQuery({
    queryKey: ['businessStats', period],
    queryFn: () => apiClient.getBusinessStats(),
  });

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const stats = (statsData as any)?.data?.data;

  const periodLabels: Record<string, string> = {
    '7d': 'cette semaine',
    '30d': 'ce mois',
    '90d': 'ce trimestre',
    '1y': 'cette année',
  };

  const summaryCards = [
    { icon: <Eye className="h-5 w-5" />, iconBg: 'bg-blue-50 dark:bg-blue-900/30', iconColor: 'text-blue-600', label: 'Visites', value: stats?.visitors ?? 0, trend: { value: '+12%', positive: true } },
    { icon: <Users className="h-5 w-5" />, iconBg: 'bg-emerald-50 dark:bg-emerald-900/30', iconColor: 'text-emerald-600', label: 'Conversions', value: stats?.conversions ?? 0, trend: { value: `${stats?.conversionRate || 0}%`, positive: true } },
    { icon: <ShoppingBag className="h-5 w-5" />, iconBg: 'bg-purple-50 dark:bg-purple-900/30', iconColor: 'text-purple-600', label: 'Ventes', value: stats?.orders ?? 0, trend: { value: '+5%', positive: true } },
    { icon: <Wallet className="h-5 w-5" />, iconBg: 'bg-teal-50 dark:bg-teal-900/30', iconColor: 'text-teal-600', label: 'Revenu', value: stats?.revenue ? `${Number(stats.revenue).toLocaleString()} FCFA` : '0 FCFA', trend: { value: '+8%', positive: true } },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Statistiques"
        description={`Performance ${periodLabels[period] || ''}`}
        gradient
        actions={
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  period === p.value
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <Loader variant="spinner" size="lg" fullScreen />
      ) : (
        <>
          {/* Summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryCards.map((card, i) => (
              <StatsCard key={i} {...card} />
            ))}
          </div>

          {/* Charts area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Évolution du revenu">
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">Graphique d&apos;évolution du revenu</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Connectez un service d&apos;analytics pour voir vos données</p>
                </div>
              </div>
            </Card>

            <Card title="Visites vs Conversions">
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">Graphique des visites et conversions</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Les données apparaîtront après les premières visites</p>
                </div>
              </div>
            </Card>
          </div>

          {/* More stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Produits populaires" className="lg:col-span-1">
              <div className="text-center py-8">
                <ShoppingBag className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune donnée</p>
              </div>
            </Card>

            <Card title="Sources de trafic" className="lg:col-span-1">
              <div className="text-center py-8">
                <Globe className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune donnée</p>
              </div>
            </Card>

            <Card title="Performance mensuelle" className="lg:col-span-1">
              <div className="text-center py-8">
                <CalendarDays className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aucune donnée</p>
              </div>
            </Card>
          </div>

          {/* Export */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
              Exporter les données
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
