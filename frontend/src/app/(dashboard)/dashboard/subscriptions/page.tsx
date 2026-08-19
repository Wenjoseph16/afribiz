'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Repeat, CreditCard, Users, TrendingUp, Plus, Search,
  CheckCircle, Clock, ArrowUpRight, Loader, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSubscriptionPlans, useSubscriptionStats } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';

const DURATION_LABELS: Record<string, string> = {
  MONTHLY: 'Mensuel', QUARTERLY: 'Trimestriel', BIANNUAL: 'Semestriel', ANNUAL: 'Annuel',
};function GlassCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (    <div className={cn('glass rounded-2xl glass-hover', className)}>
      {children}
    </div>
  );
}



export default function SubscriptionsPage() {
  const { data: plansData, isLoading, error, refetch } = useSubscriptionPlans();
  const { data: statsData } = useSubscriptionStats();
  const [search, setSearch] = useState('');

  const plans = Array.isArray(plansData) ? plansData : plansData?.plans || plansData?.data || [];
  const stats = statsData || {
    totalPlans: plans.length,
    activeSubscribers: plans.reduce((a: number, p: any) => a + (p.subscriberCount || 0), 0),
    monthlyRevenue: plans.reduce((a: number, p: any) => a + (p.price || 0) * (p.subscriberCount || 0), 0),
    churnRate: 0,
  };

  const filtered = useMemo(() => {
    if (!search) return plans;
    const q = search.toLowerCase();
    return plans.filter((p: any) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }, [plans, search]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader className="h-8 w-8 animate-spin text-emerald-400" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-3">
            <Repeat className="w-3 h-3" />
            Abonnements
          </div>
          <h1 className="text-2xl font-display font-bold text-white tracking-tight">Plans d&apos;abonnement</h1>
          <p className="text-white/30 text-sm mt-0.5">{plans.length} plan{plans.length > 1 ? 's' : ''} — {stats.activeSubscribers} abonné{stats.activeSubscribers > 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/subscriptions/new">
          <button className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white text-sm font-bold rounded-xl hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Nouveau plan
          </button>
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Plans', value: stats.totalPlans, icon: Repeat, color: 'emerald' },
          { label: 'Abonnés', value: stats.activeSubscribers, icon: Users, color: 'blue' },
          { label: 'Revenu/mois', value: `${stats.monthlyRevenue.toLocaleString()} FCFA`, icon: CreditCard, color: 'emerald' },
          { label: 'Attrition', value: `${stats.churnRate}%`, icon: TrendingUp, color: 'amber' },
        ].map((kpi) => (
          <GlassCard key={kpi.label}>
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', `bg-${kpi.color}-500/10 border-${kpi.color}-500/20`)}>
                <kpi.icon className={cn('w-4 h-4', `text-${kpi.color}-400`)} />
              </div>
              <div>
                <p className="text-xl font-bold text-white tabular-nums">{kpi.value}</p>
                <p className="text-[10px] text-white/30 font-medium">{kpi.label}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
        <input
          type="text"
          placeholder="Rechercher un plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/20 focus:border-emerald-500/40 focus:ring-0 outline-none transition-all"
        />
      </div>

      {/* Plans grid */}
      {filtered.length === 0 ? (
        <GlassCard>
          <div className="text-center py-12">
            <Repeat className="w-12 h-12 text-white/15 mx-auto mb-4" />
            <p className="text-sm text-white/40 mb-4">Aucun plan trouvé</p>
            <Link href="/dashboard/subscriptions/new">
              <button className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl hover:bg-emerald-500/20 transition-all">
                <Plus className="w-4 h-4" /> Nouveau plan
              </button>
            </Link>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((plan: any, idx: number) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                href={`/dashboard/subscriptions/${plan.id}`}
                className="group block relative rounded-2xl glass p-1.5 hover:border-emerald-500/20 transition-all duration-300"
              >
                <div className="relative rounded-[calc(1rem-0.1875rem)] bg-gradient-to-br from-white/[0.02] to-transparent p-5">
                  <div className="absolute inset-0 rounded-[calc(1rem-0.1875rem)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white truncate">{plan.name}</h3>
                      <span className={cn(
                        'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                        plan.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/5 text-white/30 border-white/10'
                      )}>
                        {plan.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold text-white tabular-nums">
                        {formatPrice(plan.price)}
                      </span>
                      <span className="text-xs text-white/30">
                        /{DURATION_LABELS[plan.duration]?.toLowerCase() || ''}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-xs text-white/30 line-clamp-2 mb-3">{plan.description}</p>
                    )}

                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {plan.features.slice(0, 3).map((f: string, i: number) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-white/40">
                            <CheckCircle className="h-3 w-3 text-emerald-400/60 shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                        {plan.features.length > 3 && (
                          <p className="text-[10px] text-white/20 pl-4">+{plan.features.length - 3} autres</p>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1 text-xs text-white/30">
                        <Users className="h-3 w-3" />
                        {plan.subscriberCount || 0} abonné{(plan.subscriberCount || 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/30">
                        <Clock className="h-3 w-3" />
                        {DURATION_LABELS[plan.duration] || ''}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
