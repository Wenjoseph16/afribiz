'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Wallet, TrendingUp, DollarSign, Percent, Calendar,
  ArrowRight, CreditCard, Banknote, Clock,
  Download, FileText, Filter, BarChart3, AlertCircle,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useDeveloperRevenues, useDeveloperRevenueSummary, useDeveloperPayouts } from '@/features/developerHooks';
import type { DeveloperRevenue } from '@/types/developer';

const TYPE_LABELS: Record<string, string> = {
  SALE: 'Vente',
  SUBSCRIPTION: 'Abonnement',
  UPGRADE: 'Upgrade',
  COMMISSION: 'Commission',
};

const TYPE_COLORS: Record<string, string> = {
  SALE: 'bg-emerald-500',
  SUBSCRIPTION: 'bg-blue-500',
  UPGRADE: 'bg-purple-500',
  COMMISSION: 'bg-amber-500',
};

const FILTER_OPTIONS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Ventes', value: 'SALE' },
  { label: 'Abonnements', value: 'SUBSCRIPTION' },
  { label: 'Commissions', value: 'COMMISSION' },
];

export default function DeveloperRevenuesPage() {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [monthFilter, setMonthFilter] = useState('ALL');

  const { data: revenues, isLoading: revLoading, error: revError, refetch: revRefetch } = useDeveloperRevenues();
  const { data: summary, isLoading: sumLoading } = useDeveloperRevenueSummary();
  const { data: payouts } = useDeveloperPayouts();

  const isLoading = revLoading || sumLoading;

  const revenueList = useMemo(() => {
    if (!revenues) return [];
    const list = Array.isArray(revenues) ? revenues : (revenues.revenues || revenues.data || []);
    return list.filter((r: DeveloperRevenue) => {
      if (typeFilter !== 'ALL' && r.type !== typeFilter) return false;
      if (monthFilter !== 'ALL') {
        const d = new Date(r.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (key !== monthFilter) return false;
      }
      return true;
    });
  }, [revenues, typeFilter, monthFilter]);

  const months = useMemo(() => {
    if (!revenues) return [];
    const list = Array.isArray(revenues) ? revenues : (revenues.revenues || revenues.data || []);
    const seen = new Set<string>();
    return list
      .map((r: DeveloperRevenue) => {
        const d = new Date(r.createdAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      })
      .filter((k: string) => {
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort()
      .reverse();
  }, [revenues]);

  const s = summary || { total: 0, thisMonth: 0, pending: 0, netTotal: 0 };

  const totalPayouts = useMemo(() => {
    if (!payouts) return 0;
    const list = Array.isArray(payouts) ? payouts : (payouts as any).payouts || [];
    return list.reduce((sum: number, p: any) => sum + Number(p.netAmount || 0), 0);
  }, [payouts]);

  const revenueByType = useMemo(() => {
    if (!revenues) return {};
    const list = Array.isArray(revenues) ? revenues : (revenues.revenues || revenues.data || []);
    const byType: Record<string, number> = {};
    list.forEach((r: DeveloperRevenue) => {
      byType[r.type] = (byType[r.type] || 0) + Number(r.amount || 0);
    });
    return byType;
  }, [revenues]);

  const monthlyData = useMemo(() => {
    if (!revenues) return [];
    const list = Array.isArray(revenues) ? revenues : (revenues.revenues || revenues.data || []);
    const byMonth: Record<string, { amount: number; net: number }> = {};
    list.forEach((r: DeveloperRevenue) => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { amount: 0, net: 0 };
      byMonth[key].amount += Number(r.amount || 0);
      byMonth[key].net += Number(r.netAmount || 0);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6);
  }, [revenues]);

  const maxMonthly = Math.max(...monthlyData.map(([, d]) => d.amount), 1);

  if (revError) return <ErrorState message={revError.message} onRetry={() => revRefetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des revenus..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Revenus"
        description="Suivez vos gains, factures et transactions"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Revenus' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/developer/revenues/payouts">
              <Button variant="secondary" size="sm">
                <Wallet className="h-4 w-4" />
                Retraits
              </Button>
            </Link>
            <Link href="/dashboard/developer/revenues/invoices">
              <Button variant="secondary" size="sm">
                <FileText className="h-4 w-4" />
                Factures
              </Button>
            </Link>
            <Link href="/dashboard/developer/revenues/sales">
              <Button variant="secondary" size="sm">
                <TrendingUp className="h-4 w-4" />
                Ventes
              </Button>
            </Link>
            <Link href="/dashboard/developer/revenues/subscriptions">
              <Button variant="secondary" size="sm">
                <Calendar className="h-4 w-4" />
                Abonnements
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<Wallet className="h-5 w-5" />}
          iconBg="bg-emerald-50 dark:bg-emerald-900/30"
          iconColor="text-emerald-600"
          label="Revenu total"
          value={`${(s.total || 0).toLocaleString()} FCFA`}
        />
        <StatsCard
          icon={<Calendar className="h-5 w-5" />}
          iconBg="bg-blue-50 dark:bg-blue-900/30"
          iconColor="text-blue-600"
          label="Ce mois"
          value={`${(s.thisMonth || 0).toLocaleString()} FCFA`}
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-amber-50 dark:bg-amber-900/30"
          iconColor="text-amber-600"
          label="En attente"
          value={`${(s.pending || 0).toLocaleString()} FCFA`}
        />
        <StatsCard
          icon={<Banknote className="h-5 w-5" />}
          iconBg="bg-purple-50 dark:bg-purple-900/30"
          iconColor="text-purple-600"
          label="Net (après commission)"
          value={`${(s.netTotal || 0).toLocaleString()} FCFA`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Revenus mensuels
            </h3>
          </div>
          {monthlyData.length > 0 ? (
            <div className="space-y-3">
              {monthlyData.map(([month, data]) => {
                const pct = (data.amount / maxMonthly) * 100;
                const [year, m] = month.split('-');
                const label = new Date(Number(year), Number(m) - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
                return (
                  <div key={month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">{label}</span>
                      <span className="text-gray-900 dark:text-gray-100 font-semibold">{data.amount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand to-brand-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Net: {data.net.toLocaleString()} FCFA</span>
                      <span>Commission: {(data.amount - data.net).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Aucune donnée mensuelle</p>
          )}
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Répartition par type
          </h3>
          {Object.keys(revenueByType).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(revenueByType).map(([type, amount]) => {
                const total = Object.values(revenueByType).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? (amount / total) * 100 : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className={cn('w-2.5 h-2.5 rounded-full', TYPE_COLORS[type] || 'bg-gray-400')} />
                        <span className="text-gray-600 dark:text-gray-400">{TYPE_LABELS[type] || type}</span>
                      </div>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">{amount.toLocaleString()} FCFA</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', TYPE_COLORS[type] || 'bg-gray-400')} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">Aucune donnée</p>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Total retiré</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPayouts.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Restant</span>
              <span className="font-semibold text-emerald-600">{(s.netTotal - totalPayouts).toLocaleString()} FCFA</span>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Historique des transactions
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-400" />
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={cn(
                  'text-xs font-medium px-2.5 py-1 rounded-full transition-colors',
                  typeFilter === f.value
                    ? 'bg-brand text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {f.label}
              </button>
            ))}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="ml-2 text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            >
              <option value="ALL">Tous les mois</option>
              {months.map((m: string) => {
                const [y, month] = m.split('-');
                const label = new Date(Number(y), Number(month) - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                return <option key={m} value={m}>{label}</option>;
              })}
            </select>
          </div>
        </div>

        {revenueList.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-10 w-10" />}
            title="Aucun revenu"
            description="Les revenus apparaîtront ici une fois que vos modules seront vendus."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Module</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Montant</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Commission</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Net</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Facture</th>
                </tr>
              </thead>
              <tbody>
                {revenueList.map((rev: DeveloperRevenue) => (
                  <tr key={rev.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-2 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {new Date(rev.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-2 text-gray-900 dark:text-gray-100">
                      {rev.module?.name || '—'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full',
                        rev.type === 'SALE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        rev.type === 'SUBSCRIPTION' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {TYPE_LABELS[rev.type] || rev.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-medium text-gray-900 dark:text-gray-100">
                      {rev.amount.toLocaleString()} FCFA
                    </td>
                    <td className="py-3 px-2 text-right text-gray-500 dark:text-gray-400">
                      -{rev.commissionAmount.toLocaleString()} FCFA
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-emerald-600">
                      {rev.netAmount.toLocaleString()} FCFA
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge
                        variant={rev.status === 'COMPLETED' ? 'success' : rev.status === 'PENDING' ? 'warning' : 'default'}
                        size="xs"
                      >
                        {rev.status === 'COMPLETED' ? 'Complété' : rev.status === 'PENDING' ? 'En attente' : rev.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Link href={`/dashboard/developer/revenues/invoices`} className="text-brand hover:text-brand-700 text-xs font-medium transition-colors">
                        <FileText className="h-3.5 w-3.5 inline mr-1" />
                        Voir
                      </Link>
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
