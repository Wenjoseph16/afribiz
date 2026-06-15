'use client';

import { useState } from 'react';
import { FileText, Loader, Clock, DollarSign, Shield, User, AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useDebtLogs } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const ACTION_LABELS: Record<string, string> = {
  DEBT_CREATED: 'Dette créée',
  DEBT_UPDATED: 'Dette mise à jour',
  PAYMENT_RECEIVED: 'Paiement reçu',
  DEBT_SETTLED: 'Dette soldée',
  REMINDER_SENT: 'Rappel envoyé',
  ESCROW_HELD: 'Fonds bloqués',
  ESCROW_RELEASED: 'Fonds libérés',
  ESCROW_REFUNDED: 'Remboursement escrow',
  ESCROW_DISPUTED: 'Litige escrow',
  RISK_UPDATED: 'Risque client mis à jour',
};

const ACTION_ICONS: Record<string, any> = {
  DEBT_CREATED: DollarSign,
  DEBT_UPDATED: FileText,
  PAYMENT_RECEIVED: CheckCircle2,
  DEBT_SETTLED: CheckCircle2,
  REMINDER_SENT: Send,
  ESCROW_HELD: Shield,
  ESCROW_RELEASED: Shield,
  ESCROW_REFUNDED: DollarSign,
  ESCROW_DISPUTED: AlertTriangle,
  RISK_UPDATED: User,
};

export default function FinanceHistoryPage() {
  const [actionFilter, setActionFilter] = useState('all');

  const params = { limit: 100, action: actionFilter !== 'all' ? actionFilter : undefined };
  const { data, isLoading } = useDebtLogs(params);

  const logs: any[] = Array.isArray(data) ? data : (data?.logs || data?.items || []);

  const actionTypes = ['all', ...new Set(logs.map((l: any) => l.action))];

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historique financier</h1>
        <p className="text-sm text-gray-500">Toutes les actions financières tracées</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><FileText className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Total actions</p><p className="text-sm font-bold">{logs.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Paiements</p><p className="text-sm font-bold">{logs.filter((l: any) => l.action === 'PAYMENT_RECEIVED').length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><DollarSign className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Dettes</p><p className="text-sm font-bold">{logs.filter((l: any) => l.action?.startsWith('DEBT')).length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><Shield className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Escrow</p><p className="text-sm font-bold">{logs.filter((l: any) => l.action?.startsWith('ESCROW')).length}</p></div></div></Card>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-1 overflow-x-auto flex-wrap">
          {actionTypes.slice(0, 10).map((action: string) => (
            <button key={action} onClick={() => setActionFilter(action)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                actionFilter === action ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>{action === 'all' ? 'Toutes' : ACTION_LABELS[action] || action}</button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {logs.length === 0 ? (
        <Card className="text-center py-12"><Clock className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucune action enregistrée</p></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log: any) => {
            const Icon = ACTION_ICONS[log.action] || FileText;
            const meta = log.metadata || {};
            return (
              <Card key={log.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-brand" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ACTION_LABELS[log.action] || log.action}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{log.description || '—'}</p>
                        {log.amount && <p className="text-xs font-medium text-brand mt-0.5">{formatPrice(Number(log.amount))}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-[10px] text-gray-400">{new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
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
