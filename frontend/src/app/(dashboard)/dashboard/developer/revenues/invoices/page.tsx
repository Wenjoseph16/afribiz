'use client';

import { useMemo, useState } from 'react';
import { FileText, Download, Eye, Filter } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { useDeveloperRevenues } from '@/features/developerHooks';
import type { DeveloperRevenue } from '@/types/developer';

export default function DeveloperInvoicesPage() {
  const [filterType, setFilterType] = useState<'all' | 'COMPLETED' | 'PENDING'>('all');
  const { data: revenues, isLoading, error, refetch } = useDeveloperRevenues();

  const revenueList = useMemo(() => {
    if (!revenues) return [];
    return Array.isArray(revenues) ? revenues : (revenues.revenues || revenues.data || []);
  }, [revenues]);

  const invoices = useMemo(() => {
    const grouped: Record<string, { period: string; amount: number; netAmount: number; count: number; status: string }> = {};
    revenueList.forEach((r: DeveloperRevenue) => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const period = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!grouped[key]) {
        grouped[key] = { period, amount: 0, netAmount: 0, count: 0, status: 'COMPLETED' };
      }
      grouped[key].amount += Number(r.amount || 0);
      grouped[key].netAmount += Number(r.netAmount || 0);
      grouped[key].count++;
      if (r.status === 'PENDING') grouped[key].status = 'PENDING';
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, val]) => ({
        id: `INV-${key}`,
        ...val,
      }));
  }, [revenueList]);

  const filtered = filterType === 'all' ? invoices : invoices.filter((i) => i.status === filterType);
  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter((i) => i.status === 'COMPLETED').length,
    pending: invoices.filter((i) => i.status === 'PENDING').length,
  }), [invoices]);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des factures..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Factures"
        description="Historique des factures de commissions AfriBiz"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Revenus', href: '/dashboard/developer/revenues' },
          { label: 'Factures' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Factures totales</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.paid}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Payées</p>
        </Card>
        <Card padding="md" hoverable>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-3">
            <FileText className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pending}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">En attente</p>
        </Card>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Factures de commission</h3>
          <div className="flex items-center gap-1">
            {(['all', 'COMPLETED', 'PENDING'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                  filterType === f ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                )}
              >
                {f === 'all' ? 'Toutes' : f === 'COMPLETED' ? 'Payées' : 'En attente'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-10 w-10" />}
            title="Aucune facture disponible"
            description="Les factures seront générées automatiquement à partir de vos revenus."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Facture</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Période</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Transactions</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Montant brut</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Net</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">{inv.id}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 capitalize">{inv.period}</td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">{inv.count}</td>
                    <td className="py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">{inv.amount.toLocaleString()} FCFA</td>
                    <td className="py-3 px-2 font-semibold text-emerald-600">{inv.netAmount.toLocaleString()} FCFA</td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                        inv.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      )}>
                        {inv.status === 'COMPLETED' ? 'Payée' : 'En attente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
