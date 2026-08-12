'use client';

import Link from 'next/link';
import {
  Wallet,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Banknote,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { usePaymentStats } from '@/features/hooks';

/**
 * Widget cockpit business : Créances (le « carnet » du commerçant).
 * Données servies par GET /business/finance/stats → getPaymentStats
 * (reste à encaisser, dettes en retard, recouvré, taux de recouvrement, clients à risque).
 */
export default function BusinessDebtsCard() {
  const { data: raw } = usePaymentStats();
  const stats = ((raw?.data || raw) as any) || {};

  const active = Number(stats.activeDebtAmount || 0);
  const hasData = active > 0 || Number(stats.overdueDebts || 0) > 0;

  return (
    <Card padding="lg" className="h-full relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-red-500" />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30">
            <Wallet className="h-4.5 w-4.5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">Créances</p>
            <p className="text-[11px] text-gray-400">Le carnet des clients qui doivent</p>
          </div>
        </div>
        <Link
          href="/dashboard/debts-payments"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-brand/5 hover:bg-brand/10 text-brand text-[11px] font-semibold transition-colors"
        >
          Gérer
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {!hasData ? (
        <div className="text-center py-8">
          <Wallet className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aucune créance en cours 🎉</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Les ventes à crédit au Point de Vente créent des dettes ici automatiquement.
          </p>
          <Link
            href="/dashboard/business/pos"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-brand hover:text-brand-700"
          >
            Ouvrir le Point de Vente
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Reste à encaisser */}
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-red-500/10 border border-amber/10 border-amber-200/40 dark:border-amber-800/30 p-3">
            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-amber-600" />
              Reste à encaisser
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {active.toLocaleString('fr-FR')}{' '}
              <span className="text-xs font-medium text-gray-400">FCFA</span>
            </p>
          </div>

          {/* En retard + critiques */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 p-3">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                En retard
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {Number(stats.overdueDebts || 0)}
              </p>
            </div>
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 p-3">
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-red-500" />
                Critiques
              </p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {Number(stats.criticalDebts || 0)}
              </p>
            </div>
          </div>

          {/* Taux de recouvrement */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald-600" />
                Taux de recouvrement
              </span>
              <span className="font-semibold text-emerald-600">
                {Number(stats.recoveryRate || 0)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all"
                style={{ width: `${Math.min(100, Number(stats.recoveryRate || 0))}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {Number(stats.totalRecovered || 0).toLocaleString('fr-FR')} FCFA déjà recouvrés
              {Number(stats.highRiskClients || 0) > 0 &&
                ` · ${stats.highRiskClients} client${Number(stats.highRiskClients) > 1 ? 's' : ''} à risque`}
            </p>
          </div>

          {/* Rappels auto */}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Rappels automatiques{' '}
                <strong className="text-gray-900 dark:text-gray-100">J+3 · J+7 · J+15 · J+30</strong>
              </span>
            </div>
            <Link
              href="/dashboard/debts-payments/settings"
              className="text-[11px] font-semibold text-brand hover:text-brand-700"
            >
              Configurer
            </Link>
          </div>

          <Link
            href="/dashboard/business/pos"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors"
          >
            <Banknote className="h-4 w-4" />
            Encaisser une dette au comptoir
          </Link>
        </div>
      )}
    </Card>
  );
}
