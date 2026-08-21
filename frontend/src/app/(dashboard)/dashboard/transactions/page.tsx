'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Calendar,
  Home,
  Ticket,
  RefreshCw,
  GraduationCap,
  PiggyBank,
  Filter,
  LayoutGrid,
  List,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useTransactions } from '@/features/hooks/transactions';
import { TransactionCard } from '@/components/transactions';
import type { TransactionType, TransactionFilters } from '@/types/transactions';

const TYPE_TABS: { key: TransactionType | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'Toutes', icon: Filter },
  { key: 'ORDER', label: 'Commandes', icon: ShoppingBag },
  { key: 'BOOKING', label: 'Réservations', icon: Calendar },
  { key: 'RENTAL', label: 'Locations', icon: Home },
  { key: 'EVENT', label: 'Événements', icon: Ticket },
  { key: 'SUBSCRIPTION', label: 'Abonnements', icon: RefreshCw },
  { key: 'TRAINING', label: 'Formations', icon: GraduationCap },
  { key: 'LAYAWAY', label: 'Épargne', icon: PiggyBank },
];

const STATUS_TABS = [
  { key: 'all', label: 'Tous' },
  { key: 'active', label: 'En cours' },
  { key: 'completed', label: 'Terminés' },
  { key: 'pending', label: 'En attente' },
  { key: 'cancelled', label: 'Annulés' },
];

export default function TransactionsPage() {
  const [activeType, setActiveType] = useState<TransactionType | 'all'>('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const filters: TransactionFilters = useMemo(
    () => ({
      types: activeType === 'all' ? undefined : [activeType],
      search: search || undefined,
      limit: 50,
    }),
    [activeType, search]
  );

  const { data, isLoading, error, refetch } = useTransactions(filters);

  const transactions = useMemo(() => {
    if (!data?.transactions) return [];
    if (activeStatus === 'all') return data.transactions;
    return data.transactions.filter((t) => {
      const statuses: Record<string, string[]> = {
        active: [
          'PENDING',
          'CONFIRMED',
          'ACCEPTED',
          'PREPARING',
          'READY',
          'DELIVERING',
          'ACTIVE',
          'IN_PROGRESS',
          'REGISTERED',
          'NOT_STARTED',
        ],
        completed: ['DELIVERED', 'COMPLETED', 'RETURNED', 'ATTENDED', 'RENEWED'],
        pending: ['PENDING'],
        cancelled: ['CANCELLED', 'REFUSED', 'REFUNDED', 'EXPIRED', 'NO_SHOW'],
      };
      return statuses[activeStatus]?.includes(t.status);
    });
  }, [data, activeStatus]);

  const stats = useMemo(() => {
    if (!data?.stats) return { total: 0, active: 0, completed: 0, pending: 0, cancelled: 0 };
    return data.stats;
  }, [data]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mes transactions"
        description="Suivez toutes vos activités en un seul endroit"
        breadcrumbs={[{ label: 'Transactions' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-900 dark:text-gray-100' },
          { label: 'En cours', value: stats.active, color: 'text-blue-600 dark:text-blue-400' },
          {
            label: 'Terminés',
            value: stats.completed,
            color: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'En attente',
            value: stats.pending,
            color: 'text-amber-600 dark:text-amber-400',
          },
          { label: 'Annulés', value: stats.cancelled, color: 'text-red-600 dark:text-red-400' },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className={cn('text-xl font-bold mt-1', s.color)}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une transaction..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
            />
          </div>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Type tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {TYPE_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveType(tab.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  activeType === tab.key
                    ? 'bg-brand text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveStatus(tab.key)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                activeStatus === tab.key
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <EmptyState
          icon={<Filter className="h-12 w-12" />}
          title="Aucune transaction"
          description={
            search
              ? 'Essayez une autre recherche'
              : "Vous n'avez aucune transaction pour le moment."
          }
        />
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-3'
          )}
        >
          {transactions.map((tx) => (
            <TransactionCard
              key={`${tx.type}-${tx.id}`}
              transaction={tx}
              compact={viewMode === 'grid'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
