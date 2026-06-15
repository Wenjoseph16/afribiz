'use client';

import { useState } from 'react';
import {
  TrendingUp, DollarSign, Percent, CreditCard, Shield,
  ChevronDown, Calendar, ArrowUp, ArrowDown,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const PERIODS = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
  { value: '1y', label: '1 an' },
  { value: 'all', label: 'Tout' },
];

function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

export default function AdminRevenuePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');
  const [period, setPeriod] = useState('30d');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'revenue', period],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/revenue/stats?period=${period}`);
      return res.data.data;
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold">Revenus</h1>
        <EmptyState icon={<Shield className="h-8 w-8" />} title="Accès réservé" description="Administrateurs uniquement." />
      </div>
    );
  }

  if (isLoading) return <Loader className="py-20" />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Revenus plateforme</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Commissions, abonnements et publicités</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                period === p.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-brand mb-1">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Total</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCFA(stats?.totalRevenue || 0)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Percent className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Transactions</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCFA(stats?.transactionCommissions || 0)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Escrow</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCFA(stats?.escrowCommissions || 0)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-1">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Modules</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCFA(stats?.developerModuleCommissions || 0)}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Calendar className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Transactions</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalTransactions || 0}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-rose-500 mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Escrows</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalEscrows || 0}</p>
        </Card>
      </div>

      {/* Revenue breakdown chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Répartition mensuelle des commissions</h3>
          {stats?.monthlyBreakdown?.length > 0 ? (
            <div className="space-y-2">
              {stats.monthlyBreakdown.slice(-12).reverse().map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-gray-500 dark:text-gray-400 w-16 shrink-0">{item.month}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.type === 'Transactions' ? 'bg-emerald-400' :
                        item.type === 'Escrow' ? 'bg-blue-400' : 'bg-purple-400'
                      }`}
                      style={{ width: `${Math.min((item.revenue / Math.max(...stats.monthlyBreakdown.map((m: any) => m.revenue), 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{item.type.slice(0, 4)}</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 w-24 text-right">{formatCFA(item.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">Aucune commission enregistrée sur cette période</p>
          )}
        </Card>

        {/* Top businesses */}
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Top commerces</h3>
          {stats?.topBusinesses?.length > 0 ? (
            <div className="space-y-3">
              {stats.topBusinesses.slice(0, 5).map((biz: any, i: number) => (
                <div key={biz.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{biz.name}</p>
                    <p className="text-xs text-gray-400">{biz.transactions} transactions</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCFA(biz.revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-8 text-center">Aucune donnée</p>
          )}
        </Card>
      </div>

      {/* Daily activity */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Activité des 30 derniers jours</h3>
        {stats?.dailyStats?.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="flex gap-1 h-24 items-end min-w-[600px]">
              {stats.dailyStats.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-0.5">
                  <div className="w-full flex flex-col items-center" style={{ height: '100%' }}>
                    <div
                      className="w-full bg-emerald-400 rounded-t opacity-70"
                      style={{ height: `${Math.min((d.transactions / Math.max(...stats.dailyStats.map((x: any) => x.transactions), 1)) * 80, 80)}%` }}
                    />
                    <div
                      className="w-full bg-blue-400 rounded-t opacity-70"
                      style={{ height: `${Math.min((d.escrows / Math.max(...stats.dailyStats.map((x: any) => x.escrows), 1)) * 80, 80)}%` }}
                    />
                  </div>
                  {i % 5 === 0 && (
                    <span className="text-[10px] text-gray-400 mt-1">{d.date.slice(5)}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> Transactions</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400" /> Escrows</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 py-8 text-center">Aucune activité récente</p>
        )}
      </Card>
    </div>
  );
}
