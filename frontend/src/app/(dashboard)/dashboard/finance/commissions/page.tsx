'use client';

import { useState } from 'react';
import { Percent, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

export default function BusinessCommissionsPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState('30d');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['business', 'commissions', period],
    queryFn: async () => {
      const res = await apiClient.get('/business/finance/stats?period=' + period);
      return res.data.data;
    },
    enabled: !!user,
  });

  const { data: logs } = useQuery({
    queryKey: ['business', 'financial-logs', 'MANUAL_ADJUSTMENT'],
    queryFn: async () => {
      const res = await apiClient.get('/payments/logs?action=MANUAL_ADJUSTMENT&limit=50');
      return res.data.data?.logs || [];
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Revenus & Commissions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivez vos revenus et les commissions AfriBiz prélevées
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
          {[
            { value: '7d', label: '7j' },
            { value: '30d', label: '30j' },
            { value: '90d', label: '90j' },
            { value: '1y', label: '1 an' },
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                period === p.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Revenu total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCFA(stats?.totalRevenue || 0)}</p>
            </div>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Percent className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Commissions AfriBiz</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCFA(stats?.totalCommissions || 0)}</p>
            </div>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min((stats?.commissionRate || 0) * 100, 100)}%` }} />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net perçu</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCFA(stats?.netRevenue || 0)}</p>
            </div>
          </div>
          <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: '100%' }} />
          </div>
        </Card>
      </div>

      {/* Commission breakdown */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Historique des commissions prélevées
        </h3>
        {logs && logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Description</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 20).map((log: any) => {
                  const meta = log.metadata || {};
                  const isCommission = meta?.commissionType != null;
                  const isDeducted = Number(log.amount) < 0;
                  return (
                    <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <td className="py-3 text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-3 text-gray-900 dark:text-gray-100">
                        {log.description || '-'}
                      </td>
                      <td className="py-3">
                        {isCommission ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            Commission
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {log.action || 'Log'}
                          </span>
                        )}
                      </td>
                      <td className={`py-3 text-right font-medium ${
                        isDeducted ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        <span className="flex items-center justify-end gap-1">
                          {isDeducted ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                          {formatCFA(Math.abs(Number(log.amount || 0)))}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Percent className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Aucune commission enregistrée pour le moment</p>
            <p className="text-xs text-gray-400 mt-1">
              Les commissions AfriBiz apparaîtront ici automatiquement lors de vos transactions
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
