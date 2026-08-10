'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  FileSignature,
  Search,
  Plus,
  ChevronRight,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import ModuleCharts from '@/components/dashboard/ModuleCharts';
import type { ModuleChartData } from '@/components/dashboard/ModuleCharts';
import { useInvoices } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';
import { CopilotTips } from '@/components/copilot/CopilotTips';
import { useAuthStore } from '@/stores/authStore';

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'warning' | 'success' | 'danger' | 'info' | 'default'; color: string }
> = {
  DRAFT: {
    label: 'Brouillon',
    variant: 'default',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  },
  SENT: {
    label: 'Envoyée',
    variant: 'info',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  PARTIALLY_PAID: {
    label: 'Partielle',
    variant: 'warning',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  PAID: {
    label: 'Payée',
    variant: 'success',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  OVERDUE: {
    label: 'En retard',
    variant: 'danger',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  CANCELLED: {
    label: 'Annulée',
    variant: 'danger',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  DISPUTE: {
    label: 'Litige',
    variant: 'danger',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'DRAFT', label: 'Brouillons' },
  { key: 'SENT', label: 'Envoyées' },
  { key: 'PAID', label: 'Payées' },
  { key: 'PARTIALLY_PAID', label: 'Partielles' },
  { key: 'OVERDUE', label: 'En retard' },
];

export default function InvoicesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  // Rediriger les clients vers la page factures client
  useEffect(() => {
    if (user && (user.primaryRole === 'CLIENT' || !user.roles?.includes('BUSINESS'))) {
      router.replace('/dashboard/invoices');
    }
  }, [user, router]);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { data: invoicesData, isLoading, error, refetch } = useInvoices({ limit: 100 });

  const allInvoices = Array.isArray(invoicesData)
    ? invoicesData
    : invoicesData?.invoices || invoicesData?.data || [];
  const now = new Date();

  const stats = {
    total: allInvoices.length,
    paid: allInvoices.filter((i: any) => i.status === 'PAID').length,
    unpaid: allInvoices.filter((i: any) => ['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(i.status))
      .length,
    overdue: allInvoices.filter(
      (i: any) =>
        i.status === 'OVERDUE' ||
        (['SENT', 'PARTIALLY_PAID'].includes(i.status) && i.dueDate && new Date(i.dueDate) < now)
    ).length,
    revenue: allInvoices
      .filter((i: any) => i.status === 'PAID')
      .reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0),
  };

  const filtered = allInvoices.filter((inv: any) => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        (inv.invoiceNumber || '').toLowerCase().includes(s) ||
        (inv.clientName || '').toLowerCase().includes(s)
      );
    }
    return true;
  });

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Factures"
        description="Gérez vos factures et suivez les paiements"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Factures' },
        ]}
        actions={
          <Link href="/dashboard/finance/invoices/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle facture
            </Button>
          </Link>
        }
      />

      <CopilotTips moduleKey="INVOICES" />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={<FileSignature className="h-5 w-5" />}
          iconBg="bg-brand/10"
          iconColor="text-brand"
          label="Total"
          value={stats.total}
        />
        <StatsCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          label="Payées"
          value={stats.paid}
        />
        <StatsCard
          icon={<Clock className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          label="Impayées"
          value={stats.unpaid}
          trend={
            stats.unpaid > 0 ? { value: `${stats.unpaid} facture(s)`, positive: false } : undefined
          }
        />
        <StatsCard
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg={stats.overdue > 0 ? 'bg-red-50' : 'bg-gray-50'}
          iconColor={stats.overdue > 0 ? 'text-red-600' : 'text-gray-400'}
          label="En retard"
          value={stats.overdue}
        />
      </div>

      {/* Charts */}
      {stats.total > 0 &&
        (() => {
          const chartData: ModuleChartData = {
            distribution: [
              { name: 'Payées', value: stats.paid, color: '#10b981' },
              { name: 'Impayées', value: stats.unpaid, color: '#f59e0b' },
              { name: 'En retard', value: stats.overdue, color: '#ef4444' },
            ].filter((d) => d.value > 0),
            daily: [
              { label: 'Total', value: stats.total },
              { label: 'Payées', value: stats.paid },
              { label: 'Impayées', value: stats.unpaid },
              { label: 'Retard', value: stats.overdue },
            ],
          };
          return (
            <ModuleCharts
              data={chartData}
              title="ANALYTICS FACTURES"
              distributionLabel="Statut"
              dailyLabel="Vue d'ensemble"
              variant="services"
            />
          );
        })()}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                filter === t.key
                  ? 'bg-brand text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par n° facture, client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <FileSignature className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-4">Aucune facture</p>
          <Link href="/dashboard/finance/invoices/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle facture
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv: any) => {
            const s = STATUS_CONFIG[inv.status] || STATUS_CONFIG.DRAFT;
            const remaining = Number(inv.totalAmount || 0) - Number(inv.amountPaid || 0);
            const isOverdue = inv.dueDate && new Date(inv.dueDate) < now && inv.status !== 'PAID';
            return (
              <Link key={inv.id} href={`/dashboard/finance/invoices/${inv.id}`} className="block">
                <Card
                  className={cn(
                    'p-4 hover:shadow-md transition-all group cursor-pointer',
                    isOverdue && 'ring-1 ring-red-200 dark:ring-red-800'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inv.invoiceNumber || `#${inv.id.slice(0, 8)}`}
                        </h3>
                        <Badge variant={isOverdue ? 'danger' : s.variant} size="xs">
                          {isOverdue ? 'En retard' : s.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{inv.clientName || 'Client'}</p>
                      {remaining > 0 && (
                        <p className="text-[10px] text-amber-600 mt-0.5">
                          Reste: {formatPrice(remaining)}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatPrice(Number(inv.totalAmount || 0))}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0 mt-2" />
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
