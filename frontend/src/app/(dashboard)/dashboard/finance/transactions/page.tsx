'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useQuery } from '@tanstack/react-query';

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'incoming', label: 'Entrantes' },
  { key: 'outgoing', label: 'Sortantes' },
  { key: 'pending', label: 'En attente' },
];

export default function FinanceTransactionsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: async () => {
      const res = await apiClient.get('/business/finance/transactions');
      return res.data.data;
    },
  });

  const transactions = useMemo(() => {
    const d = Array.isArray(data)
      ? data
      : ((data as any)?.transactions ?? (data as any)?.items ?? []);
    return Array.isArray(d) ? d : [];
  }, [data]);

  const filtered = useMemo(() => {
    let f = [...transactions];
    switch (activeTab) {
      case 'incoming':
        f = f.filter((t: any) => t.type === 'INCOMING' || t.amount > 0);
        break;
      case 'outgoing':
        f = f.filter((t: any) => t.type === 'OUTGOING' || t.amount < 0);
        break;
      case 'pending':
        f = f.filter((t: any) => t.status === 'PENDING');
        break;
    }
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(
        (t: any) =>
          (t.reference || t.id || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
      );
    }
    return f;
  }, [transactions, activeTab, search]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Transactions"
        description="Historique de toutes vos transactions financières"
        breadcrumbs={[{ label: 'Finance' }, { label: 'Transactions' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {transactions.length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenus</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {transactions
                  .filter((t: any) => t.amount > 0)
                  .reduce((s: number, t: any) => s + Number(t.amount || 0), 0)
                  .toLocaleString()}{' '}
                FCFA
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dépenses</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {Math.abs(
                  transactions
                    .filter((t: any) => t.amount < 0)
                    .reduce((s: number, t: any) => s + Number(t.amount || 0), 0)
                ).toLocaleString()}{' '}
                FCFA
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {transactions.filter((t: any) => t.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab.key
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une transaction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-12 w-12" />}
          title="Aucune transaction"
          description="Les transactions apparaîtront ici lorsque vous effectuerez des paiements ou recevrez des fonds."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((tx: any) => {
            const isPositive = tx.amount > 0;
            return (
              <Card key={tx.id} className="p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={cn(
                        'p-2 rounded-xl shrink-0',
                        isPositive
                          ? 'bg-emerald-50 dark:bg-emerald-900/30'
                          : 'bg-red-50 dark:bg-red-900/30'
                      )}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {tx.description || tx.reference || `#${tx.id?.slice(0, 8)}`}
                        </span>
                        <Badge
                          variant={
                            tx.status === 'COMPLETED'
                              ? 'success'
                              : tx.status === 'PENDING'
                                ? 'warning'
                                : 'default'
                          }
                          size="xs"
                        >
                          {tx.status === 'COMPLETED'
                            ? 'Complété'
                            : tx.status === 'PENDING'
                              ? 'En attente'
                              : tx.status === 'FAILED'
                                ? 'Échoué'
                                : tx.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {tx.category && <span>{tx.category}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {tx.createdAt
                            ? new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '-'}
                        </span>
                        {tx.reference && (
                          <span className="font-mono text-[10px]">{tx.reference}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        'text-lg font-bold',
                        isPositive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      )}
                    >
                      {isPositive ? '+' : ''}
                      {Number(tx.amount || 0).toLocaleString()} FCFA
                    </p>
                    {tx.fee && (
                      <p className="text-[10px] text-gray-400">
                        Frais : {Number(tx.fee).toLocaleString()} FCFA
                      </p>
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
