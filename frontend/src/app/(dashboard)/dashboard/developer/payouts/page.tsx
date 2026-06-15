'use client';

import { useState, useMemo } from 'react';
import {
  Wallet, Banknote, ArrowUpRight, CheckCircle2, XCircle,
  Clock, AlertCircle, Plus, Send, CreditCard, Building2,
  Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDeveloperPayouts, useRequestDeveloperPayout } from '@/features/developerHooks';
import type { DeveloperPayout, PayoutStatus } from '@/types/developer';

const PAYOUT_METHODS = [
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
];

const STATUS_BADGE: Record<PayoutStatus, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PROCESSING: { label: 'En cours', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  COMPLETED: { label: 'Complété', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  FAILED: { label: 'Échoué', className: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function DeveloperPayoutsPage() {
  const { data: payouts, isLoading, error, refetch } = useDeveloperPayouts();
  const requestPayout = useRequestDeveloperPayout();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('MOBILE_MONEY');

  const payoutList = useMemo(() => {
    if (!payouts) return [];
    return Array.isArray(payouts) ? payouts : (payouts.payouts || payouts.data || []);
  }, [payouts]);

  const summary = useMemo(() => {
    const list = payoutList as DeveloperPayout[];
    const available = list
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.netAmount, 0);
    const pendingAmount = list
      .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + p.netAmount, 0);
    return { available, pendingAmount };
  }, [payoutList]);

  const handleRequestPayout = async () => {
    try {
      if (!amount || Number(amount) <= 0) return;
      await requestPayout.mutateAsync({ amount: Number(amount), method });
      setAmount('');
      setShowForm(false);
    } catch (e) { console.error(e); }
  };

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des retraits..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Retraits"
        description="Gérez vos demandes de retrait"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Retraits' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatsCard
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          label="Solde disponible"
          value={`${summary.available.toLocaleString()} FCFA`}
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600"
          label="En attente de traitement"
          value={`${summary.pendingAmount.toLocaleString()} FCFA`}
        />
      </div>

      {showForm && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Nouvelle demande de retrait</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <Input
              label="Montant (FCFA)"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              icon={<Banknote className="h-4 w-4" />}
              placeholder="50000"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Méthode de retrait
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 transition-all duration-200 focus-ring"
              >
                {PAYOUT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <Button
              variant="gradient"
              fullWidth
              onClick={handleRequestPayout}
              isLoading={requestPayout.isPending}
              disabled={!amount || Number(amount) <= 0}
            >
              <Send className="h-4 w-4" />
              Envoyer la demande
            </Button>
          </div>
        </Card>
      )}

      {!showForm && (
        <Button variant="secondary" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Demander un retrait
        </Button>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Historique des retraits
        </h3>

        {payoutList.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-10 w-10" />}
            title="Aucun retrait"
            description="Vous n'avez pas encore effectué de demande de retrait."
          />
        ) : (
          <div className="space-y-2">
            {(payoutList as DeveloperPayout[]).map((p) => (
              <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    p.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-900/30' :
                    p.status === 'FAILED' ? 'bg-red-50 dark:bg-red-900/30' :
                    'bg-amber-50 dark:bg-amber-900/30'
                  )}>
                    {p.status === 'COMPLETED' ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : p.status === 'FAILED' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {p.netAmount.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {p.method === 'BANK_TRANSFER' ? 'Virement bancaire' : 'Mobile Money'} · {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    STATUS_BADGE[p.status as PayoutStatus]?.className || 'bg-gray-50 text-gray-600'
                  )}>
                    {STATUS_BADGE[p.status as PayoutStatus]?.label || p.status}
                  </span>
                  {p.reference && (
                    <p className="text-[11px] text-gray-400 mt-0.5">Ref: {p.reference}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
