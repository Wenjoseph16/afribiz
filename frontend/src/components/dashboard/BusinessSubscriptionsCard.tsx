'use client';

import Link from 'next/link';
import { Repeat, TrendingUp, Users, AlertTriangle, Wallet, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useSubscriptionStats } from '@/features/hooks';

/**
 * Widget cockpit business : revenus récurrents (abonnements).
 * Données servies par GET /business/subscriptions/stats → getSubscriptionStats
 * (MRR normalisé au mois, revenu du mois, abonnés actifs, expirations 7j/30j).
 */
export default function BusinessSubscriptionsCard() {
  const { data: raw } = useSubscriptionStats();
  const stats = ((raw?.data || raw) as any) || {};

  const hasData = (stats.totalSubscribers ?? 0) > 0;

  return (
    <Card padding="lg" className="h-full relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand via-emerald-400 to-brand" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-900/30">
            <Repeat className="h-4.5 w-4.5 text-brand" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Abonnements</p>
            <p className="text-[11px] text-gray-400">Revenus récurrents</p>
          </div>
        </div>
        <Link
          href="/dashboard/subscriptions/stats"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand/5 hover:bg-brand/10 text-brand text-[11px] font-semibold transition-colors"
        >
          Détails
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <Repeat className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aucun abonné pour le moment</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Proposez des forfaits (gym, salon, coaching…) et créez vos premiers abonnements.
          </p>
          <Link
            href="/dashboard/subscriptions/new"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-brand hover:text-brand-700"
          >
            Créer un plan
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* MRR + revenu du mois */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gradient-to-br from-brand-500/10 to-emerald-500/10 border border-brand/10 p-3">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-brand" />
                MRR
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {Number(stats.mrr || 0).toLocaleString()}{' '}
                <span className="text-xs font-medium text-gray-400">FCFA/mois</span>
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-3">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="h-3 w-3 text-emerald-600" />
                Revenu du mois
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {Number(stats.monthRevenue || 0).toLocaleString()}{' '}
                <span className="text-xs font-medium text-gray-400">FCFA</span>
              </p>
            </div>
          </div>

          {/* Abonnés actifs + expirants */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-brand" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">
                  {stats.activeSubs ?? 0}
                </strong>{' '}
                abonné{Number(stats.activeSubs ?? 0) > 1 ? 's' : ''} actif
                {Number(stats.activeSubs ?? 0) > 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-xs text-gray-400">{stats.totalPlans ?? 0} plans</span>
          </div>

          {/* Expirations proches */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Expirations proches
            </p>
            {(stats.expiringSoon || []).length > 0 ? (
              <div className="space-y-2">
                {(stats.expiringSoon as any[]).slice(0, 3).map((s: any) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {s.clientName}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {s.planName} · {s.clientEmail}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                      J-{s.daysLeft}
                    </span>
                  </div>
                ))}
                {Number(stats.expiringIn30d || 0) > 3 && (
                  <p className="text-[11px] text-gray-400 text-center">
                    +{stats.expiringIn30d - 3} autres dans les 30 jours
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Aucune expiration dans les 7 prochains jours</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
