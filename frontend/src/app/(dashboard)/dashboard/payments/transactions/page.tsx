'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { CreditCard, CheckCircle, Clock, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROVIDER_COLORS: Record<string, string> = { STRIPE: 'text-purple-600 bg-purple-50', TMONEY: 'text-blue-600 bg-blue-50', FLOOZ: 'text-emerald-600 bg-emerald-50', WAVE: 'text-cyan-600 bg-cyan-50', CASH: 'text-emerald-600 bg-emerald-50', BANK: 'text-amber-600 bg-amber-50' };
const STATUS_BADGE: Record<string, 'success' | 'warning' | 'default'> = { SUCCESS: 'success', PENDING: 'warning', FAILED: 'default', REFUNDED: 'default' };
const STATUS_LABELS: Record<string, string> = { SUCCESS: 'Réussi', PENDING: 'En attente', FAILED: 'Échoué', REFUNDED: 'Remboursé' };

export default function TransactionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payment-transactions'],
    queryFn: async () => {
      try { const res = await apiClient.get('/payments/processor/transactions'); return res.data.data; }
      catch { return { transactions: [], total: 0 }; }
    },
  });
  if (isLoading) return <Loader />;
  const tx = data?.transactions || [];
  return (
    <div className="space-y-6">
      <PageHeader title="Transactions" description="Historique des paiements" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: tx.length, icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Réussies', value: tx.filter((t: any) => t.status === 'SUCCESS').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'En attente', value: tx.filter((t: any) => t.status === 'PENDING').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Montant', value: tx.reduce((s: number, t: any) => s + (t.amount || 0), 0).toLocaleString() + ' FCFA', icon: Banknote, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (<div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className={cn('p-2.5 rounded-lg w-fit', s.bg)}><Icon className={cn('h-5 w-5', s.color)} /></div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>);
        })}
      </div>
      {tx.length > 0 ? (<div className="space-y-2">
        {tx.map((t: any) => (<div key={t.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand/20 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn('p-2 rounded-lg shrink-0', PROVIDER_COLORS[t.provider] || 'bg-gray-50')}><CreditCard className="h-4 w-4" /></div>
            <div className="min-w-0"><p className="text-sm font-medium truncate">{t.provider || 'Paiement'}</p><p className="text-xs text-gray-500">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : ''}</p></div>
          </div>
          <div className="text-right shrink-0"><p className="text-sm font-bold">{t.amount?.toLocaleString()} FCFA</p><Badge variant={STATUS_BADGE[t.status] || 'default'}>{STATUS_LABELS[t.status] || t.status}</Badge></div>
        </div>))}
      </div>) : (
        <EmptyState icon={<CreditCard className="h-12 w-12" />} title="Aucune transaction" description="Les paiements traités apparaîtront ici" />
      )}
    </div>
  );
}
