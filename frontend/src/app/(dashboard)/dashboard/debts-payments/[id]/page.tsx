'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Edit, Trash2, Loader, DollarSign, CalendarDays, AlertTriangle,
  User, FileText, MessageSquare, Clock, Shield, CheckCircle2, XCircle,
  CreditCard, Send, TrendingUp, Activity,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { cn } from '@/lib/utils';
import {
  useDebt, useUpdateDebt, useDeleteDebt, useUpdateDebtPriority, useRegisterDebtPayment,
  useSendDebtReminder, useReleaseEscrow, useRefundEscrow, useBusinessDisputeEscrow,
} from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

type TabId = 'infos' | 'relances' | 'escrow' | 'risque';

const statusConfig: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: 'Active', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' },
  PARTIALLY_PAID: { label: 'Partiellement payée', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' },
  OVERDUE: { label: 'En retard', class: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300' },
  CRITICAL: { label: 'Critique', class: 'text-red-800 bg-red-100 dark:bg-red-950/30 dark:text-red-400' },
  DISPUTED: { label: 'Contestée', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' },
  SETTLED: { label: 'Réglée', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300' },
  CANCELLED: { label: 'Annulée', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  LOW: { label: 'Basse', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  MEDIUM: { label: 'Moyenne', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  HIGH: { label: 'Haute', class: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  CRITICAL: { label: 'Critique', class: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

const reminderTypeConfig: Record<string, { label: string; class: string }> = {
  EMAIL: { label: 'Email', class: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  SMS: { label: 'SMS', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  WHATSAPP: { label: 'WhatsApp', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
};

const riskLevelConfig: Record<string, { label: string; class: string }> = {
  LOW: { label: 'Faible', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  MEDIUM: { label: 'Moyen', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  HIGH: { label: 'Élevé', class: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  CRITICAL: { label: 'Critique', class: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

export default function DebtDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('infos');

  const { data: debtData, isLoading, error, refetch } = useDebt(id);

  const { data: escrowData } = useQuery({
    queryKey: ['debt-escrow', id],
    queryFn: async () => {
      const res = await apiClient.get(`/business/finance/debts/${id}/escrow`);
      return res.data.data;
    },
    enabled: !!id && activeTab === 'escrow',
  });

  const { data: riskData } = useQuery({
    queryKey: ['debt-risk', id],
    queryFn: async () => {
      const res = await apiClient.get(`/business/finance/debts/${id}/client-risk`);
      return res.data.data;
    },
    enabled: !!id && activeTab === 'risque',
  });

  const settleMutation = useUpdateDebt();
  const deleteMutation = useDeleteDebt();
  const priorityMutation = useUpdateDebtPriority();
  const paymentMutation = useRegisterDebtPayment();
  const reminderMutation = useSendDebtReminder();
  const escrowReleaseMutation = useReleaseEscrow();
  const escrowRefundMutation = useRefundEscrow();
  const escrowDisputeMutation = useBusinessDisputeEscrow();

  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [newPriority, setNewPriority] = useState('');

  const debt = debtData?.debt || debtData?.data || debtData;
  const s = debt ? (statusConfig[debt.status] || statusConfig.ACTIVE) : statusConfig.ACTIVE;
  const p = debt ? (priorityConfig[debt.priority] || priorityConfig.LOW) : priorityConfig.LOW;
  const progress = debt ? Math.min((debt.amountPaid || 0) / (debt.totalAmount || 1), 1) : 0;

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (!debt) return <div className="text-center py-12 text-gray-500">Dette introuvable</div>;

  const paymentMethods = [
    { value: 'CASH', label: 'Espèces' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
    { value: 'BANK_TRANSFER', label: 'Virement bancaire' },
    { value: 'CARD', label: 'Carte bancaire' },
    { value: 'CHECK', label: 'Chèque' },
    { value: 'OTHER', label: 'Autre' },
  ];

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'infos', label: 'Infos', icon: FileText },
    { id: 'relances', label: 'Relances', icon: MessageSquare },
    { id: 'escrow', label: 'Escrow', icon: Shield },
    { id: 'risque', label: 'Risque Client', icon: AlertTriangle },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand via-brand-700 to-indigo-800 p-6 sm:p-8">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/dashboard/debts-payments" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white">{debt.title || debt.description || `Dette #${id.slice(0, 8)}`}</h1>
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', s.class)}>{s.label}</span>
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', p.class)}>{p.label}</span>
              </div>
              {debt.dueDate && (
                <p className="text-sm text-white/70 mt-1 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Échéance: {new Date(debt.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/dashboard/debts-payments/${id}/edit`}>
              <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25 border-0">
                <Edit className="h-4 w-4 mr-1.5" />Modifier
              </Button>
            </Link>
            <Button
              size="sm" variant="secondary"
              className="bg-white/15 text-white hover:bg-white/25 border-0"
              isLoading={deleteMutation.isPending}
              onClick={() => { if (confirm('Supprimer cette dette ?')) deleteMutation.mutate(id, { onSuccess: () => router.push('/dashboard/debts-payments') }); }}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />Supprimer
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                activeTab === tab.id
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Infos */}
      {activeTab === 'infos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Debt Details */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />Détails de la dette
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Montant total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{Number(debt.totalAmount || debt.amount).toLocaleString()} FCFA</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Montant payé</p>
                  <p className="text-lg font-bold text-emerald-600">{Number(debt.amountPaid || 0).toLocaleString()} FCFA</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Reste à payer</p>
                  <p className="text-lg font-bold text-red-600">{Number((debt.totalAmount || debt.amount) - (debt.amountPaid || 0)).toLocaleString()} FCFA</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Devise</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{debt.currency || 'FCFA'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{debt.sourceType || debt.source || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Date d'échéance</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />Client
                </h4>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                    <User className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{debt.clientName || debt.client?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{debt.clientEmail || debt.client?.email || ''}</p>
                    {debt.clientPhone && <p className="text-xs text-gray-400">{debt.clientPhone}</p>}
                  </div>
                </div>
              </div>

              {/* Description */}
              {debt.description && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-sm text-gray-900 dark:text-white">{debt.description}</p>
                </div>
              )}
            </Card>

            {/* Progress Bar */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" />Progression des paiements
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{Number(debt.amountPaid || 0).toLocaleString()} FCFA payés</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{Math.round(progress * 100)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-700', progress >= 1 ? 'bg-emerald-500' : 'bg-brand')}
                    style={{ width: `${progress * 100}%` }} />
                </div>
                <p className="text-xs text-gray-400">Reste: {Number((debt.totalAmount || debt.amount) - (debt.amountPaid || 0)).toLocaleString()} FCFA</p>
              </div>
            </Card>

            {/* Payment History */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />Historique des paiements
              </h3>
              {(debt.payments || debt.paymentHistory || []).length === 0 ? (
                <div className="text-center py-6">
                  <DollarSign className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun paiement enregistré</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700 text-left text-xs text-gray-500">
                        <th className="pb-2 font-medium">Date</th>
                        <th className="pb-2 font-medium">Montant</th>
                        <th className="pb-2 font-medium">Méthode</th>
                        <th className="pb-2 font-medium">Statut</th>
                        <th className="pb-2 font-medium">Référence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(debt.payments || debt.paymentHistory || []).map((pmt: any, i: number) => (
                        <tr key={i} className="border-b border-gray-50 dark:border-gray-800">
                          <td className="py-2.5 text-gray-900 dark:text-white">{new Date(pmt.date || pmt.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td className="py-2.5 font-semibold text-gray-900 dark:text-white">{Number(pmt.amount).toLocaleString()} FCFA</td>
                          <td className="py-2.5 text-gray-600 dark:text-gray-400">{pmt.method || pmt.paymentMethod || '—'}</td>
                          <td className="py-2.5">
                            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                              pmt.status === 'COMPLETED' || pmt.status === 'PAID' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                              pmt.status === 'PENDING' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' :
                              'text-red-600 bg-red-50 dark:bg-red-900/20'
                            )}>
                              {pmt.status === 'COMPLETED' || pmt.status === 'PAID' ? 'Payé' : pmt.status === 'PENDING' ? 'En attente' : 'Échoué'}
                            </span>
                          </td>
                          <td className="py-2.5 text-xs text-gray-400">{pmt.reference || pmt.transactionId || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            {/* Quick Payment Form */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />Enregistrer un paiement
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Montant</label>
                  <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Montant..." className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Méthode</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none">
                    {paymentMethods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <Button fullWidth isLoading={paymentMutation.isPending}
                  onClick={() => {
                    if (!paymentAmount || Number(paymentAmount) <= 0) return;
                    paymentMutation.mutate({ id, data: { amount: Number(paymentAmount), method: paymentMethod } });
                    setPaymentAmount('');
                  }}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />Valider le paiement
                </Button>
              </div>
            </Card>

            {/* Key Info Card */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Informations clés</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Créée le {debt.createdAt ? new Date(debt.createdAt).toLocaleDateString('fr-FR') : '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Dernière mise à jour {debt.updatedAt ? new Date(debt.updatedAt).toLocaleDateString('fr-FR') : '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4" />
                  <span>Source: {debt.sourceType || debt.source || '—'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Relances */}
      {activeTab === 'relances' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => reminderMutation.mutate(id)} isLoading={reminderMutation.isPending} size="sm">
              <Send className="h-4 w-4 mr-1.5" />Envoyer un rappel
            </Button>
          </div>
          {(debt.reminders || []).length === 0 ? (
            <Card className="text-center py-10">
              <MessageSquare className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Aucune relance</h3>
              <p className="text-xs text-gray-500">Aucun rappel n'a encore été envoyé pour cette dette</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {(debt.reminders || []).map((rem: any, i: number) => {
                const rt = reminderTypeConfig[rem.type || rem.channel] || { label: rem.type || rem.channel || '—', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800' };
                return (
                  <Card key={i} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', rt.class)}>{rt.label}</span>
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded',
                            rem.status === 'SENT' || rem.status === 'DELIVERED' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                            rem.status === 'PENDING' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' :
                            rem.status === 'FAILED' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
                            'text-gray-500 bg-gray-100 dark:bg-gray-800'
                          )}>
                            {rem.status === 'SENT' || rem.status === 'DELIVERED' ? 'Envoyé' : rem.status === 'PENDING' ? 'En attente' : rem.status === 'FAILED' ? 'Échoué' : rem.status || '—'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white">{rem.content || rem.message || 'Aucun contenu'}</p>
                        {rem.sentAt && <p className="text-xs text-gray-400 mt-1">Envoyé le {new Date(rem.sentAt).toLocaleString('fr-FR')}</p>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Escrow */}
      {activeTab === 'escrow' && (
        <div>
          {escrowData ? (() => {
            const escrow = escrowData?.escrow || escrowData?.data || escrowData;
            return (
              <Card className="p-5 space-y-4">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4" />Escrow lié
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Montant séquestré</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{Number(escrow.amount).toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Statut</p>
                    <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full',
                      escrow.status === 'HELD' ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' :
                      escrow.status === 'RELEASED' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' :
                      escrow.status === 'DISPUTED' ? 'text-red-600 bg-red-50 dark:bg-red-900/20' :
                      'text-gray-500 bg-gray-100 dark:bg-gray-800'
                    )}>
                      {escrow.status === 'HELD' ? 'Séquestré' : escrow.status === 'RELEASED' ? 'Libéré' : escrow.status === 'DISPUTED' ? 'Contesté' : 'Remboursé'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date de création</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{escrow.createdAt ? new Date(escrow.createdAt).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date de libération</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{escrow.releasedAt ? new Date(escrow.releasedAt).toLocaleDateString('fr-FR') : '—'}</p>
                  </div>
                </div>
                {escrow.status === 'HELD' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <Button size="sm" variant="primary" onClick={() => escrowReleaseMutation.mutate(escrow.id)} isLoading={escrowReleaseMutation.isPending}>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />Libérer
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => escrowRefundMutation.mutate(escrow.id)} isLoading={escrowRefundMutation.isPending}>
                      <XCircle className="h-4 w-4 mr-1.5" />Rembourser
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => escrowDisputeMutation.mutate(escrow.id)} isLoading={escrowDisputeMutation.isPending}>
                      <AlertTriangle className="h-4 w-4 mr-1.5" />Contester
                    </Button>
                  </div>
                )}
              </Card>
            );
          })() : (
            <Card className="text-center py-10">
              <Shield className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Aucun escrow lié</h3>
              <p className="text-xs text-gray-500">Aucun compte séquestre n'est associé à cette dette</p>
            </Card>
          )}
        </div>
      )}

      {/* Tab 4: Risque Client */}
      {activeTab === 'risque' && (
        <div className="space-y-4">
          {riskData ? (() => {
            const risk = riskData?.risk || riskData?.data || riskData;
            const rl = riskLevelConfig[risk.riskLevel] || riskLevelConfig.LOW;
            return (
              <>
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />Niveau de risque
                    </h3>
                    <span className={cn('text-xs font-medium px-3 py-1 rounded-full', rl.class)}>{rl.label}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <Activity className="h-5 w-5 text-gray-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{risk.reliabilityScore ?? '—'}</p>
                      <p className="text-xs text-gray-500">Score de fiabilité</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/10 rounded-xl">
                      <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                      <p className="text-lg font-bold text-red-600">{risk.latePaymentCount ?? 0}</p>
                      <p className="text-xs text-red-500">Paiements en retard</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                      <XCircle className="h-5 w-5 text-purple-500 mx-auto mb-2" />
                      <p className="text-lg font-bold text-purple-600">{risk.disputeCount ?? 0}</p>
                      <p className="text-xs text-purple-500">Contestations</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-3">Analyse du risque</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {risk.analysis || risk.comment || "Aucune analyse détaillée disponible pour ce client."}
                  </p>
                </Card>
                <Link href="/dashboard/clients">
                  <Button variant="secondary">
                    <User className="h-4 w-4 mr-1.5" />Voir la gestion des risques clients
                  </Button>
                </Link>
              </>
            );
          })() : (
            <Card className="text-center py-10">
              <AlertTriangle className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Aucune donnée de risque</h3>
              <p className="text-xs text-gray-500">Les informations de risque ne sont pas disponibles pour ce client</p>
            </Card>
          )}
        </div>
      )}

      {/* Footer Actions */}
      {debt.status !== 'SETTLED' && debt.status !== 'CANCELLED' && (
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="sm"
              isLoading={settleMutation.isPending}
              onClick={() => settleMutation.mutate({ id, data: { status: 'SETTLED' } })}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />Marquer comme réglée
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Priorité:</span>
              <select
                value={newPriority || debt.priority || 'LOW'}
                onChange={(e) => { setNewPriority(e.target.value); priorityMutation.mutate({ id, priority: e.target.value }); }}
                className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
              >
                <option value="LOW">Basse</option>
                <option value="MEDIUM">Moyenne</option>
                <option value="HIGH">Haute</option>
                <option value="CRITICAL">Critique</option>
              </select>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
