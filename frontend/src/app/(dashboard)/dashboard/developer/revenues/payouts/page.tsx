'use client';

import { useState, useMemo } from 'react';
import { Wallet, Download, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/lib/utils';
import { useDeveloperPayouts, useRequestDeveloperPayout, useDeveloperRevenueSummary } from '@/features/developerHooks';
import type { DeveloperPayout } from '@/types/developer';

const PAYOUT_METHODS = [
  { id: 'OM', label: 'Orange Money', desc: 'Frais : 1.5%' },
  { id: 'MTN', label: 'MTN Mobile Money', desc: 'Frais : 1.5%' },
  { id: 'WAVE', label: 'Wave', desc: 'Frais : 1%' },
  { id: 'BANK', label: 'Virement bancaire', desc: 'Frais : 2.5% - 3-5 jours' },
];

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  COMPLETED: 'success',
  PROCESSING: 'warning',
  PENDING: 'info',
  FAILED: 'danger',
};

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Complété',
  PROCESSING: 'En cours',
  PENDING: 'En attente',
  FAILED: 'Échoué',
};

export default function DeveloperPayoutsPage() {
  const { data: payoutsData, isLoading, error, refetch } = useDeveloperPayouts();
  const { data: summary } = useDeveloperRevenueSummary();
  const requestPayout = useRequestDeveloperPayout();

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('OM');

  const payouts = useMemo(() => {
    if (!payoutsData) return [];
    return Array.isArray(payoutsData) ? payoutsData : (payoutsData.payouts || payoutsData.data || []);
  }, [payoutsData]);

  const stats = useMemo(() => {
    const totalPaid = payouts
      .filter((p: DeveloperPayout) => p.status === 'COMPLETED')
      .reduce((s: number, p: DeveloperPayout) => s + Number(p.netAmount || p.amount || 0), 0);
    const pending = payouts
      .filter((p: DeveloperPayout) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((s: number, p: DeveloperPayout) => s + Number(p.netAmount || p.amount || 0), 0);
    const available = (summary?.netTotal || 0) - totalPaid - pending;
    return { totalPaid, pending, available };
  }, [payouts, summary]);

  const handleRequestPayout = async () => {
    try {
      const amount = Number(payoutAmount);
      if (!amount || amount <= 0) return;
      await requestPayout.mutateAsync({ amount, method: payoutMethod, currency: 'XAF' });
      setPayoutAmount('');
      setShowRequestForm(false);
    } catch (e) { console.error(e); }
  };

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des retraits..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Retraits"
        description="Gérez vos demandes de retrait de revenus"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Revenus', href: '/dashboard/developer/revenues' },
          { label: 'Retraits' },
        ]}
        actions={
          <Button variant="gradient" size="sm" onClick={() => setShowRequestForm(!showRequestForm)}>
            <Plus className="h-4 w-4" />
            Demander un retrait
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.available.toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Disponible</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPaid.toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total retiré</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-3">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pending.toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">En attente</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
            <Wallet className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{payouts.length}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total des retraits</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Historique des retraits</h3>
            </div>

            {payouts.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-10 w-10" />}
                title="Aucun retrait"
                description="Vous n'avez pas encore effectué de retrait."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Montant</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Méthode</th>
                      <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Référence</th>
                      <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p: DeveloperPayout) => (
                      <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">
                          {Number(p.netAmount || p.amount).toLocaleString()} FCFA
                        </td>
                        <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{p.method}</td>
                        <td className="py-3 px-2 text-xs font-mono text-gray-400">{p.reference || '—'}</td>
                        <td className="py-3 px-2 text-center">
                          <Badge variant={STATUS_VARIANTS[p.status] || 'default'} size="xs">
                            {STATUS_LABELS[p.status] || p.status}
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

        <div className="space-y-4">
          {showRequestForm && (
            <Card padding="lg">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Demande de retrait</h3>
              <div className="space-y-4">
                <Input
                  label="Montant (FCFA)"
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="0"
                  icon={<Wallet className="h-4 w-4" />}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Méthode</label>
                  <div className="space-y-2">
                    {PAYOUT_METHODS.map((m) => (
                      <label
                        key={m.id}
                        onClick={() => setPayoutMethod(m.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',
                          payoutMethod === m.id ? 'border-brand bg-brand-50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                        )}
                      >
                        <input type="radio" name="method" value={m.id} checked={payoutMethod === m.id} onChange={() => setPayoutMethod(m.id)} className="sr-only" />
                        <div className={cn('w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0', payoutMethod === m.id ? 'border-brand' : 'border-gray-300')}>
                          {payoutMethod === m.id && <div className="w-2 h-2 rounded-full bg-brand" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.label}</p>
                          <p className="text-xs text-gray-400">{m.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  fullWidth
                  onClick={handleRequestPayout}
                  isLoading={requestPayout.isPending}
                  disabled={!payoutAmount || Number(payoutAmount) <= 0}
                >
                  <Download className="h-4 w-4" />
                  Effectuer le retrait
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
