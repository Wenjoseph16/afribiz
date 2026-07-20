'use client';

import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Wallet,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

function fmt(n: number): string {
  if (n === null || n === undefined) return '-';
  return n.toLocaleString('fr-FR') + ' FCFA';
}

export default function AccountingPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['accounting-summary'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/business/accounting/summary');
        return res.data.data || {};
      } catch {
        return {};
      }
    },
    refetchInterval: false,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ['accounting-transactions', 'recent'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/business/accounting/transactions?limit=5');
        return res.data.data || { transactions: [] };
      } catch {
        return { transactions: [] };
      }
    },
  });

  if (error)
    return (
      <ErrorState message={(error as any)?.message || 'Erreur de chargement'} onRetry={refetch} />
    );
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const summary = data?.summary ?? data ?? {};
  const transactions = Array.isArray(recentTransactions)
    ? recentTransactions
    : (recentTransactions?.transactions ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Comptabilite"
        description="Gestion comptable et rapports financiers"
        breadcrumbs={[{ label: 'Comptabilite' }]}
        actions={
          <Link href="/dashboard/accounting/reports">
            <Button variant="gradient" size="sm">
              <FileText className="h-4 w-4 mr-1.5" />
              Rapports complets
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Chiffre d affaires"
          value={fmt(summary.totalRevenue)}
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Recettes du mois"
          value={fmt(summary.monthlyRevenue)}
        />
        <StatsCard
          icon={<TrendingDown className="h-5 w-5" />}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          label="Depenses du mois"
          value={fmt(summary.monthlyExpenses)}
        />
        <StatsCard
          icon={<BarChart3 className="h-5 w-5" />}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          label="Resultat net"
          value={fmt(summary.netIncome)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/accounting/reports"
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand">
              Rapports comptables
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Bilan, compte de resultat et export CSV
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand shrink-0" />
        </Link>
        <Link
          href="/dashboard/invoices"
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand">
              Factures
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gerer et exporter vos factures
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand shrink-0" />
        </Link>
        <Link
          href="/dashboard/quotes"
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-sm transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand">
              Devis
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Creer et suivre vos devis
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand shrink-0" />
        </Link>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Dernieres transactions
          </h3>
          <Link
            href="/dashboard/payments/transactions"
            className="text-xs font-medium text-brand hover:text-brand-700"
          >
            Voir tout →
          </Link>
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx: any) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' +
                      (tx.type === 'CREDIT' || tx.type === 'INCOME' ? 'bg-emerald-50' : 'bg-red-50')
                    }
                  >
                    {tx.type === 'CREDIT' || tx.type === 'INCOME' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {tx.label || tx.description || 'Transaction'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {tx.createdAt
                        ? new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={
                    'text-sm font-semibold shrink-0 ml-3 ' +
                    (tx.type === 'CREDIT' || tx.type === 'INCOME'
                      ? 'text-emerald-600'
                      : 'text-red-600')
                  }
                >
                  {tx.type === 'CREDIT' || tx.type === 'INCOME' ? '+' : '-'}
                  {fmt(tx.amount || tx.totalAmount || 0)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Aucune transaction recente</p>
          </div>
        )}
      </Card>
    </div>
  );
}
