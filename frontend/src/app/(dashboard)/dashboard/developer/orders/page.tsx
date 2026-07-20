'use client';

import { useState } from 'react';
import {
  ShoppingBag,
  Wallet,
  TrendingUp,
  Percent,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperOrders } from '@/features/developerHooks';

const orderTypeFilters = [
  { label: 'Toutes', value: 'ALL' },
  { label: 'Ventes', value: 'SALE' },
  { label: 'Abonnements', value: 'SUBSCRIPTION' },
  { label: 'Commissions', value: 'COMMISSION' },
];

function typeBadgeClass(type: string) {
  switch (type) {
    case 'SALE':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'SUBSCRIPTION':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'COMMISSION':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function typeLabel(type: string) {
  switch (type) {
    case 'SALE':
      return 'Vente';
    case 'SUBSCRIPTION':
      return 'Abonnement';
    case 'COMMISSION':
      return 'Commission';
    default:
      return type;
  }
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'PENDING':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'REFUNDED':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'Complété';
    case 'PENDING':
      return 'En attente';
    case 'REFUNDED':
      return 'Remboursé';
    default:
      return status;
  }
}

export default function DeveloperOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 15;
  const { data: ordersData, isLoading, error, refetch } = useDeveloperOrders();

  const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders ?? []);
  const filtered = orders.filter((r: any) => activeFilter === 'ALL' || r.type === activeFilter);
  const paginatedOrders = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const summary = {
    totalRevenue: orders.reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
    netRevenue: orders.reduce((s: number, r: any) => s + Number(r.netAmount || 0), 0),
    totalCommission: orders.reduce((s: number, r: any) => s + Number(r.commissionAmount || 0), 0),
    totalSales: orders.filter((r: any) => r.type === 'SALE').length,
  };

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Commandes" description="Historique des ventes de vos modules" />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Commandes" description="Historique des ventes de vos modules" />
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Commandes" description="Historique des ventes de vos modules" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total des ventes',
            value: summary.totalSales,
            icon: ShoppingBag,
            format: 'number',
          },
          { label: 'Revenu total', value: summary.totalRevenue, icon: Wallet, format: 'currency' },
          { label: 'Revenu net', value: summary.netRevenue, icon: TrendingUp, format: 'currency' },
          {
            label: 'Commissions AfriBiz',
            value: summary.totalCommission,
            icon: Percent,
            format: 'currency',
          },
        ].map((card) => (
          <Card key={card.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {card.format === 'currency'
                    ? `${Number(card.value).toLocaleString('fr-FR')} FCFA`
                    : Number(card.value).toLocaleString('fr-FR')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20">
                <card.icon className="w-5 h-5 text-brand" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            {orderTypeFilters.map((f) => (
              <Button
                key={f.value}
                variant={activeFilter === f.value ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveFilter(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div>
            <div className="px-4 py-2 text-xs text-gray-400 border-b border-gray-200 dark:border-gray-700">
              {filtered.length} résultat{filtered.length > 1 ? 's' : ''} · Page {currentPage}/
              {totalPages}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Module
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Montant
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Commission
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Net
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedOrders.map((order: any) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        {order.module?.name || 'Module'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            typeBadgeClass(order.type)
                          )}
                        >
                          {typeLabel(order.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right whitespace-nowrap font-medium">
                        {Number(order.amount || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right whitespace-nowrap">
                        {Number(order.commissionAmount || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right whitespace-nowrap font-medium">
                        {Number(order.netAmount || 0).toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            statusBadgeClass(order.status)
                          )}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Précédent
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'px-3 py-1.5 text-sm rounded-lg transition-colors',
                      page === currentPage
                        ? 'bg-brand text-white'
                        : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-12">
            <EmptyState
              icon={<ShoppingBag className="h-12 w-12" />}
              title="Aucune commande"
              description="Vous n'avez pas encore reçu de commandes pour vos modules."
            />
          </div>
        )}
      </Card>
    </div>
  );
}
