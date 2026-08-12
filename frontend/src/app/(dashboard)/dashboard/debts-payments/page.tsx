'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  DollarSign,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  Eye,
  Zap,
  CheckCircle2,
  Square,
  CheckSquare,
  Trash2,
  Mail,
  Calendar,
  Banknote,
  Loader,
  X,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { useDebts, usePaymentStats } from '@/features/hooks';
import { CopilotTips } from '@/components/copilot/CopilotTips';

interface DebtItem {
  id: string;
  clientName: string | null;
  clientPhone?: string | null;
  clientEmail: string | null;
  amount: number; // reste à payer
  paidAmount: number;
  dueDate: string | null;
  description: string | null;
  status: string;
  priority: string;
  reference?: string;
  daysOverdue?: number;
  createdAt: string;
}

type TabType = 'all' | 'active' | 'overdue' | 'settled' | 'cancelled';

const ACTIVE_STATUSES = ['ACTIVE', 'PARTIALLY_PAID'];
const OVERDUE_STATUSES = ['OVERDUE', 'CRITICAL'];

const statusConfig: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: 'En attente', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  PARTIALLY_PAID: { label: 'Partiel', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  OVERDUE: { label: 'En retard', class: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  CRITICAL: { label: 'Critique', class: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  SETTLED: { label: 'Payée', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  CANCELLED: { label: 'Annulée', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  LOW: { label: 'Basse', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  MEDIUM: { label: 'Moyenne', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  HIGH: { label: 'Haute', class: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  CRITICAL: { label: 'Urgente', class: 'text-red-700 bg-red-100 dark:bg-red-900/40' },
};

const PAY_METHODS = ['CASH', 'MOBILE_MONEY', 'WAVE', 'TMONEY', 'MTN', 'BANK_TRANSFER'];

export default function DebtsPaymentsPage() {
  const { data: debtsData, isLoading, error, refetch } = useDebts();
  const { data: statsData, refetch: refetchStats } = usePaymentStats();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDebts, setSelectedDebts] = useState<string[]>([]);
  const [payTarget, setPayTarget] = useState<DebtItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allDebts: DebtItem[] = useMemo(() => {
    return Array.isArray(debtsData) ? debtsData : debtsData?.debts || debtsData?.data || [];
  }, [debtsData]);

  const stats = useMemo(() => {
    const active = allDebts.filter((d) => ACTIVE_STATUSES.includes(d.status));
    const overdue = allDebts.filter((d) => OVERDUE_STATUSES.includes(d.status));
    const settled = allDebts.filter((d) => d.status === 'SETTLED');
    return (
      statsData || {
        total: allDebts.length,
        active: active.length,
        activeDebtAmount: active.reduce((a, d) => a + d.amount, 0),
        overdue: overdue.length,
        settled: settled.length,
        totalRecovered: settled.reduce((a, d) => a + d.paidAmount, 0),
      }
    );
  }, [statsData, allDebts]);

  const filtered = useMemo(() => {
    let f = [...allDebts];
    switch (activeTab) {
      case 'active':
        f = f.filter((d) => ACTIVE_STATUSES.includes(d.status));
        break;
      case 'overdue':
        f = f.filter((d) => OVERDUE_STATUSES.includes(d.status));
        break;
      case 'settled':
        f = f.filter((d) => d.status === 'SETTLED');
        break;
      case 'cancelled':
        f = f.filter((d) => d.status === 'CANCELLED');
        break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(
        (d) =>
          d.clientName?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.clientEmail?.toLowerCase().includes(q) ||
          d.clientPhone?.toLowerCase().includes(q) ||
          d.reference?.toLowerCase().includes(q)
      );
    }
    return f;
  }, [allDebts, activeTab, searchQuery]);

  const openPay = (debt: DebtItem) => {
    setPayTarget(debt);
    setPayAmount(String(debt.amount || ''));
    setPayMethod('CASH');
    setPayNotes('');
    setFeedback(null);
  };

  const confirmPayment = async () => {
    if (!payTarget) return;
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      setFeedback('Montant invalide');
      return;
    }
    if (amount > payTarget.amount) {
      setFeedback(`Le montant dépasse le reste à payer (${payTarget.amount.toLocaleString()} FCFA)`);
      return;
    }
    setPayLoading(true);
    setFeedback(null);
    try {
      await apiClient.registerDebtPayment(payTarget.id, {
        amount,
        paymentMethod: payMethod,
        notes: payNotes || undefined,
      });
      setPayLoading(false);
      setPayTarget(null);
      refetch();
      refetchStats();
    } catch (e: any) {
      setPayLoading(false);
      setFeedback(e?.response?.data?.message || e?.message || 'Erreur lors de l’encaissement');
    }
  };

  const sendReminder = async (debt: DebtItem) => {
    setRemindingId(debt.id);
    try {
      const res = await apiClient.sendDebtReminder(debt.id);
      const status = (res.data as any)?.status;
      alert(
        status === 'SENT'
          ? `Rappel envoyé à ${debt.clientName || 'ce client'} ✅`
          : 'Rappel enregistré (envoi différé ou canal indisponible)'
      );
    } catch {
      alert('Erreur lors de l’envoi du rappel');
    } finally {
      setRemindingId(null);
    }
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Clock className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Centre des dettes & paiements"
        description="Suivez et récupérez vos créances clients en temps réel"
        breadcrumbs={[{ label: 'Ventes' }, { label: 'Créances' }]}
        actions={
          <>
            <LiveBadge label="Temps réel" />
            <Link href="/dashboard/debts-payments/aging">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-1.5" />
                Échéancier
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const res = await apiClient.post('/business/finance/escalate');
                  const count = (res.data as any)?.count ?? 0;
                  alert(`${count} créance(s) escaladée(s) avec succès`);
                  refetch();
                  refetchStats();
                } catch {
                  alert("Erreur lors de l'escalade");
                }
              }}
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Escalader les retards
            </Button>
            <Link href="/dashboard/debts-payments/new">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Nouvelle dette
              </Button>
            </Link>
          </>
        }
      />

      <CopilotTips moduleKey="DEBTS_PAYMENTS" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-brand-50"
          iconColor="text-brand"
          label="Reste à encaisser"
          value={`${Number(stats.activeDebtAmount ?? 0).toLocaleString('fr-FR')} FCFA`}
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Dettes actives"
          value={stats.activeDebts ?? stats.active ?? stats.total}
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          label="En retard"
          value={stats.overdue ?? 0}
        />
        <StatsCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Recouvré"
          value={`${Number(stats.totalRecovered ?? 0).toLocaleString('fr-FR')} FCFA`}
        />
      </div>

      {/* Suggestions intelligentes */}
      {allDebts.length > 0 &&
        (() => {
          const overdue = allDebts.filter((d) => OVERDUE_STATUSES.includes(d.status));
          const active = allDebts.filter((d) => ACTIVE_STATUSES.includes(d.status));
          const critical = allDebts.filter(
            (d) => d.status === 'CRITICAL' || d.priority === 'CRITICAL'
          );
          const totalRemaining = allDebts.reduce(
            (a, d) => a + (ACTIVE_STATUSES.includes(d.status) || OVERDUE_STATUSES.includes(d.status) ? d.amount : 0),
            0
          );

          const suggestions = [
            overdue.length > 0 && {
              icon: AlertTriangle,
              title: `${overdue.length} créance${overdue.length > 1 ? 's' : ''} en retard`,
              desc: `${overdue.reduce((a, d) => a + d.amount, 0).toLocaleString('fr-FR')} FCFA à récupérer — lancez les relances automatiques`,
              color: 'red',
            },
            critical.length > 0 && {
              icon: Zap,
              title: `${critical.length} créance${critical.length > 1 ? 's' : ''} critique${critical.length > 1 ? 's' : ''}`,
              desc: 'Action urgente requise — priorité maximale',
              color: 'purple',
            },
            active.length > 0 && {
              icon: Clock,
              title: `${active.length} créance${active.length > 1 ? 's' : ''} en cours`,
              desc: `${totalRemaining.toLocaleString('fr-FR')} FCFA au total, rappels configurés (J+3, J+7, J+15, J+30)`,
              color: 'amber',
            },
            Number(stats.recoveryRate ?? 0) > 0 && {
              icon: CheckCircle2,
              title: `Taux de recouvrement : ${stats.recoveryRate}%`,
              desc: `${Number(stats.totalRecovered ?? 0).toLocaleString('fr-FR')} FCFA déjà encaissés`,
              color: 'emerald',
            },
          ].filter(Boolean);

          if (suggestions.length === 0) return null;

          const colorMap: Record<string, string> = {
            red: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
            amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
            purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
            emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
          };

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.map((s: any, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colorMap[s.color]} border border-gray-200 dark:border-gray-700`}
                >
                  <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                    <s.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {s.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(
            [
              ['all', 'Toutes'],
              ['active', 'En cours'],
              ['overdue', 'En retard'],
              ['settled', 'Payées'],
              ['cancelled', 'Annulées'],
            ] as [TabType, string][]
          ).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un client, un téléphone, une référence…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* Bulk actions */}
      {selectedDebts.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-brand/5 rounded-xl border border-brand/10 flex-wrap">
          <span className="text-sm font-medium text-brand">
            {selectedDebts.length} sélectionnée(s)
          </span>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <Button
            variant="ghost"
            size="xs"
            onClick={async () => {
              try {
                await Promise.all(
                  selectedDebts.map((id) => apiClient.delete(`/business/finance/debts/${id}`))
                );
                alert(`${selectedDebts.length} dette(s) supprimée(s)`);
                setSelectedDebts([]);
                refetch();
                refetchStats();
              } catch {
                alert('Erreur lors de la suppression');
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Supprimer sélection
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={async () => {
              try {
                const res = await apiClient.post('/business/finance/auto-remind', {
                  debtIds: selectedDebts,
                });
                const count = (res.data as any)?.count ?? selectedDebts.length;
                alert(`Relance envoyée à ${count} créance(s)`);
                setSelectedDebts([]);
                refetch();
              } catch {
                alert("Erreur lors de l'envoi des relances");
              }
            }}
          >
            <Mail className="h-3.5 w-3.5 mr-1" />
            Envoyer relance
          </Button>
          <Button variant="ghost" size="xs" onClick={() => setSelectedDebts([])}>
            <Square className="h-3.5 w-3.5 mr-1" />
            Désélectionner
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Wallet className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Aucune dette trouvée
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'Essayez une autre recherche'
              : 'Aucune créance dans cette catégorie. Les ventes à crédit au Point de Vente créent des dettes ici automatiquement.'}
          </p>
          <Link href="/dashboard/debts-payments/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle dette
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={() => {
                if (selectedDebts.length === filtered.length) {
                  setSelectedDebts([]);
                } else {
                  setSelectedDebts(filtered.map((d) => d.id));
                }
              }}
              className="text-gray-400 hover:text-brand transition-colors"
            >
              {selectedDebts.length === filtered.length && filtered.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-brand" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
            <span className="text-xs text-gray-400">Tout sélectionner</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                isSelected={selectedDebts.includes(debt.id)}
                reminding={remindingId === debt.id}
                onToggleSelect={() =>
                  setSelectedDebts((prev) =>
                    prev.includes(debt.id)
                      ? prev.filter((id) => id !== debt.id)
                      : [...prev, debt.id]
                  )
                }
                onPay={() => openPay(debt)}
                onRemind={() => sendReminder(debt)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ══ Modale Encaisser ══ */}
      {payTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPayTarget(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  Encaisser un paiement
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {payTarget.clientName || 'Client'} —{' '}
                  {payTarget.reference ? `réf. ${payTarget.reference}` : ''}
                </p>
              </div>
              <button
                onClick={() => setPayTarget(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Reste à payer</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {payTarget.amount.toLocaleString('fr-FR')} FCFA
                </p>
              </div>
              {payTarget.daysOverdue ? (
                <span className="text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded-full">
                  {payTarget.daysOverdue} j de retard
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full">
                  Dans les délais
                </span>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Montant reçu (FCFA)</label>
              <input
                type="number"
                min={0}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full text-lg font-bold border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Mode de paiement</label>
              <div className="flex flex-wrap gap-1.5">
                {PAY_METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => setPayMethod(m)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      payMethod === m
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    {m.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Note (optionnel)</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Ex. payé au comptoir"
                className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-transparent dark:text-gray-100 outline-none"
              />
            </div>

            {feedback && (
              <p className="text-xs text-red-500 text-center">{feedback}</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPayTarget(null)}>
                Annuler
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={payLoading}
                onClick={confirmPayment}
              >
                {payLoading ? (
                  <Loader className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Banknote className="h-4 w-4 mr-1.5" />
                )}
                Encaisser {Number(payAmount || 0).toLocaleString('fr-FR')} FCFA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getBadge(debt: DebtItem): { label: string; class: string } | null {
  if (debt.status === 'CRITICAL' || debt.priority === 'CRITICAL') {
    return {
      label: '🔴 Critique',
      class: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300',
    };
  }
  if (debt.daysOverdue && debt.daysOverdue > 30) {
    return {
      label: `⚠️ ${debt.daysOverdue} j de retard`,
      class: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300',
    };
  }
  if (debt.createdAt && new Date(debt.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
    return {
      label: '🆕 Nouveau',
      class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300',
    };
  }
  return null;
}

function DebtCard({
  debt,
  isSelected,
  reminding,
  onToggleSelect,
  onPay,
  onRemind,
}: {
  debt: DebtItem;
  isSelected?: boolean;
  reminding?: boolean;
  onToggleSelect?: () => void;
  onPay?: () => void;
  onRemind?: () => void;
}) {
  const due = debt.dueDate ? new Date(debt.dueDate) : null;
  const badge = getBadge(debt);
  const isClosed = debt.status === 'SETTLED' || debt.status === 'CANCELLED';
  const progress =
    debt.paidAmount + debt.amount > 0
      ? Math.round((debt.paidAmount / (debt.paidAmount + debt.amount)) * 100)
      : 0;

  return (
    <div
      className={cn(
        'group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200 relative flex flex-col',
        isSelected && 'ring-2 ring-brand/40'
      )}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect?.();
        }}
        className="absolute top-3 left-3 z-10 p-1 rounded-md bg-white/80 dark:bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-800"
      >
        {isSelected ? (
          <CheckSquare className="h-4 w-4 text-brand" />
        ) : (
          <Square className="h-4 w-4 text-gray-400" />
        )}
      </button>
      <div className="p-4 space-y-3 flex-1">
        {badge && (
          <div className="flex justify-end -mb-2">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
              {badge.label}
            </span>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
              <UserIcon className="h-4 w-4 text-brand" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {debt.clientName || 'Client de passage'}
              </h3>
              <p className="text-xs text-gray-500 truncate">
                {debt.clientPhone || debt.clientEmail || ''}
                {debt.reference ? ` · ${debt.reference}` : ''}
              </p>
            </div>
          </div>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
              priorityConfig[debt.priority]?.class || ''
            )}
          >
            {priorityConfig[debt.priority]?.label || debt.priority}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {Number(debt.amount).toLocaleString('fr-FR')} FCFA
          </span>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              statusConfig[debt.status]?.class || ''
            )}
          >
            {statusConfig[debt.status]?.label || debt.status}
          </span>
        </div>

        {!isClosed && debt.paidAmount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <DollarSign className="h-3 w-3" />
              Payé : {debt.paidAmount.toLocaleString('fr-FR')} FCFA
              <span className="ml-auto text-gray-400">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {due && (
          <div
            className={cn(
              'flex items-center gap-2 text-xs',
              debt.daysOverdue ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {debt.daysOverdue
              ? `En retard de ${debt.daysOverdue} j — échéance ${due.toLocaleDateString('fr-FR')}`
              : `Échéance ${due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </div>
        )}

        {debt.description && (
          <p className="text-xs text-gray-400 line-clamp-1">{debt.description}</p>
        )}
      </div>

      <div className="px-4 pb-4 pt-1 flex items-center gap-2">
        {!isClosed ? (
          <>
            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={onPay}>
              <Banknote className="h-3.5 w-3.5 mr-1" />
              Encaisser
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={onRemind} disabled={reminding}>
              {reminding ? (
                <Loader className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <Mail className="h-3.5 w-3.5 mr-1" />
              )}
              Relancer
            </Button>
          </>
        ) : null}
        <Link
          href={`/dashboard/debts-payments/${debt.id}`}
          className="p-2 rounded-lg text-gray-400 hover:text-brand hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Voir les détails"
        >
          <Eye className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
