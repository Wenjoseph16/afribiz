'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, CreditCard, Clock, CheckCircle2, AlertTriangle, Loader, User, Phone, Search, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useDebts } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const STATUS_CONFIG: Record<string, { label: string; variant: 'warning' | 'danger' | 'success' | 'info' | 'default'; color: string }> = {
  ACTIVE: { label: 'Active', variant: 'warning', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PARTIALLY_PAID: { label: 'Partielle', variant: 'info', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  SETTLED: { label: 'Réglée', variant: 'success', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  OVERDUE: { label: 'En retard', variant: 'danger', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CRITICAL: { label: 'Critique', variant: 'danger', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
  DISPUTE: { label: 'Litige', variant: 'danger', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  CANCELLED: { label: 'Annulée', variant: 'default', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: 'Faible', color: 'text-gray-500' },
  MEDIUM: { label: 'Moyenne', color: 'text-amber-600' },
  HIGH: { label: 'Élevée', color: 'text-orange-600' },
  CRITICAL: { label: 'Critique', color: 'text-red-600' },
};

export default function FinanceDebtsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const { data: debtsData, isLoading } = useDebts({ limit: 100 });

  const allDebts = Array.isArray(debtsData) ? debtsData : (debtsData?.debts || debtsData?.data || []);
  const stats = {
    total: allDebts.length,
    active: allDebts.filter((d: any) => ['ACTIVE', 'PARTIALLY_PAID'].includes(d.status)).length,
    overdue: allDebts.filter((d: any) => d.status === 'OVERDUE' || d.status === 'CRITICAL').length,
    settled: allDebts.filter((d: any) => d.status === 'SETTLED').length,
    totalAmount: allDebts.reduce((s: number, d: any) => s + Number(d.totalAmount || 0), 0),
    totalRemaining: allDebts.reduce((s: number, d: any) => s + Number(d.remainingAmount || 0), 0),
  };

  const filtered = allDebts.filter((d: any) => {
    if (filter !== 'all' && d.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const buyer = d.buyer || {};
      return (buyer.firstName || '').toLowerCase().includes(q) ||
        (buyer.lastName || '').toLowerCase().includes(q) ||
        (buyer.phone || '').toLowerCase().includes(q) ||
        (d.notes || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/finance" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dettes & Paiements</h1>
          <p className="text-sm text-gray-500">Gérez les dettes clients, paiements partiels et soldes</p>
        </div>

      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><DollarSign className="w-4 h-4 text-brand" /></div>
            <div><p className="text-[10px] text-gray-500">Total dû</p><p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalAmount)}</p></div></div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-100"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
            <div><p className="text-[10px] text-gray-500">Restant</p><p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(stats.totalRemaining)}</p></div></div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></div>
            <div><p className="text-[10px] text-gray-500">Actives</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.active}</p></div></div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-red-100"><AlertTriangle className="w-4 h-4 text-red-600" /></div>
            <div><p className="text-[10px] text-gray-500">Retard</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.overdue}</p></div></div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
            <div><p className="text-[10px] text-gray-500">Réglées</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.settled}</p></div></div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><CreditCard className="w-4 h-4 text-blue-600" /></div>
            <div><p className="text-[10px] text-gray-500">Total</p><p className="text-sm font-bold text-gray-900 dark:text-white">{stats.total}</p></div></div>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { key: 'all', label: 'Toutes' }, { key: 'ACTIVE', label: 'Actives' },
            { key: 'PARTIALLY_PAID', label: 'Partielles' }, { key: 'OVERDUE', label: 'En retard' },
            { key: 'CRITICAL', label: 'Critiques' }, { key: 'SETTLED', label: 'Réglées' },
            { key: 'DISPUTE', label: 'Litiges' },
          ].map(t => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === t.key ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>{t.label}</button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par client, téléphone..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {/* Debt List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12"><DollarSign className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucune dette trouvée</p></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((debt: any) => {
            const s = STATUS_CONFIG[debt.status] || STATUS_CONFIG.ACTIVE;
            const prio = PRIORITY_CONFIG[debt.priority] || null;
            const buyer = debt.buyer || {};
            const remaining = Number(debt.remainingAmount || debt.totalAmount || 0);
            const total = Number(debt.totalAmount || 0);
            const progress = total > 0 ? ((total - remaining) / total * 100) : 0;
            const isOverdue = debt.dueDate && new Date(debt.dueDate) < new Date() && debt.status !== 'SETTLED';
            return (
              <Link key={debt.id} href={`/dashboard/finance/debts/${debt.id}`} className="block">
                <Card className={cn('p-4 hover:shadow-md transition-all group cursor-pointer', isOverdue && 'ring-1 ring-red-200 dark:ring-red-800')}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {buyer.firstName || buyer.lastName ? `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() : 'Client'}
                        </h3>
                        <Badge variant={s.variant} size="xs">{isOverdue ? 'EN RETARD' : s.label}</Badge>
                        {prio && <span className={cn('text-[10px] font-medium', prio.color)}>{prio.label}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        {buyer.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{buyer.phone}</span>}
                        {debt.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Échéance: {new Date(debt.dueDate).toLocaleDateString('fr-FR')}</span>}
                        {debt.sourceType && <span>Source: {debt.sourceType}</span>}
                      </div>

                      {/* Progress bar */}
                      {debt.status !== 'SETTLED' && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Remboursement</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{formatPrice(total - remaining)} / {formatPrice(total)}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all', debt.status === 'SETTLED' ? 'bg-emerald-500' : 'bg-amber-500')}
                              style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(remaining)}</p>
                        <p className="text-[10px] text-gray-400">sur {formatPrice(total)}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-brand transition-colors" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}
