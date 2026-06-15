'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet, DollarSign, AlertTriangle, Clock,
  Plus, Search, Eye,
  Zap, CheckCircle2,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useDebts, usePaymentStats } from '@/features/hooks';

interface DebtItem {
  id: string; clientName: string; clientEmail: string;
  amount: number; dueDate: string; description: string;
  status: string; priority: string; paidAmount: number;
  createdAt: string;
}

type TabType = 'all' | 'pending' | 'overdue' | 'paid' | 'cancelled';

const statusConfig: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'En attente', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  OVERDUE: { label: 'En retard', class: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  PAID: { label: 'Payé', class: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  CANCELLED: { label: 'Annulé', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
};

const priorityConfig: Record<string, { label: string; class: string }> = {
  LOW: { label: 'Basse', class: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
  MEDIUM: { label: 'Moyenne', class: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  HIGH: { label: 'Haute', class: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
};

export default function DebtsPaymentsPage() {
  const { data: debtsData, isLoading, error, refetch } = useDebts();
  const { data: statsData } = usePaymentStats();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allDebts: DebtItem[] = useMemo(() => {
    return Array.isArray(debtsData) ? debtsData : (debtsData?.debts || debtsData?.data || []);
  }, [debtsData]);

  const stats = useMemo(() => statsData || {
    total: allDebts.length,
    pending: allDebts.filter(d => d.status === 'PENDING').length,
    overdue: allDebts.filter(d => d.status === 'OVERDUE').length,
    paid: allDebts.filter(d => d.status === 'PAID').reduce((a, d) => a + d.amount, 0),
  }, [statsData, allDebts]);

  const filtered = useMemo(() => {
    let f = [...allDebts];
    switch (activeTab) {
      case 'pending': f = f.filter(d => d.status === 'PENDING'); break;
      case 'overdue': f = f.filter(d => d.status === 'OVERDUE'); break;
      case 'paid': f = f.filter(d => d.status === 'PAID'); break;
      case 'cancelled': f = f.filter(d => d.status === 'CANCELLED'); break;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(d => d.clientName?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q) || d.clientEmail?.toLowerCase().includes(q));
    }
    return f;
  }, [allDebts, activeTab, searchQuery]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Clock className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Dettes & Paiements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Suivez et gérez les dettes clients</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/debts-payments/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouvelle dette</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Wallet className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total dettes" value={stats.total} />
        <StatsCard icon={<Clock className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="En attente" value={stats.pending} />
        <StatsCard icon={<AlertTriangle className="h-5 w-5" />} iconBg="bg-red-50" iconColor="text-red-600" label="En retard" value={stats.overdue} />
        <StatsCard icon={<DollarSign className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Montant payé" value={`${Number(stats.paid).toLocaleString()} FCFA`} />
      </div>

      {/* Suggestions intelligentes */}
      {allDebts.length > 0 && (() => {
        const overdue = allDebts.filter(d => d.status === 'OVERDUE');
        const pending = allDebts.filter(d => d.status === 'PENDING');
        const paid = allDebts.filter(d => d.status === 'PAID');
        const highPriority = allDebts.filter(d => d.priority === 'HIGH');
        const totalRemaining = allDebts.reduce((a, d) => a + (d.amount - (d.paidAmount || 0)), 0);

        const suggestions = [
          overdue.length > 0 && {
            type: 'overdue', icon: AlertTriangle,
            title: `${overdue.length} créance${overdue.length > 1 ? 's' : ''} en retard`,
            desc: 'Relancez les clients pour récupérer les fonds',
            color: 'red',
          },
          pending.length > 0 && {
            type: 'pending', icon: Clock,
            title: `${pending.length} créance${pending.length > 1 ? 's' : ''} en attente`,
            desc: 'À suivre avant la date d\'échéance',
            color: 'amber',
          },
          highPriority.length > 0 && {
            type: 'high_priority', icon: Zap,
            title: `${highPriority.length} créance${highPriority.length > 1 ? 's' : ''} haute priorité`,
            desc: 'Action urgente requise',
            color: 'purple',
          },
          paid.length > 0 && {
            type: 'paid', icon: CheckCircle2,
            title: `${paid.length} créance${paid.length > 1 ? 's' : ''} payée${paid.length > 1 ? 's' : ''}`,
            desc: `${Number(stats.paid).toLocaleString()} FCFA encaissés au total`,
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
              <Link key={i} href={s.link || '/dashboard/debts-payments'}
                className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${colorMap[s.color]} border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200`}>
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm shrink-0">
                  <s.icon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        );
      })()}


      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {(['all', 'pending', 'overdue', 'paid', 'cancelled'] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === tab ? 'bg-brand text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}>
              {tab === 'all' ? 'Toutes' : tab === 'pending' ? 'En attente' : tab === 'overdue' ? 'En retard' : tab === 'paid' ? 'Payées' : 'Annulées'}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un client..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Wallet className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucune dette trouvée</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre première dette'}
          </p>
          <Link href="/dashboard/debts-payments/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouvelle dette</Button></Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}
    </div>
  );
}

function getBadge(debt: DebtItem): { label: string; class: string } | null {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (debt.priority === 'HIGH') {
    return { label: '🔴 Prioritaire', class: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300' };
  }
  if (debt.createdAt && new Date(debt.createdAt) > thirtyDaysAgo) {
    return { label: '🆕 Nouveau', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' };
  }
  return null;
}

function DebtCard({ debt }: { debt: DebtItem }) {
  const due = debt.dueDate ? new Date(debt.dueDate) : null;
  const badge = getBadge(debt);
  return (
    <Link href={`/dashboard/debts-payments/${debt.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="p-4 space-y-3">
        {badge && (
          <div className="flex justify-end -mb-2">
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{badge.label}</span>
          </div>
        )}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-brand" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{debt.clientName}</h3>
              <p className="text-xs text-gray-500">{debt.clientEmail}</p>
            </div>
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', priorityConfig[debt.priority]?.class || '')}>
            {priorityConfig[debt.priority]?.label || debt.priority}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{Number(debt.amount).toLocaleString()} FCFA</span>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusConfig[debt.status]?.class || '')}>
            {statusConfig[debt.status]?.label || debt.status}
          </span>
        </div>

        {debt.paidAmount > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <DollarSign className="h-3 w-3" />
            Payé: {Number(debt.paidAmount).toLocaleString()} FCFA
          </div>
        )}

        {due && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            Échéance: {due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        )}

        {debt.description && (
          <p className="text-xs text-gray-400 line-clamp-1">{debt.description}</p>
        )}

        <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="h-3.5 w-3.5 text-brand" />
          <span className="text-xs text-brand font-medium">Voir les détails</span>
        </div>
      </div>
    </Link>
  );
}

function User({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
