'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CreditCard,
  Smartphone,
  Send,
  Download,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

const QUICK_ACTIONS = [
  {
    label: 'Approvisionner',
    icon: Plus,
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
  },
  { label: 'Transférer', icon: Send, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
  {
    label: 'Retirer',
    icon: Download,
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
  },
];

const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'income', label: 'Revenus' },
  { key: 'expense', label: 'Dépenses' },
  { key: 'transfer', label: 'Transferts' },
];

export default function WalletPage() {
  const [filter, setFilter] = useState('all');

  const {
    data: walletData,
    isLoading: walletLoading,
    error: walletError,
    refetch,
  } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const res = await apiClient.getWallet();
      return res.data.data;
    },
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const res = await apiClient.getWalletTransactions();
      return res.data.data;
    },
    retry: 1,
  });

  const transactions = useMemo(
    () => (Array.isArray(txData) ? txData : (txData?.transactions ?? [])),
    [txData]
  );

  const filtered = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter((t: any) => t.type === filter)),
    [transactions, filter]
  );

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const totalExpense = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
    const pendingCount = transactions.filter((t: any) => t.status === 'pending').length;
    return { totalIncome, totalExpense, pendingCount };
  }, [transactions]);

  if (walletError) return <ErrorState message={(walletError as any).message} onRetry={refetch} />;

  if (walletLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Portefeuille"
          description="Gérez votre solde et vos transactions"
          breadcrumbs={[{ label: 'Portefeuille' }]}
        />
        {/* Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 w-24 bg-white/20 rounded" />
            <div className="h-10 w-48 bg-white/20 rounded" />
            <div className="h-8 w-36 bg-white/20 rounded mt-4" />
          </div>
        </div>
        <Loader variant="spinner" size="md" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <PageHeader
        title="Portefeuille"
        description="Gérez votre solde et vos transactions"
        breadcrumbs={[{ label: 'Portefeuille' }]}
      />

      {/* Balance Card */}
      <motion.div variants={itemVariants}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 p-6 sm:p-8">
          {/* Décorations */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-300/5 rounded-full blur-2xl" />

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-100/80">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">Solde disponible</span>
                </div>
                <motion.p
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.15 }}
                  className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
                >
                  {Number(walletData?.balance ?? 0).toLocaleString()}{' '}
                  <span className="text-xl sm:text-2xl text-emerald-200/80 font-medium">FCFA</span>
                </motion.p>
              </div>

              {/* Cashback */}
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                <div className="flex items-center gap-1.5 text-sm text-emerald-200">
                  <PiggyBank className="h-4 w-4" />
                  Cashback reçu
                </div>
                <p className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  +{Number(walletData?.cashback ?? 0).toLocaleString()} FCFA
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-6">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white text-xs font-medium border border-white/10 transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                Revenus
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {stats.totalIncome.toLocaleString()} FCFA
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                Dépenses
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {stats.totalExpense.toLocaleString()} FCFA
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/30">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                En attente
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {stats.pendingCount}
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <RefreshCw className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                Transactions
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {transactions.length}
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Transactions */}
      <motion.div variants={itemVariants}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header + Filters */}
          <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Transactions</h3>
                {transactions.length > 0 && (
                  <span className="text-xs text-gray-400">({transactions.length})</span>
                )}
              </div>
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {FILTERS.map((f) => (
                  <button
                    type="button"
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                      filter === f.key
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {txLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-10 w-10" />}
                title="Aucune transaction"
                description="Les transactions apparaîtront ici après vos achats et rechargements."
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-1"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((tx: any, idx: number) => {
                    const isIncome = tx.type === 'income';
                    const amount = Number(tx.amount || 0);
                    return (
                      <motion.div
                        key={tx.id}
                        variants={itemVariants}
                        layout
                        className="group flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-600 cursor-default"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                              isIncome
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'
                                : 'bg-red-50 dark:bg-red-900/30 text-red-600'
                            )}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : (
                              <ArrowDownLeft className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {tx.description || (isIncome ? 'Revenu' : 'Dépense')}
                            </p>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                {isIncome ? (
                                  <Smartphone className="h-3 w-3" />
                                ) : (
                                  <CreditCard className="h-3 w-3" />
                                )}
                                {tx.method || tx.paymentMethod || 'Mobile Money'}
                              </span>
                              {tx.createdAt && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {new Date(tx.createdAt).toLocaleDateString('fr-FR', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p
                            className={cn(
                              'text-sm font-bold font-mono',
                              isIncome ? 'text-emerald-600' : 'text-red-600'
                            )}
                          >
                            {isIncome ? '+' : '-'}
                            {amount.toLocaleString()} FCFA
                          </p>
                          <div className="mt-0.5">
                            <Badge
                              variant={
                                tx.status === 'completed'
                                  ? 'success'
                                  : tx.status === 'pending'
                                    ? 'warning'
                                    : 'danger'
                              }
                              size="xs"
                            >
                              {tx.status === 'completed'
                                ? 'Effectué'
                                : tx.status === 'pending'
                                  ? 'En cours'
                                  : tx.status === 'failed'
                                    ? 'Échoué'
                                    : tx.status || '—'}
                            </Badge>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Need to import Clock for the skeleton
