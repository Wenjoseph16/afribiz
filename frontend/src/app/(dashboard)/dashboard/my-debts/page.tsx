'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign, Search, Loader2,
  CreditCard,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useClientDebts, usePayClientDebt } from '@/features/hooks';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PARTIALLY_PAID: { label: 'Partiellement payée', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  OVERDUE: { label: 'En retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CRITICAL: { label: 'Critique', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  DISPUTED: { label: 'Litige', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  SETTLED: { label: 'Soldée', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CANCELLED: { label: 'Annulée', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'ACTIVE', label: 'Actives' },
  { key: 'PARTIALLY_PAID', label: 'Partielles' },
  { key: 'OVERDUE', label: 'En retard' },
  { key: 'SETTLED', label: 'Soldées' },
];

export default function MyDebtsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState<{ open: boolean; debtId: string; remaining: number }>({ open: false, debtId: '', remaining: 0 });
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');

  const { data, isLoading, error, refetch } = useClientDebts();
  const payMutation = usePayClientDebt();

  const debts = useMemo(() => {
    const d = Array.isArray(data) ? data : (data?.debts || []);
    return (d as any[]).filter((debt: any) => {
      if (activeTab !== 'all' && debt.status !== activeTab) return false;
      if (search && !debt.businessName?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, activeTab, search]);

  const stats = useMemo(() => {
    const all = Array.isArray(data) ? data : (data?.debts || []);
    return {
      total: all.reduce((s: number, d: any) => s + Number(d.totalAmount), 0),
      remaining: all.reduce((s: number, d: any) => s + Number(d.remainingAmount), 0),
      active: all.filter((d: any) => d.status === 'ACTIVE' || d.status === 'PARTIALLY_PAID' || d.status === 'OVERDUE').length,
      settled: all.filter((d: any) => d.status === 'SETTLED').length,
    };
  }, [data]);

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message="Erreur chargement dettes" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes dettes"
        description="Suivez et gérez vos dettes auprès des vendeurs"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total dû</p>
          <p className="text-2xl font-bold">{stats.total.toLocaleString()} FCFA</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Reste à payer</p>
          <p className="text-2xl font-bold text-amber-600">{stats.remaining.toLocaleString()} FCFA</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Dettes actives</p>
          <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Soldées</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.settled}</p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text" placeholder="Rechercher par vendeur..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {debts.length === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-12 w-12" />}
          title="Aucune dette"
          description="Vous n'avez aucune dette en cours."
        />
      ) : (
        <div className="space-y-4">
          {debts.map((debt: any) => {
            const config = STATUS_CONFIG[debt.status] || STATUS_CONFIG.ACTIVE;
            return (
              <Card key={debt.id} className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-2 rounded-lg', config.color)}>
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{debt.businessName || 'Vendeur'}</span>
                        <Badge variant="default" className={config.color}>{config.label}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Réf: {debt.reference || debt.id.slice(0, 8)} · {debt.sourceType || 'Commande'}
                      </p>
                      {debt.dueDate && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Échéance: {new Date(debt.dueDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold">{Number(debt.totalAmount).toLocaleString()} FCFA</p>
                      <p className="text-sm text-gray-500">
                        Payé: {Number(debt.amountPaid).toLocaleString()} · Reste: {Number(debt.remainingAmount).toLocaleString()}
                      </p>
                    </div>
                    {debt.progression !== undefined && (
                      <div className="w-48">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progression</span>
                          <span>{debt.progression}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${debt.progression}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {debt.status !== 'SETTLED' && debt.status !== 'CANCELLED' && (
                      <Button
                        size="xs" variant="primary"
                        onClick={() => {
                          setPayModal({ open: true, debtId: debt.id, remaining: Number(debt.remainingAmount) });
                          setPayAmount(String(debt.remainingAmount));
                        }}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Payer
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={payModal.open} onClose={() => setPayModal({ open: false, debtId: '', remaining: 0 })}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Effectuer un paiement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Montant (max: {payModal.remaining.toLocaleString()} FCFA)</label>
              <input
                type="number" min={1} max={payModal.remaining}
                value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Moyen de paiement</label>
              <select
                value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm"
              >
                <option value="">Sélectionner...</option>
                <option value="TMONEY">Tmoney</option>
                <option value="FLOOZ">Flooz</option>
                <option value="WAVE">Wave</option>
                <option value="ORANGE_MONEY">Orange Money</option>
                <option value="CARD">Carte bancaire</option>
                <option value="BANK_TRANSFER">Virement bancaire</option>
                <option value="CASH">Espèces</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setPayModal({ open: false, debtId: '', remaining: 0 })}>Annuler</Button>
            <Button
              variant="primary"
              disabled={!payAmount || Number(payAmount) <= 0 || Number(payAmount) > payModal.remaining || payMutation.isPending}
              onClick={() => {
                payMutation.mutate({ id: payModal.debtId, amount: Number(payAmount), paymentMethod: payMethod });
                setPayModal({ open: false, debtId: '', remaining: 0 });
              }}
            >
              {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Payer {Number(payAmount || 0).toLocaleString()} FCFA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}