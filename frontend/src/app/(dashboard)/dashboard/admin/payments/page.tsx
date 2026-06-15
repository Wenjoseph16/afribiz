'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';
import {
  DollarSign, CreditCard, Shield, AlertTriangle, Banknote,
  TrendingUp, Users, Clock, CheckCircle,
  Wallet, Receipt, Activity, PieChart,
  AlertCircle, UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type FinanceTab = 'overview' | 'transactions' | 'escrows' | 'fraud' | 'debts';

const tabs: { id: FinanceTab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: PieChart },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'escrows', label: 'Escrows', icon: Shield },
  { id: 'fraud', label: 'Alertes fraude', icon: AlertTriangle },
  { id: 'debts', label: 'Recouvrement', icon: TrendingUp },
];

function useAdminFinanceOverview() {
  return useQuery({
    queryKey: ['admin', 'finance', 'overview'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/finance/overview');
      return res.data.data;
    },
  });
}

function useAdminTransactions(params?: { page?: number; limit?: number; status?: string; provider?: string }) {
  return useQuery({
    queryKey: ['admin', 'finance', 'transactions', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/finance/transactions', { params });
      return res.data.data;
    },
  });
}

function useAdminEscrows(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['admin', 'finance', 'escrows', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/finance/escrows', { params });
      return res.data.data;
    },
  });
}

function useAdminFraudAlerts() {
  return useQuery({
    queryKey: ['admin', 'finance', 'fraud'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/finance/fraud-alerts');
      return res.data.data;
    },
  });
}

function useAdminDebtRecovery() {
  return useQuery({
    queryKey: ['admin', 'finance', 'debts'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/finance/debt-recovery');
      return res.data.data;
    },
  });
}

export default function AdminFinancePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [txPage, setTxPage] = useState(1);
  const [escrowPage, setEscrowPage] = useState(1);
  const [txStatus, setTxStatus] = useState('');
  const [escrowStatus, setEscrowStatus] = useState('');

  const { data: overview, isLoading: overviewLoading } = useAdminFinanceOverview();
  const { data: txData, isLoading: txLoading } = useAdminTransactions({ page: txPage, limit: 15, status: txStatus || undefined });
  const { data: escrowData, isLoading: escrowLoading } = useAdminEscrows({ page: escrowPage, limit: 15, status: escrowStatus || undefined });
  const { data: fraudData, isLoading: fraudLoading } = useAdminFraudAlerts();
  const { data: debtData, isLoading: debtLoading } = useAdminDebtRecovery();

  if (!user?.roles?.includes('ADMIN')) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Administration financière
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  const severityIcons: Record<string, any> = {
    HIGH: AlertCircle,
    MEDIUM: AlertTriangle,
    LOW: Clock,
  };

  const formatAmount = (val: number) => `${Number(val).toLocaleString()} FCFA`;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';

  const escrowStatusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    HELD: 'warning',
    RELEASED: 'success',
    DISPUTED: 'danger',
    REFUNDED: 'info',
  };

  const txStatusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
    SUCCESS: 'success',
    PENDING: 'warning',
    FAILED: 'danger',
    REFUNDED: 'info',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Administration financière
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Supervision des transactions, escrows, alertes et recouvrement
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        overviewLoading ? <Loader className="py-12" /> : !overview ? (
          <EmptyState icon={<PieChart className="h-8 w-8" />} title="Aucune donnée" description="Impossible de charger les statistiques financières." />
        ) : (
          <div className="space-y-6">
            {/* Revenue & Transactions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatAmount(overview.revenue?.total30d || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Revenu (30j)</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatAmount(overview.revenue?.fees30d || 0)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Commission (30j)</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overview.transactions?.total || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Transactions total</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overview.transactions?.pending || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Escrows & Debts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overview.escrows?.active || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Escrows actifs</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">{formatAmount(overview.escrows?.totalHeld || 0)}</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overview.escrows?.disputes || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Litiges escrow</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overview.debts?.active || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dettes actives</p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">{formatAmount(overview.debts?.totalOwed || 0)}</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overview.debts?.overdue || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dettes impayées</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Risks */}
            <Card padding="md">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Risques clients
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50">
                  <p className="text-lg font-bold text-red-700 dark:text-red-400">{overview.risks?.highRisk || 0}</p>
                  <p className="text-xs text-red-600 dark:text-red-300">Risque élevé / critique</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700">
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{overview.risks?.blacklisted || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clients blacklistés</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50">
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                    {overview.escrows?.active > 0 || overview.debts?.active > 0 ? '⚠️ Actif' : '✅ OK'}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">État général</p>
                </div>
              </div>
            </Card>
          </div>
        )
      )}

      {/* TAB: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {['', 'SUCCESS', 'PENDING', 'FAILED', 'REFUNDED'].map((s) => (
              <button
                key={s}
                onClick={() => { setTxStatus(s); setTxPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  txStatus === s
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {s ? (s === 'SUCCESS' ? 'Succès' : s === 'PENDING' ? 'En attente' : s === 'FAILED' ? 'Échec' : 'Remboursé') : 'Tous'}
              </button>
            ))}
          </div>

          {txLoading ? <Loader className="py-12" /> : !txData?.transactions?.length ? (
            <EmptyState icon={<Receipt className="h-8 w-8" />} title="Aucune transaction" description="Aucune transaction trouvée." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Business</th>
                    <th className="p-3 font-medium">Montant</th>
                    <th className="p-3 font-medium">Fournisseur</th>
                    <th className="p-3 font-medium">Frais</th>
                    <th className="p-3 font-medium">Statut</th>
                    <th className="p-3 font-medium">Réf.</th>
                  </tr>
                </thead>
                <tbody>
                  {txData.transactions.map((tx: any) => (
                    <tr key={tx.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-3 text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                      <td className="p-3 text-gray-900 dark:text-gray-100">{tx.businessName || '-'}</td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatAmount(tx.amount)}</td>
                      <td className="p-3"><Badge variant="default" size="xs">{tx.provider || '-'}</Badge></td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{formatAmount(tx.fee || 0)}</td>
                      <td className="p-3"><Badge variant={txStatusColors[tx.status] || 'default'} size="xs">{tx.status}</Badge></td>
                      <td className="p-3"><span className="text-xs font-mono text-gray-500">{tx.providerRef?.slice(0, 12) || '-'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {txData && txData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {txData.page} sur {txData.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={txPage <= 1} onClick={() => setTxPage(p => Math.max(1, p - 1))}>Précédent</Button>
                <Button variant="secondary" size="sm" disabled={txPage >= (txData.totalPages || 1)} onClick={() => setTxPage(p => p + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: ESCROWS */}
      {activeTab === 'escrows' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {['', 'HELD', 'RELEASED', 'DISPUTED', 'REFUNDED'].map((s) => (
              <button
                key={s}
                onClick={() => { setEscrowStatus(s); setEscrowPage(1); }}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  escrowStatus === s
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {s || 'Tous'}
              </button>
            ))}
          </div>

          {escrowLoading ? <Loader className="py-12" /> : !escrowData?.escrows?.length ? (
            <EmptyState icon={<Shield className="h-8 w-8" />} title="Aucun escrow" description="Aucun escrow trouvé." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Business</th>
                    <th className="p-3 font-medium">Montant</th>
                    <th className="p-3 font-medium">Statut</th>
                    <th className="p-3 font-medium">Litige</th>
                    <th className="p-3 font-medium">Libéré le</th>
                  </tr>
                </thead>
                <tbody>
                  {escrowData.escrows.map((e: any) => (
                    <tr key={e.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="p-3 text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatDate(e.createdAt)}</td>
                      <td className="p-3 text-gray-900 dark:text-gray-100">{e.businessName || '-'}</td>
                      <td className="p-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatAmount(e.amount)}</td>
                      <td className="p-3"><Badge variant={escrowStatusColors[e.status] || 'default'} size="xs">{e.status}</Badge></td>
                      <td className="p-3">{e.disputeReason ? <span className="text-xs text-red-600">{e.disputeReason.slice(0, 30)}</span> : '-'}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">{e.releasedAt ? formatDate(e.releasedAt) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {escrowData && escrowData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {escrowData.page} sur {escrowData.totalPages}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={escrowPage <= 1} onClick={() => setEscrowPage(p => Math.max(1, p - 1))}>Précédent</Button>
                <Button variant="secondary" size="sm" disabled={escrowPage >= (escrowData.totalPages || 1)} onClick={() => setEscrowPage(p => p + 1)}>Suivant</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: FRAUD ALERTS */}
      {activeTab === 'fraud' && (
        fraudLoading ? <Loader className="py-12" /> : !fraudData?.alerts?.length ? (
          <EmptyState icon={<Shield className="h-8 w-8" />} title="Aucune alerte" description="Aucune alerte de fraude détectée." />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{fraudData.total} alerte{fraudData.total !== 1 ? 's' : ''} détectée{fraudData.total !== 1 ? 's' : ''}</p>
            {fraudData.alerts.map((alert: any, i: number) => {
              const SevIcon = severityIcons[alert.severity] || AlertTriangle;
              return (
                <div key={i} className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2 rounded-lg', alert.severity === 'HIGH' ? 'bg-red-50 text-red-600' : alert.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600')}>
                      <SevIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {alert.type?.replace(/_/g, ' ')}
                        </span>
                        <Badge variant={alert.severity === 'HIGH' ? 'danger' : alert.severity === 'MEDIUM' ? 'warning' : 'info'} size="xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{alert.reason}</p>
                      {alert.client && (
                        <p className="text-xs text-gray-500 mt-0.5">{alert.client.firstName} {alert.client.lastName} · {alert.client.email}</p>
                      )}
                      {alert.amount && <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5">{formatAmount(alert.amount)}</p>}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">{formatDate(alert.createdAt)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* TAB: DEBT RECOVERY */}
      {activeTab === 'debts' && (
        debtLoading ? <Loader className="py-12" /> : !debtData ? (
          <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="Aucune donnée" description="Impossible de charger les statistiques de recouvrement." />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card padding="md">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total dettes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{debtData.totalDebts || 0}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dettes soldées</p>
                <p className="text-2xl font-bold text-emerald-600">{debtData.settledDebts || 0}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Montant total dû</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatAmount(debtData.totalDebtAmount || 0)}</p>
              </Card>
              <Card padding="md">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Montant recouvré</p>
                <p className="text-2xl font-bold text-brand">{formatAmount(debtData.recoveredAmount || 0)}</p>
              </Card>
            </div>

            {/* Recovery rate bar */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Taux de recouvrement
                </h3>
                <span className={cn(
                  'text-lg font-bold',
                  (debtData.recoveryRate || 0) >= 50 ? 'text-emerald-600' : 'text-amber-600'
                )}>
                  {debtData.recoveryRate || 0}%
                </span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    (debtData.recoveryRate || 0) >= 50 ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(100, debtData.recoveryRate || 0)}%` }}
                />
              </div>
            </Card>

            {/* Top debtors */}
            {debtData.topDebtors?.length > 0 && (
              <Card padding="md" title="Top débiteurs" titleIcon={<UserX className="h-4 w-4" />}>
                <div className="space-y-2">
                  {debtData.topDebtors.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">{d.buyerId?.slice(0, 12)}</span>
                      </div>
                      <span className="text-sm font-semibold text-red-600">{formatAmount(d._sum?.remainingAmount || 0)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )
      )}
    </div>
  );
}
