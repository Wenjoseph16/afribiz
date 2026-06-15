'use client';

import { useMemo } from 'react';
import { BarChart3, Users, TrendingUp, DollarSign, Repeat, Loader, Target, Award, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useSubscriptionStats, useSubscribers, useSubscriptionPlans } from '@/features/hooks';

export default function SubscriptionStatsPage() {
  const { data: statsData, isLoading } = useSubscriptionStats();
  const { data: subsData } = useSubscribers({ limit: 500 });
  const { data: plansData } = useSubscriptionPlans();

  const subscribers: any[] = useMemo(() => {
    const raw = Array.isArray(subsData) ? subsData : (subsData?.subscribers || subsData?.data || []);
    return raw;
  }, [subsData]);

  const plans: any[] = useMemo(() => {
    const raw = Array.isArray(plansData) ? plansData : (plansData?.plans || plansData?.data || []);
    return raw;
  }, [plansData]);

  const stats = (statsData?.data || statsData) as any || {};

  const activeSubs = subscribers.filter((s: any) => s.status === 'ACTIVE');
  const expiredSubs = subscribers.filter((s: any) => s.status === 'EXPIRED');
  const churnRate = subscribers.length > 0 ? Math.round(expiredSubs.length / subscribers.length * 100) : 0;
  const totalRevenue = subscribers.reduce((sum: number, s: any) => sum + (s.amount || s.plan?.price || 0), 0);
  const monthlyRevenue = subscribers.filter((s: any) => s.status === 'ACTIVE').reduce((sum: number, s: any) => sum + (s.amount || s.plan?.price || 0), 0);

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Statistiques abonnements</h1>
        <p className="text-sm text-gray-500">Analysez la performance de vos revenus récurrents</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 sm:p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-brand/10"><DollarSign className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500 uppercase font-semibold">Revenus totaux</p><p className="text-lg font-bold">{(stats.totalRevenue ?? totalRevenue).toLocaleString()} FCFA</p></div></div></Card>
        <Card className="p-3 sm:p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-100"><Users className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500 uppercase font-semibold">Abonnés actifs</p><p className="text-lg font-bold">{stats.activeSubscribers ?? activeSubs.length}</p></div></div></Card>
        <Card className="p-3 sm:p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100"><Repeat className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500 uppercase font-semibold">Revenus mensuels</p><p className="text-lg font-bold">{monthlyRevenue.toLocaleString()} FCFA</p></div></div></Card>
        <Card className="p-3 sm:p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100"><BarChart3 className="w-4 h-4 text-purple-600" /></div><div><p className="text-[10px] text-gray-500 uppercase font-semibold">Formules</p><p className="text-lg font-bold">{stats.totalPlans ?? plans.length}</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="w-4 h-4" />Répartition des abonnés</h3>
          <div className="space-y-3">
            {[
              { label: 'Actifs', count: activeSubs.length, color: 'bg-emerald-500' },
              { label: 'Expirés', count: expiredSubs.length, color: 'bg-red-500' },
              { label: 'Résiliés', count: subscribers.filter((s: any) => s.status === 'CANCELLED').length, color: 'bg-amber-500' },
              { label: 'Suspendus', count: subscribers.filter((s: any) => s.status === 'SUSPENDED').length, color: 'bg-gray-400' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{s.label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{s.count} ({subscribers.length > 0 ? Math.round(s.count / subscribers.length * 100) : 0}%)</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', s.color)} style={{ width: `${subscribers.length > 0 ? (s.count / subscribers.length * 100) : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Award className="w-4 h-4" />Top formules</h3>
          {plans.length === 0 ? (
            <p className="text-xs text-gray-500">Aucune formule</p>
          ) : (
            <div className="space-y-3">
              {plans.map((plan: any) => {
                const subCount = subscribers.filter((s: any) => s.planId === plan.id).length;
                const maxCount = Math.max(...plans.map((p: any) => subscribers.filter((s: any) => s.planId === p.id).length), 1);
                return (
                  <div key={plan.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{plan.name}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{subCount} abonnés — {(plan.price || 0).toLocaleString()} FCFA</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${subCount / maxCount * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" />Indicateurs clés</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{subscribers.length > 0 ? Math.round(totalRevenue / subscribers.length) : 0} FCFA</p><p className="text-[10px] text-gray-500">Revenu / abonné</p></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className={cn('text-2xl font-bold', churnRate > 30 ? 'text-red-500' : churnRate > 15 ? 'text-amber-500' : 'text-emerald-500')}>{churnRate}%</p><p className="text-[10px] text-gray-500">Taux résiliation</p></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{activeSubs.length > 0 && plans.length > 0 ? Math.round(activeSubs.length / Math.max(1, plans.length)) : 0}</p><p className="text-[10px] text-gray-500">Abonnés / formule</p></div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{subscribers.length > 0 ? Math.round(activeSubs.length / subscribers.length * 100) : 0}%</p><p className="text-[10px] text-gray-500">Taux rétention</p></div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800/30">
          <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />Suggestions</h3>
          <div className="space-y-2">
            {activeSubs.length === 0 && (
              <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60"><p className="text-xs font-medium text-blue-800 dark:text-blue-300">📢 Aucun abonné actif</p><p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Créez des formules d'abonnement et commencez à recruter des abonnés.</p></div>
            )}
            {churnRate > 30 && (
              <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60"><p className="text-xs font-medium text-blue-800 dark:text-blue-300">⚠️ Taux de résiliation élevé ({churnRate}%)</p><p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">Envisagez des offres de réactivation ou une amélioration des avantages.</p></div>
            )}
            <div className="p-3 rounded-xl bg-white/60 dark:bg-gray-800/60"><p className="text-xs font-medium text-blue-800 dark:text-blue-300">📊 Revenus récurrents</p><p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">{monthlyRevenue.toLocaleString()} FCFA / mois de revenus récurrents avec {activeSubs.length} abonnés actifs.</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
