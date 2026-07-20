'use client';

import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  CreditCard,
  Download,
  Plus,
  RefreshCw,
  Banknote,
  PiggyBank,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { DataTable, Column } from '@/components/dashboard/DataTable';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePayments, useWallet } from '@/features/hooks';

const paymentMethods = [
  { name: 'Wave', icon: 'W', color: 'bg-blue-600' },
  { name: 'Flooz', icon: 'F', color: 'bg-green-600' },
  { name: 'TMoney', icon: 'T', color: 'bg-red-600' },
  { name: 'Moov Money', icon: 'M', color: 'bg-yellow-600' },
  { name: 'Virement', icon: 'V', color: 'bg-gray-600' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
};

function WalletSkeleton() {
  return (
    <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-xl p-6 text-white animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-white/20 rounded" />
          <div className="h-8 w-48 bg-white/20 rounded" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-4 w-24 bg-white/20 rounded ml-auto" />
          <div className="h-6 w-32 bg-white/20 rounded ml-auto" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-9 w-36 bg-white/20 rounded-lg" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 bg-white/20 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { data, isLoading, error, refetch } = usePayments({ limit: 100 });
  const { data: wallet, isLoading: walletLoading } = useWallet();

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const walletBalance = wallet?.balance ?? 0;
  const walletCashback = wallet?.cashback ?? 0;

  const transactions = data?.payments ?? [];

  const totalSpent = transactions
    .filter((t: any) => {
      const isCredit =
        t.type === 'remboursement' ||
        t.type === 'cashback' ||
        t.type === 'depot' ||
        t.type === 'refund';
      return !isCredit;
    })
    .reduce((sum: number, t: any) => sum + Number(t.amount || t.montant || 0), 0);

  const totalCashback = transactions
    .filter((t: any) => t.type === 'cashback')
    .reduce((sum: number, t: any) => sum + Number(t.amount || t.montant || 0), 0);

  const columns: Column<any>[] = [
    {
      key: 'type',
      label: 'Type',
      render: (item) => {
        const isCredit =
          item.type === 'remboursement' ||
          item.type === 'cashback' ||
          item.type === 'depot' ||
          item.type === 'refund';
        return (
          <div
            className={`flex items-center gap-1.5 ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {isCredit ? (
              <ArrowDownLeft className="h-4 w-4" />
            ) : (
              <ArrowUpRight className="h-4 w-4" />
            )}
            <span className="text-xs font-medium capitalize">
              {item.type === 'remboursement'
                ? 'Remboursement'
                : item.type === 'cashback'
                  ? 'Cashback'
                  : item.type === 'depot'
                    ? 'Dépôt'
                    : item.type === 'paiement'
                      ? 'Paiement'
                      : item.type || 'Transaction'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (item) => (
        <span className="text-gray-600 dark:text-gray-400">
          {item.description || item.reference || '-'}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Montant',
      sortable: true,
      render: (item) => {
        const val = item.amount || item.montant || 0;
        const isCredit =
          item.type === 'remboursement' ||
          item.type === 'cashback' ||
          item.type === 'depot' ||
          item.type === 'refund';
        return (
          <span
            className={`font-semibold font-mono ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}
          >
            {isCredit ? '+' : '-'}
            {Number(val).toLocaleString()} FCFA
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      sortable: true,
      render: (item) => {
        const date = item.createdAt ? new Date(item.createdAt) : null;
        if (!date) return <span className="text-gray-400">{item.date || '-'}</span>;
        return (
          <span className="text-gray-600 dark:text-gray-400">
            {date.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            <br />
            <span className="text-xs text-gray-400">
              {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </span>
        );
      },
    },
    {
      key: 'method',
      label: 'Méthode',
      render: (item) => {
        const method = item.method || item.methode || item.paymentMethod;
        if (!method) return <span className="text-gray-400">-</span>;
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
            {method}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item) => <StatusBadge variant={(item.status || item.statut || 'pending') as any} />,
    },
  ];

  if (isLoading || walletLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader
          title="Mes paiements"
          description="Portefeuille AfriBiz et historique des transactions"
          breadcrumbs={[{ label: 'Paiements' }]}
        />
        <WalletSkeleton />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse"
            >
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-3" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-1" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 animate-pulse">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
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
        title="Mes paiements"
        description="Portefeuille AfriBiz et historique des transactions"
        breadcrumbs={[{ label: 'Paiements' }]}
        actions={
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Actualiser
          </Button>
        }
      />

      {/* Portefeuille AfriBiz */}
      <motion.div
        variants={itemVariants}
        className="relative bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 rounded-xl overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-xl" />

        <div className="relative p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-5 w-5 text-emerald-300" />
                <span className="text-sm font-medium text-emerald-100">Portefeuille AfriBiz</span>
              </div>
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="text-3xl sm:text-4xl font-bold tracking-tight"
              >
                {Number(walletBalance).toLocaleString()} FCFA
              </motion.p>
            </div>
            <div className="text-right p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-sm text-emerald-200 justify-end">
                <PiggyBank className="h-4 w-4" />
                Cashback reçu
              </div>
              <p className="text-xl sm:text-2xl font-bold mt-0.5">
                +{Number(walletCashback).toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 hover:bg-white/25 text-white border-0 backdrop-blur-sm transition-all hover:shadow-lg"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Ajouter des fonds
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-200 mr-1">Méthodes acceptées</span>
              {paymentMethods.slice(0, 3).map((m) => (
                <div
                  key={m.name}
                  className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-black/20`}
                  title={m.name}
                >
                  {m.icon}
                </div>
              ))}
              <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold">
                +{paymentMethods.length - 3}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div variants={itemVariants}>
          <StatsCard
            icon={<CreditCard className="h-5 w-5" />}
            label="Paiements en attente"
            value={transactions.filter((t: any) => t.status === 'pending').length}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            icon={<Wallet className="h-5 w-5" />}
            label="Paiements partiels"
            value={transactions.filter((t: any) => t.status === 'partial').length}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            icon={<Banknote className="h-5 w-5" />}
            label="Total dépensé"
            value={`${Number(totalSpent).toLocaleString()} FCFA`}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatsCard
            icon={<Download className="h-5 w-5" />}
            label="Remboursements"
            value={
              transactions.filter((t: any) => t.status === 'refunded' || t.type === 'remboursement')
                .length
            }
          />
        </motion.div>
      </motion.div>

      {/* Transactions table */}
      <motion.div variants={itemVariants}>
        <DataTable
          columns={columns}
          data={transactions}
          keyExtractor={(item) => item.id}
          searchable
          searchPlaceholder="Rechercher une transaction..."
          emptyState={
            <EmptyState
              icon={<Wallet className="h-10 w-10" />}
              title="Aucune transaction"
              description="Vos transactions apparaîtront ici après vos achats et réservations."
              action={
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Explorer le marketplace
                </Button>
              }
            />
          }
        />
      </motion.div>
    </motion.div>
  );
}
