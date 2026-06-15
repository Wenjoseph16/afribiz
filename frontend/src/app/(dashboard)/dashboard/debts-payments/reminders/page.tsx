'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bell, Clock, CheckCircle2, XCircle, AlertTriangle, FileText, Loader, Send, History, DollarSign, Mail, MessageSquare, Smartphone, Search, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';
import { useDebtReminders, useDebtLogs } from '@/features/hooks';

const REMINDER_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  DUE_DATE: { label: 'Échéance', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  OVERDUE: { label: 'Retard', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  PAYMENT_CONFIRMATION: { label: 'Confirmation', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  CRITICAL_DEBT: { label: 'Dette critique', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  WHATSAPP: { label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
  SMS: { label: 'SMS', icon: Smartphone, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
  PUSH: { label: 'Push', icon: Bell, color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
  EMAIL: { label: 'Email', icon: Mail, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SENT: { label: 'Envoyé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  FAILED: { label: 'Échoué', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

const LOG_ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PAYMENT_RECEIVED: { label: 'Paiement reçu', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  DEBT_CREATED: { label: 'Dette créée', icon: DollarSign, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  DEBT_SETTLED: { label: 'Dette soldée', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  ESCROW_RELEASED: { label: 'Fonds libérés', icon: Send, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  REFUND_ISSUED: { label: 'Remboursement', icon: DollarSign, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  REMINDER_SENT: { label: 'Rappel envoyé', icon: Bell, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  DEBT_UPDATED: { label: 'Dette mise à jour', icon: FileText, color: 'text-gray-600 bg-gray-50 dark:bg-gray-800' },
  ESCROW_HELD: { label: 'Fonds bloqués', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  ESCROW_REFUNDED: { label: 'Remboursement escrow', icon: DollarSign, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
  ESCROW_DISPUTED: { label: 'Litige escrow', icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  RISK_UPDATED: { label: 'Risque mis à jour', icon: AlertTriangle, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
};

function RemindersTab() {
  const [channelFilter, setChannelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const params = { limit: 100, channel: channelFilter !== 'all' ? channelFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined };
  const { data, isLoading, isError, refetch } = useDebtReminders(params);

  const reminders: any[] = Array.isArray(data) ? data : (data?.reminders || data?.items || []);

  if (isLoading) return <div className="flex items-center justify-center min-h-[300px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  if (isError) return <ErrorState onRetry={() => refetch()} message="Impossible de charger les relances." />;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Canal</label>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setChannelFilter('all')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  channelFilter === 'all' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}>Tous</button>
              {Object.entries(CHANNEL_CONFIG).map(([key, ch]) => {
                const Icon = ch.icon;
                return (
                  <button key={key} onClick={() => setChannelFilter(key)}
                    className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                      channelFilter === key ? ch.color + ' ring-2 ring-offset-1' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}><Icon className="w-3.5 h-3.5" />{ch.label}</button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Statut</label>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setStatusFilter('all')}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  statusFilter === 'all' ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}>Tous</button>
              {Object.entries(STATUS_CONFIG).map(([key, s]) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    statusFilter === key ? s.color + ' ring-2 ring-offset-1' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}>{s.label}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {reminders.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune relance trouvée</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {reminders.map((reminder: any) => {
            const typeCfg = REMINDER_TYPE_CONFIG[reminder.type] || REMINDER_TYPE_CONFIG.DUE_DATE;
            const channelCfg = CHANNEL_CONFIG[reminder.channel] || CHANNEL_CONFIG.WHATSAPP;
            const statusCfg = STATUS_CONFIG[reminder.status] || STATUS_CONFIG.PENDING;
            const ChannelIcon = channelCfg.icon;
            return (
              <Card key={reminder.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">#{reminder.debtId?.slice(0, 8) || reminder.id?.slice(0, 8)}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', typeCfg.color)}>{typeCfg.label}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium', statusCfg.color)}>{statusCfg.label}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 line-clamp-2">{reminder.content || reminder.message || '—'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><ChannelIcon className="w-3.5 h-3.5" />{channelCfg.label}</span>
                      {reminder.sentAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(reminder.sentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {reminder.status === 'PENDING' && <Clock className="w-4 h-4 text-amber-500" />}
                    {reminder.status === 'SENT' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {reminder.status === 'FAILED' && <XCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FinancialLogsTab() {
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useDebtLogs({ limit: 100 });

  const logs: any[] = Array.isArray(data) ? data : (data?.logs || data?.items || []);

  const filtered = search
    ? logs.filter((l: any) => {
        const q = search.toLowerCase();
        return (l.description || '').toLowerCase().includes(q) || (l.action || '').toLowerCase().includes(q);
      })
    : logs;

  if (isLoading) return <div className="flex items-center justify-center min-h-[300px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  if (isError) return <ErrorState onRetry={() => refetch()} message="Impossible de charger l'historique." />;

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par description..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <History className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune opération trouvée</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((log: any) => {
            const actionCfg = LOG_ACTION_CONFIG[log.action] || { label: log.action || 'Action', icon: FileText, color: 'text-gray-500 bg-gray-50 dark:bg-gray-800' };
            const Icon = actionCfg.icon;
            return (
              <Card key={log.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', actionCfg.color)}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{actionCfg.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{log.description || '—'}</p>
                        {log.amount != null && (
                          <p className="text-xs font-semibold text-brand mt-0.5">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: log.currency || 'XOF' }).format(Number(log.amount))}
                          </p>
                        )}
                        {log.user && <p className="text-[10px] text-gray-400 mt-0.5">Par {log.user}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-400">
                          {new Date(log.createdAt || log.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(log.createdAt || log.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DebtsPaymentsRemindersPage() {
  const [activeTab, setActiveTab] = useState<'reminders' | 'logs'>('reminders');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Relances & Historique"
        description="Suivez les relances de dettes et l'historique des opérations financières"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Dettes & Paiements', href: '/dashboard/debts-payments' },
          { label: 'Relances' },
        ]}
      />

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1 flex gap-1">
        <button onClick={() => setActiveTab('reminders')}
          className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
            activeTab === 'reminders' ? 'bg-brand text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}>
          <Bell className="w-4 h-4" />
          Relances
        </button>
        <button onClick={() => setActiveTab('logs')}
          className={cn('flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
            activeTab === 'logs' ? 'bg-brand text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}>
          <History className="w-4 h-4" />
          Historique financier
        </button>
      </div>

      {activeTab === 'reminders' ? <RemindersTab /> : <FinancialLogsTab />}
    </div>
  );
}
