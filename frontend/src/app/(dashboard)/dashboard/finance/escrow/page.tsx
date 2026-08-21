'use client';

import { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Search,
  DollarSign,
  Loader,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import ModuleCharts from '@/components/dashboard/ModuleCharts';
import type { ModuleChartData } from '@/components/dashboard/ModuleCharts';
import { useEscrows } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; color: string }
> = {
  HELD: { label: 'Bloqué', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  RELEASED: { label: 'Libéré', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  REFUNDED: { label: 'Remboursé', variant: 'default', color: 'bg-purple-100 text-purple-700' },
  DISPUTED: { label: 'Litige', variant: 'danger', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Annulé', variant: 'default', color: 'bg-gray-100 text-gray-600' },
};

export default function BusinessEscrowPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: escrowsData, isLoading, refetch } = useEscrows({ limit: 100 });
  const allEscrows = Array.isArray(escrowsData)
    ? escrowsData
    : escrowsData?.escrows || escrowsData?.data || [];

  const stats = {
    total: allEscrows.length,
    held: allEscrows.filter((e: any) => e.status === 'HELD').length,
    released: allEscrows.filter((e: any) => e.status === 'RELEASED').length,
    disputed: allEscrows.filter((e: any) => e.status === 'DISPUTED').length,
    totalHeld: allEscrows
      .filter((e: any) => e.status === 'HELD')
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0),
    totalReleased: allEscrows
      .filter((e: any) => e.status === 'RELEASED')
      .reduce((s: number, e: any) => s + Number(e.amount || 0), 0),
  };

  const filtered = allEscrows.filter((e: any) => {
    if (filter !== 'all' && e.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (e.id || '').toLowerCase().includes(q) ||
        (e.reference || '').toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRelease = async (escrowId: string) => {
    setActionId(escrowId);
    try {
      await apiClient.releaseEscrow(escrowId);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const handleRefund = async (escrowId: string) => {
    setActionId(escrowId);
    try {
      await apiClient.refundEscrow(escrowId);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const handleDispute = async (escrowId: string) => {
    const reason = prompt('Motif du litige:');
    if (!reason) return;
    setActionId(escrowId);
    try {
      await apiClient.disputeEscrow(escrowId);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Escrow"
        description="Paiements sécurisés — fonds bloqués jusqu'à confirmation par les deux parties."
        breadcrumbs={[{ label: 'Finance', href: '/dashboard/finance' }, { label: 'Escrow' }]}
        gradient
      />

      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Paiement sécurisé</h2>
            <p className="text-emerald-100/80 text-sm mt-1">
              Gérez les transactions escrow : libérez les fonds, remboursez ou ouvrez un litige.
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      {stats.total > 0 &&
        (() => {
          const chartData: ModuleChartData = {
            distribution: [
              { name: 'Bloqués', value: stats.held, color: '#10b981' },
              { name: 'Libérés', value: stats.released, color: '#3b82f6' },
              { name: 'Litiges', value: stats.disputed, color: '#ef4444' },
            ].filter((d) => d.value > 0),
            daily: [
              { label: 'Total', value: stats.total },
              { label: 'Bloqué', value: Math.round(stats.totalHeld / 1000) },
              { label: 'Libéré', value: Math.round(stats.totalReleased / 1000) },
            ],
          };
          return (
            <ModuleCharts
              data={chartData}
              title="ANALYTICS ESCROW"
              distributionLabel="Statut"
              dailyLabel="Montants (x1000 FCFA)"
              variant="rooms"
            />
          );
        })()}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard
          icon={<Shield className="h-5 w-5" />}
          iconBg="bg-brand/10"
          iconColor="text-brand"
          label="Total"
          value={stats.total}
        />
        <StatsCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Bloqués"
          value={stats.held}
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Libérés"
          value={stats.released}
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg={stats.disputed > 0 ? 'bg-red-50' : 'bg-gray-50'}
          iconColor={stats.disputed > 0 ? 'text-red-600' : 'text-gray-400'}
          label="Litiges"
          value={stats.disputed}
        />
        <StatsCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Bloqué"
          value={formatPrice(stats.totalHeld)}
        />
        <StatsCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Libéré"
          value={formatPrice(stats.totalReleased)}
        />
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'HELD', label: 'Bloqués' },
            { key: 'RELEASED', label: 'Libérés' },
            { key: 'DISPUTED', label: 'Litiges' },
            { key: 'REFUNDED', label: 'Remboursés' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === t.key
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune transaction escrow</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((escrow: any) => {
            const s = STATUS_CONFIG[escrow.status] || STATUS_CONFIG.PENDING;
            return (
              <Card key={escrow.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn('p-2 rounded-xl shrink-0', s.color)}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-gray-500">
                          #{escrow.id?.slice(0, 8)}
                        </span>
                        <Badge variant={s.variant} size="xs">
                          {s.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {escrow.notes || 'Transaction sécurisée'}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Créé le {new Date(escrow.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(Number(escrow.amount || 0))}
                    </p>
                    {escrow.status === 'HELD' && (
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          onClick={() => handleRelease(escrow.id)}
                          disabled={actionId === escrow.id}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {actionId === escrow.id ? '...' : 'Libérer'}
                        </button>
                        <button
                          onClick={() => handleDispute(escrow.id)}
                          disabled={actionId === escrow.id}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          Litige
                        </button>
                        <button
                          onClick={() => handleRefund(escrow.id)}
                          disabled={actionId === escrow.id}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
                        >
                          Rembourser
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
