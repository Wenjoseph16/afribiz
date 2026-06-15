'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Repeat, CreditCard, Users, TrendingUp, Plus, Search,
  CheckCircle, Clock, Loader,
  Award, AlertTriangle,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useSubscriptionPlans, useSubscriptionStats } from '@/features/hooks';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL';
  features: string[];
  maxEmployees: number;
  maxStorage: number;
  subscriberCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

const DURATION_LABELS: Record<string, string> = {
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  BIANNUAL: 'Semestriel',
  ANNUAL: 'Annuel',
};

export default function SubscriptionsPage() {
  const { data: plansData, isLoading, error, refetch } = useSubscriptionPlans();
  const { data: statsData } = useSubscriptionStats();
  const [searchQuery, setSearchQuery] = useState('');

  const plans: SubscriptionPlan[] = Array.isArray(plansData) ? plansData : (plansData?.plans || plansData?.data || []);

  const stats = statsData || {
    totalPlans: plans.length,
    activeSubscribers: plans.reduce((a, p) => a + (p.subscriberCount || 0), 0),
    monthlyRevenue: plans.reduce((a, p) => a + ((p.price || 0) * (p.subscriberCount || 0)), 0),
    churnRate: 0,
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return plans;
    const q = searchQuery.toLowerCase();
    return plans.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }, [plans, searchQuery]);

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Abonnements</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez vos plans d&apos;abonnement</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/dashboard/subscriptions/new">
            <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Nouveau plan</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={<Repeat className="h-5 w-5" />} iconBg="bg-brand-50" iconColor="text-brand" label="Total plans" value={stats.totalPlans} />
        <StatsCard icon={<Users className="h-5 w-5" />} iconBg="bg-purple-50" iconColor="text-purple-600" label="Abonnés actifs" value={stats.activeSubscribers} />
        <StatsCard icon={<CreditCard className="h-5 w-5" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Revenu mensuel" value={`${Number(stats.monthlyRevenue).toLocaleString()} FCFA`} />
        <StatsCard icon={<TrendingUp className="h-5 w-5" />} iconBg="bg-amber-50" iconColor="text-amber-600" label="Taux d&apos;attrition" value={`${stats.churnRate}%`} />
      </div>

      {/* Suggestions intelligentes */}
      {plans.length > 0 && (() => {
        const active = plans.filter(p => p.status === 'ACTIVE');
        const inactive = plans.filter(p => p.status === 'INACTIVE');
        const popular = plans.filter(p => (p.subscriberCount || 0) >= 50);
        const totalRevenue = plans.reduce((a, p) => a + (p.price || 0) * (p.subscriberCount || 0), 0);

        const suggestions = [
          active.length > 0 && {
            type: 'active', icon: CheckCircle,
            title: `${active.length} plan${active.length > 1 ? 's' : ''} actif${active.length > 1 ? 's' : ''}`,
            desc: `${stats.activeSubscribers} abonné${stats.activeSubscribers !== 1 ? 's' : ''} au total`,
            color: 'emerald',
          },
          popular.length > 0 && {
            type: 'popular', icon: Award,
            title: `${popular.length} plan${popular.length > 1 ? 's' : ''} populaire${popular.length > 1 ? 's' : ''}`,
            desc: 'Plus de 50 abonnés chacun — forte demande',
            color: 'purple',
          },
          inactive.length > 0 && {
            type: 'inactive', icon: AlertTriangle,
            title: `${inactive.length} plan${inactive.length > 1 ? 's' : ''} inactif${inactive.length > 1 ? 's' : ''}`,
            desc: 'Réactivez ou remplacez les plans inactifs',
            color: 'amber',
          },
          stats.monthlyRevenue > 0 && {
            type: 'revenue', icon: CreditCard,
            title: `${Number(totalRevenue).toLocaleString()} FCFA/mois`,
            desc: 'Revenu récurrent mensuel estimé',
            color: 'blue',
          },
        ].filter(Boolean);

        if (suggestions.length === 0) return null;

        const colorMap: Record<string, string> = {
          emerald: 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10',
          purple: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
          amber: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
          blue: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
        };

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((s: any, i) => (
              <Link key={i} href={s.link || '/dashboard/subscriptions'}
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


      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Rechercher un plan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Repeat className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Aucun plan trouvé</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'Essayez une autre recherche' : 'Créez votre premier plan d\'abonnement'}
          </p>
          <Link href="/dashboard/subscriptions/new"><Button><Plus className="h-4 w-4 mr-1.5" />Nouveau plan</Button></Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}

function getBadge(plan: SubscriptionPlan): { label: string; class: string } | null {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if ((plan.subscriberCount || 0) >= 50) {
    return { label: '🔥 Populaire', class: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300' };
  }
  if (plan.createdAt && new Date(plan.createdAt) > thirtyDaysAgo) {
    return { label: '🆕 Nouveau', class: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' };
  }
  return null;
}

function PlanCard({ plan }: { plan: SubscriptionPlan }) {
  const badge = getBadge(plan);
  return (
    <Link href={`/dashboard/subscriptions/${plan.id}`}
      className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-brand/30 hover:shadow-sm transition-all duration-200">
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{plan.name}</h3>
            {badge && <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0', badge.class)}>{badge.label}</span>}
          </div>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full shrink-0', {
            'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20': plan.status === 'ACTIVE',
            'text-gray-500 bg-gray-100 dark:bg-gray-800': plan.status === 'INACTIVE',
          })}>
            {plan.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Number(plan.price).toLocaleString()} FCFA</span>
          <span className="text-xs text-gray-500">/{DURATION_LABELS[plan.duration]?.toLowerCase() || plan.duration.toLowerCase()}</span>
        </div>

        {plan.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{plan.description}</p>
        )}

        {plan.features && plan.features.length > 0 && (
          <div className="space-y-1">
            {plan.features.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                <span className="truncate">{f}</span>
              </div>
            ))}
            {plan.features.length > 3 && (
              <p className="text-xs text-gray-400 pl-5">+{plan.features.length - 3} fonctionnalités</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {plan.subscriberCount || 0} abonné{(plan.subscriberCount || 0) !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            {DURATION_LABELS[plan.duration] || plan.duration}
          </div>
        </div>
      </div>
    </Link>
  );
}
