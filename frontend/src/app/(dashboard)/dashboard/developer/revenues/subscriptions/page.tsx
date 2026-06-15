'use client';

import { useState, useMemo } from 'react';
import { Repeat, DollarSign, CreditCard, Users, TrendingUp, CheckCircle, XCircle, Ban, Eye } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { cn } from '@/lib/utils';
import { useDeveloperSubscriptions } from '@/features/developerHooks';

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  CANCELLED: 'danger',
  PENDING: 'warning',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Actif',
  EXPIRED: 'Expiré',
  CANCELLED: 'Annulé',
  PENDING: 'En attente',
};

const PLAN_FILTERS = [
  { label: 'Tous', value: 'ALL' },
  { label: 'Mensuel', value: 'MONTHLY' },
  { label: 'Trimestriel', value: 'QUARTERLY' },
  { label: 'Annuel', value: 'YEARLY' },
];

export default function SubscriptionsRevenuePage() {
  const [filterPlan, setFilterPlan] = useState('ALL');
  const { data: subscriptionsData, isLoading, error, refetch } = useDeveloperSubscriptions();

  const subscriptions = useMemo(() => {
    if (!subscriptionsData) return [];
    return Array.isArray(subscriptionsData) ? subscriptionsData : (subscriptionsData.subscriptions || subscriptionsData.data || []);
  }, [subscriptionsData]);

  const filtered = useMemo(() => {
    if (filterPlan === 'ALL') return subscriptions;
    return subscriptions.filter((s: any) => (s.plan || s.pricingType) === filterPlan);
  }, [subscriptions, filterPlan]);

  const stats = useMemo(() => {
    const active = subscriptions.filter((s: any) => s.status === 'ACTIVE');
    const mrr = active.reduce((sum: number, s: any) => {
      const amount = Number(s.amount || s.price || 0);
      const plan = s.plan || s.pricingType || '';
      if (plan === 'YEARLY') return sum + Math.round(amount / 12);
      if (plan === 'QUARTERLY') return sum + Math.round(amount / 3);
      if (plan === 'SEMESTRIAL') return sum + Math.round(amount / 6);
      return sum + amount;
    }, 0);
    const arr = mrr * 12;
    const cancelled = subscriptions.filter((s: any) => s.status === 'CANCELLED');
    const churn = subscriptions.length > 0 ? (cancelled.length / subscriptions.length) * 100 : 0;
    return {
      activeCount: active.length,
      mrr: Math.round(mrr),
      arr: Math.round(arr),
      churn: Math.round(churn * 10) / 10,
    };
  }, [subscriptions]);

  if (error) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (isLoading) return <Loader size="lg" label="Chargement des abonnements..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Abonnements"
        description="Revenus récurrents issus des abonnements à vos modules"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Développeur', href: '/dashboard/developer' },
          { label: 'Revenus', href: '/dashboard/developer/revenues' },
          { label: 'Abonnements' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" hoverable>
          <Repeat className="h-5 w-5 text-brand mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeCount}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Abonnements actifs</p>
        </Card>
        <Card padding="md" hoverable>
          <DollarSign className="h-5 w-5 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.mrr.toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">MRR (revenu mensuel)</p>
        </Card>
        <Card padding="md" hoverable>
          <TrendingUp className="h-5 w-5 text-purple-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.arr.toLocaleString()} FCFA</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ARR (revenu annuel)</p>
        </Card>
        <Card padding="md" hoverable>
          <Users className="h-5 w-5 text-amber-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.churn}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Taux de churn</p>
        </Card>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Détail des abonnements</h3>
          <div className="flex items-center gap-1">
            {PLAN_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterPlan(f.value)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-lg transition-colors',
                  filterPlan === f.value ? 'bg-brand text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Repeat className="h-10 w-10" />}
            title="Aucun abonnement"
            description="Les abonnements à vos modules apparaîtront ici."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Module</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Client</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Montant</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Début</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Prochaine fact.</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-500 dark:text-gray-400">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub: any) => (
                  <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-2 font-medium text-gray-900 dark:text-gray-100">
                      {sub.module?.name || '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400">
                      {sub.client?.name || sub.business?.name || sub.clientName || '—'}
                    </td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full',
                        (sub.plan || sub.pricingType) === 'MONTHLY' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        (sub.plan || sub.pricingType) === 'QUARTERLY' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        (sub.plan || sub.pricingType) === 'YEARLY' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {sub.plan || sub.pricingType || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-semibold text-gray-900 dark:text-gray-100">
                      {Number(sub.amount || sub.price || 0).toLocaleString()} FCFA
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {sub.startDate ? new Date(sub.startDate).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant={STATUS_VARIANTS[sub.status] || 'default'} size="xs">
                        {STATUS_LABELS[sub.status] || sub.status}
                      </Badge>
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
