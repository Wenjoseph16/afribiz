'use client';

import { useMemo } from 'react';
import { useBusinessOrderStats } from '@/features/hooks';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  ACCEPTED: 'Acceptée',
  PREPARING: 'Préparation',
  READY: 'Prête',
  DELIVERING: 'Livraison',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUSED: 'Refusée',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-blue-500',
  ACCEPTED: 'bg-emerald-500',
  PREPARING: 'bg-purple-500',
  READY: 'bg-teal-500',
  DELIVERING: 'bg-indigo-500',
  DELIVERED: 'bg-emerald-500',
  COMPLETED: 'bg-gray-400',
  CANCELLED: 'bg-red-400',
  REFUSED: 'bg-red-400',
};

export default function BusinessOrderStatsPage() {
  const { data: statsData, isLoading } = useBusinessOrderStats();

  const stats = useMemo(() => {
    const raw = (statsData?.data || statsData) as any;
    if (!raw) return null;
    return {
      total: raw.total || 0,
      totalRevenue: raw.totalRevenue || raw.totalAmount || 0,
      averageValue: raw.averageValue || raw.avgValue || 0,
      pending: raw.pending || 0,
      completed: raw.completed || raw.delivered || 0,
      cancelled: raw.cancelled || 0,
      inProgress: raw.inProgress || raw.active || 0,
      statusDistribution: raw.statusDistribution || [],
      dailyStats: raw.dailyStats || [],
    };
  }, [statsData]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  if (!stats)
    return <div className="text-center py-12 text-gray-500">Aucune donnée disponible</div>;

  const maxDaily = Math.max(...stats.dailyStats.map((d: any) => d.count || d.amount || 0), 1);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Statistiques commandes"
        description="Analyse de vos commandes business"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Commandes', href: '/dashboard/business/orders' },
          { label: 'Statistiques' },
        ]}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10">
              <ShoppingBag className="w-4 h-4 text-brand" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">En cours</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Revenu</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Terminées</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                stats.averageValue > 5000 ? 'bg-emerald-100' : 'bg-amber-100'
              )}
            >
              <TrendingUp
                className={cn(
                  'w-4 h-4',
                  stats.averageValue > 5000 ? 'text-emerald-600' : 'text-amber-600'
                )}
              />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Moyen</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(Math.round(stats.averageValue))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Annulées</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.cancelled}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-brand" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
              Activité quotidienne
            </h3>
          </div>
          {stats.dailyStats.length > 0 ? (
            <div className="flex items-end gap-0.5 h-32 sm:h-40">
              {stats.dailyStats.map((day: any, i: number) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {day.count || day.amount}
                  </div>
                  <div
                    className="w-full rounded-t-sm transition-all duration-200 hover:opacity-80 cursor-pointer bg-brand"
                    style={{
                      height: `${Math.max(((day.count || day.amount || 0) / maxDaily) * 100, 2)}%`,
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée quotidienne</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-brand" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">Par statut</h3>
          </div>
          {stats.statusDistribution.length > 0 ? (
            <div className="space-y-3">
              {stats.statusDistribution
                .filter((s: any) => s.count > 0)
                .map((s: any, i: number) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">
                        {STATUS_LABELS[s.status || s.key] || s.status || s.key}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">{s.count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          STATUS_COLORS[s.status || s.key] || 'bg-gray-400'
                        )}
                        style={{ width: `${(s.count / stats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
          )}
        </Card>
      </div>
    </div>
  );
}
