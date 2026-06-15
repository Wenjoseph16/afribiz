'use client';

import { useMemo, useState } from 'react';
import { ShoppingBag, DollarSign, TrendingUp, Search, Filter, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useDeveloperOrders } from '@/features/developerHooks';

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
  COMPLETED: 'success',
  PENDING: 'warning',
  CANCELLED: 'danger',
  REFUNDED: 'danger',
  PROCESSING: 'info',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Complété',
  PENDING: 'En attente',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
  PROCESSING: 'En cours',
};

const FILTER_OPTIONS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Complétés', value: 'COMPLETED' },
  { label: 'En attente', value: 'PENDING' },
  { label: 'Remboursés', value: 'REFUNDED' },
];

export default function SalesPage() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: ordersData, isLoading, error, refetch } = useDeveloperOrders();

  const orders = useMemo(() => {
    if (!ordersData) return [];
    const d = (ordersData as any)?.data || ordersData;
    const list = Array.isArray(d) ? d : (d.orders || d.items || []);
    return list;
  }, [ordersData]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== 'ALL') {
      list = list.filter((o: any) => o.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o: any) =>
        (o.orderId || o.id || '').toLowerCase().includes(q) ||
        (o.module?.name || '').toLowerCase().includes(q) ||
        (o.client?.name || o.business?.name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const completed = orders.filter((o: any) => o.status === 'COMPLETED');
    return {
      total: orders.length,
      completed: completed.length,
      totalAmount: completed.reduce((s: number, o: any) => s + Number(o.amount || 0), 0),
      avgAmount: completed.length > 0
        ? Math.round(completed.reduce((s: number, o: any) => s + Number(o.amount || 0), 0) / completed.length)
        : 0,
    };
  }, [orders]);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des ventes..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Ventes"
        description="Historique des ventes de vos modules"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Revenus', href: '/dashboard/developer/revenues' },
          { label: 'Ventes' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" hoverable>
          <ShoppingBag className="h-5 w-5 text-brand mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total des ventes</p>
        </Card>
        <Card padding="md" hoverable>
          <DollarSign className="h-5 w-5 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalAmount.toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Revenu total</p>
        </Card>
        <Card padding="md" hoverable>
          <TrendingUp className="h-5 w-5 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avgAmount.toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Prix moyen</p>
        </Card>
        <Card padding="md" hoverable>
          <ShoppingBag className="h-5 w-5 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.completed}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ventes complétées</p>
        </Card>
      </div>

      <Card padding="lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Transactions</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                  statusFilter === f.value ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                )}
              >
                {f.label}
              </button>
            ))}
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="max-w-[180px]"
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-10 w-10" />}
            title="Aucune vente"
            description={searchQuery ? 'Aucun résultat pour votre recherche.' : 'Aucune vente pour le moment.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">ID Commande</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Module</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Client</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Montant</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-gray-500 dark:text-gray-400">
                      #{order.orderId || order.id?.slice(0, 8) || '—'}
                    </td>
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">
                      {order.module?.name || '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                      {order.client?.name || order.business?.name || order.clientName || '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-gray-900 dark:text-gray-100">
                      {order.amount ? `${Number(order.amount).toLocaleString()} FCFA` : '—'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={STATUS_VARIANTS[order.status] || 'default'} size="xs">
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
