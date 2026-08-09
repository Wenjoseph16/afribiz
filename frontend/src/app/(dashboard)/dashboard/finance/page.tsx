'use client';

import Link from 'next/link';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  ChevronRight,
  FileSignature,
  Loader,
  ArrowLeftRight,
  Percent,
  History,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { LiveBadge } from '@/components/ui/LiveBadge';
import { cn } from '@/lib/utils';
import ModuleCharts from '@/components/dashboard/ModuleCharts';
import type { ModuleChartData } from '@/components/dashboard/ModuleCharts';
import { useFinanceStats, useQuotes, useInvoices } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

export default function FinancePage() {
  const { data: statsData, isLoading } = useFinanceStats();
  const { data: quotesData } = useQuotes({ limit: 5 });
  const { data: invoicesData } = useInvoices({ limit: 5 });

  const stats = statsData?.data ||
    statsData || {
      totalRevenue: 0,
      paidRevenue: 0,
      unpaidCount: 0,
      overdueCount: 0,
      activeQuotes: 0,
    };
  const recentQuotes = Array.isArray(quotesData)
    ? quotesData
    : quotesData?.quotes || quotesData?.data || [];
  const recentInvoices = Array.isArray(invoicesData)
    ? invoicesData
    : invoicesData?.invoices || invoicesData?.data || [];

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Centre financier"
        description="Pilotez vos devis, factures et la trésorerie de votre entreprise."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance' },
          { label: 'Vue d\'ensemble' },
        ]}
      />

      {/* Stats */}
      <div className="flex items-center justify-end">
        <LiveBadge tone="brand" label="Temps réel" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Revenu total"
          value={formatPrice(Number(stats.totalRevenue || 0))}
        />
        <StatsCard
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Payé"
          value={formatPrice(Number(stats.paidRevenue || 0))}
          trend={
            stats.paidRevenue > 0 && stats.totalRevenue > 0
              ? {
                  value: `${((Number(stats.paidRevenue) / Number(stats.totalRevenue)) * 100).toFixed(0)}% du total`,
                  positive: true,
                }
              : undefined
          }
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Impayées"
          value={stats.unpaidCount || 0}
          trend={
            Number(stats.unpaidCount) > 0
              ? { value: `${stats.unpaidCount} facture(s)`, positive: false }
              : undefined
          }
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg={Number(stats.overdueCount) > 0 ? 'bg-red-50' : 'bg-gray-50'}
          iconColor={Number(stats.overdueCount) > 0 ? 'text-red-600' : 'text-gray-400'}
          label="En retard"
          value={stats.overdueCount || 0}
        />
      </div>

      {/* Charts */}
      {(() => {
        const total = Number(stats.totalRevenue || 0);
        const paid = Number(stats.paidRevenue || 0);
        const unpaid = Number(stats.unpaidCount || 0);
        const overdue = Number(stats.overdueCount || 0);
        const chartData: ModuleChartData = {
          distribution: [
            { name: 'Payé', value: Math.round(paid / 1000), color: '#10b981' },
            { name: 'Impayé', value: Math.round((total - paid) / 1000), color: '#f59e0b' },
          ].filter((d) => d.value > 0),
          daily: [
            { label: 'Devis', value: recentQuotes.length },
            { label: 'Factures', value: recentInvoices.length },
            { label: 'Impayées', value: unpaid },
            { label: 'Retard', value: overdue },
          ],
        };
        return (
          <ModuleCharts
            data={chartData}
            title="VUE D'ENSEMBLE FINANCIÈRE"
            distributionLabel="Répartition revenus"
            dailyLabel="Activité"
            variant="services"
          />
        );
      })()}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/dashboard/quotes/new">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-brand/10">
                <FileText className="w-6 h-6 text-brand" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Nouveau devis</p>
                <p className="text-xs text-gray-500">Créer un devis pour un client</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/finance/invoices/new">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-100">
                <FileSignature className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Nouvelle facture</p>
                <p className="text-xs text-gray-500">Créer une facture manuelle</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/debts-payments">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-100">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">Dettes & Paiements</p>
                <p className="text-xs text-gray-500">Gérer les dettes, escrow, risques clients</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-brand transition-colors" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Vues avancées */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/dashboard/finance/transactions">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                <ArrowLeftRight className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Transactions</p>
                <p className="text-[10px] text-gray-500">Historique wallet</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/finance/commissions">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <Percent className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Commissions</p>
                <p className="text-[10px] text-gray-500">Revenus & frais AfriBiz</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/finance/history">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/30">
                <History className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Historique</p>
                <p className="text-[10px] text-gray-500">Actions financières tracées</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/finance/client-risks">
          <Card className="p-4 hover:shadow-md transition-all group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/30">
                <ShieldAlert className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Risques clients</p>
                <p className="text-[10px] text-gray-500">Scores & alertes</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
            </div>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand" />
              Derniers devis
            </h3>
            <Link href="/dashboard/quotes" className="text-xs text-brand hover:underline">
              Voir tout
            </Link>
          </div>
          {recentQuotes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucun devis récent</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recentQuotes.slice(0, 5).map((q: any) => (
                <Link
                  key={q.id}
                  href={`/dashboard/quotes/${q.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {q.quoteNumber || 'Devis'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {q.clientName || q.client?.firstName + ' ' + q.client?.lastName || 'Client'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {formatPrice(Number(q.totalAmount || 0))}
                    </p>
                    <p className="text-[9px] text-gray-400">{q.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Invoices */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-emerald-600" />
              Dernières factures
            </h3>
            <Link href="/dashboard/invoices" className="text-xs text-brand hover:underline">
              Voir tout
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Aucune facture récente</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {recentInvoices.slice(0, 5).map((inv: any) => (
                <Link
                  key={inv.id}
                  href={`/dashboard/invoices/${inv.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white">
                      {inv.invoiceNumber || 'Facture'}
                    </p>
                    <p className="text-[10px] text-gray-400">{inv.clientName || 'Client'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      {formatPrice(Number(inv.totalAmount || 0))}
                    </p>
                    <p
                      className={cn(
                        'text-[9px]',
                        inv.status === 'PAID'
                          ? 'text-emerald-600'
                          : inv.status === 'OVERDUE'
                            ? 'text-red-500'
                            : 'text-amber-500'
                      )}
                    >
                      {inv.status}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
