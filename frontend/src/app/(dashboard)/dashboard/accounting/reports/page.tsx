'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { BarChart3, TrendingUp, TrendingDown, Download, FileText, Percent, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

function fmt(n: number) { return n.toLocaleString('fr-FR') + ' FCFA'; }

export default function AccountingReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: bilan, isLoading: bilanLoading } = useQuery({
    queryKey: ['balance-sheet', year],
    queryFn: async () => {
      const res = await apiClient.get('/business/accounting/reports/balance-sheet?year=' + year);
      return res.data.data;
    },
  });

  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ['income-statement', year],
    queryFn: async () => {
      const res = await apiClient.get('/business/accounting/reports/income-statement?year=' + year);
      return res.data.data;
    },
  });

  if (bilanLoading || incomeLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader title="Rapports comptables" description="Bilan, résultat et export" />
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={e => setYear(parseInt(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={() => window.open('/api/business/accounting/reports/export-csv?year=' + year, '_blank')}>
            <Download className="h-4 w-4 mr-1.5" />Export CSV
          </Button>
        </div>
      </div>

      {/* Compte de résultat */}
      {income && (
        <Card>
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-brand" /><h3 className="font-semibold">Compte de résultat {year}</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Revenus', value: fmt(income.revenue?.totalRevenue || 0), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Dépenses', value: fmt(income.expenses?.total || 0), color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Résultat net', value: fmt(income.netIncome || 0), color: income.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600', bg: income.netIncome >= 0 ? 'bg-emerald-50' : 'bg-red-50' },
            ].map((s, i) => (
              <div key={i} className={cn('rounded-xl p-4', s.bg)}>
                <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-gray-500">Marge nette</p>
              <p className="font-bold text-lg">{income.profitMargin || 0}%</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-gray-500">Ratio dépenses</p>
              <p className="font-bold text-lg">{income.expenseRatio || 0}%</p>
            </div>
          </div>
          {income.expenses?.byCategory?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Dépenses par catégorie</p>
              <div className="space-y-1.5">
                {income.expenses.byCategory.map((c: any) => (
                  <div key={c.category} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-gray-600">{c.label}</span>
                    <span className="font-medium">{fmt(c.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Bilan */}
      {bilan && (
        <Card>
          <div className="flex items-center gap-2 mb-4"><Wallet className="h-5 w-5 text-brand" /><h3 className="font-semibold">Bilan comptable {year}</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Actif</h4>
              <div className="space-y-2">
                {[
                  { label: 'Trésorerie', value: fmt(bilan.assets?.cash || 0) },
                  { label: 'Créances clients', value: fmt(bilan.assets?.receivables || 0) },
                  { label: 'Devis en attente', value: fmt(bilan.assets?.quotedNotInvoiced || 0) },
                  { label: 'Total actif', value: fmt(bilan.assets?.totalAssets || 0), bold: true },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm">{item.label}</span>
                    <span className={cn('text-sm', item.bold && 'font-bold')}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Passif</h4>
              <div className="space-y-2">
                {[
                  { label: 'Dettes', value: fmt(bilan.liabilities?.debts || 0) },
                  { label: 'Total passif', value: fmt(bilan.liabilities?.totalLiabilities || 0), bold: true },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm">{item.label}</span>
                    <span className={cn('text-sm', item.bold && 'font-bold')}>{item.value}</span>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold">Capitaux propres</span>
                    <span className="text-sm font-bold text-emerald-600">{fmt(bilan.equity?.totalEquity || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
