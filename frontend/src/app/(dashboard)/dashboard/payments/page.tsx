'use client';

import { Wallet, ArrowUpRight, ArrowDownLeft, TrendingUp, CreditCard, Download } from 'lucide-react';
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

export default function PaymentsPage() {
  const { data, isLoading, error, refetch } = usePayments({ limit: 100 });
  const { data: wallet } = useWallet();

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const walletBalance = wallet?.balance ?? 0;
  const walletCashback = wallet?.cashback ?? 0;

  const paymentsArray = Array.isArray(data) ? data : (data?.payments || data?.items || data?.data || []);
  const transactions = paymentsArray;

  const columns: Column<any>[] = [
    {
      key: 'type',
      label: 'Type',
      render: (item) => {
        const isCredit = item.type === 'remboursement' || item.type === 'cashback' || item.type === 'depot' || item.type === 'refund';
        return (
          <div className={`flex items-center gap-1.5 ${isCredit ? 'text-emerald-700' : 'text-red-600'}`}>
            {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            <span className="text-xs font-medium capitalize">{item.type}</span>
          </div>
        );
      },
    },
    { key: 'description', label: 'Description',
      render: (item) => item.description || item.reference || '-'
    },
    { key: 'amount', label: 'Montant', sortable: true,
      render: (item) => {
        const val = item.amount || item.montant || 0;
        const isCredit = item.type === 'remboursement' || item.type === 'cashback' || item.type === 'depot' || item.type === 'refund';
        return <span className={isCredit ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>{Number(val).toLocaleString()} FCFA</span>;
      }
    },
    { key: 'createdAt', label: 'Date', sortable: true,
      render: (item) => item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : item.date || ''
    },
    { key: 'method', label: 'Méthode',
      render: (item) => item.method || item.methode || item.paymentMethod || '-'
    },
    {
      key: 'status',
      label: 'Statut',
      render: (item) => <StatusBadge variant={(item.status || item.statut || 'pending') as any} />,
    },
  ];

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mes paiements"
        description="Portefeuille AfriBiz et historique des transactions"
        breadcrumbs={[{ label: 'Paiements' }]}
      />

      {/* Portefeuille AfriBiz */}
      <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium opacity-90">Portefeuille AfriBiz</span>
            </div>
            <p className="text-3xl font-bold">{Number(walletBalance).toLocaleString()} FCFA</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm opacity-90">
              <TrendingUp className="h-4 w-4" />
              Cashback reçu
            </div>
            <p className="text-xl font-bold">{Number(walletCashback).toLocaleString()} FCFA</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="secondary" size="sm">
            <CreditCard className="h-4 w-4 mr-1.5" />
            Ajouter des fonds
          </Button>
          <div className="flex gap-2">
            {paymentMethods.slice(0, 3).map((m) => (
              <div key={m.name} className={`w-8 h-8 rounded-lg ${m.color} flex items-center justify-center text-white text-xs font-bold`}>
                {m.icon}
              </div>
            ))}
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white text-xs font-bold">
              +{paymentMethods.length - 3}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={<CreditCard className="h-5 w-5" />} label="Paiements en attente" value={transactions.filter((t: any) => t.status === 'pending').length} />
        <StatsCard icon={<Wallet className="h-5 w-5" />} label="Paiements partiels" value={transactions.filter((t: any) => t.status === 'partial').length} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} label="Cashback total" value={`${Number(walletCashback).toLocaleString()} FCFA`} />
        <StatsCard icon={<Download className="h-5 w-5" />} label="Remboursements" value={transactions.filter((t: any) => t.status === 'refunded' || t.type === 'remboursement').length} />
      </div>

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
          />
        }
      />
    </div>
  );
}
