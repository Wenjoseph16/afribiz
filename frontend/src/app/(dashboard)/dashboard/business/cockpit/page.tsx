'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  HeartPulse,
  AlertCircle,
  AlertTriangle,
  Wallet,
  Package,
  HandCoins,
  TrendingUp,
  ArrowLeft,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';
import { Loader } from '@/components/ui/Loader';

function fmt(n: number | null | undefined) {
  return Number(n || 0).toLocaleString('fr-FR');
}

const SCORE_STYLES: Record<string, string> = {
  good: 'text-emerald-600',
  warning: 'text-amber-600',
  critical: 'text-red-600',
};

export default function BossCockpitPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['boss-cockpit-consolidated'],
    queryFn: async () => {
      const res = await apiClient.getBossCockpit();
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">Impossible de charger le cockpit. Réessayez.</p>
      </Card>
    );
  }

  const { businesses = [], consolidated, hasMultiple } = data;
  const allAnomalies = data.anomalies || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/business"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Tableau de bord
          </Link>
          <h1 className="mt-2 text-2xl font-display font-bold text-gray-900 tracking-tight">
            Vue consolidée — toutes vos activités
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Le pouls de chaque entreprise, en un coup d'œil
          </p>
        </div>
      </div>

      {/* Consolidated summary */}
      {consolidated && (
        <Card
          padding="lg"
          className="border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50"
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Score global
              </p>
              <p className={cn('mt-1 text-3xl font-bold', SCORE_STYLES[consolidated.status])}>
                {consolidated.score}/100
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Caisse attendue
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {fmt(consolidated.totalExpectedCash)} F
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Stock total
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {fmt(consolidated.totalStockValue)} F
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                Créances totales
              </p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {fmt(consolidated.totalDebts)} F
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Anomalies :
            </span>
            {allAnomalies.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" /> Tout est sain
              </span>
            ) : (
              <Badge
                className={cn(
                  consolidated.highAnomalyCount > 0
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                )}
              >
                {consolidated.anomalyCount} détectée(s)
                {consolidated.highAnomalyCount > 0
                  ? ` dont ${consolidated.highAnomalyCount} critique(s)`
                  : ''}
              </Badge>
            )}
          </div>
        </Card>
      )}

      {/* Businesses grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        {businesses.map((b: any) => (
          <Card key={b.id} padding="lg" className="border-slate-200/80">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {String(b.type || '').toLowerCase()}
                  </p>
                </div>
              </div>
              <span className={cn('text-2xl font-bold', SCORE_STYLES[b.status])}>{b.score}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                <Wallet className="h-3.5 w-3.5 text-slate-400" />
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {fmt(b.cash?.expectedBalance)} F
                </p>
                <p className="text-[10px] text-slate-400">caisse</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                <Package className="h-3.5 w-3.5 text-slate-400" />
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {fmt(b.stock?.valueAtSale)} F
                </p>
                <p className="text-[10px] text-slate-400">stock</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                <HandCoins className="h-3.5 w-3.5 text-slate-400" />
                <p className="mt-1 text-sm font-semibold text-gray-800">{fmt(b.debts)} F</p>
                <p className="text-[10px] text-slate-400">créances</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {fmt(b.today?.revenue)} F
                </p>
                <p className="text-[10px] text-slate-400">CA jour</p>
              </div>
            </div>

            {b.anomalies?.length > 0 ? (
              <div className="mt-3 space-y-1.5">
                {b.anomalies.slice(0, 3).map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    {a.severity === 'high' ? (
                      <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                    )}
                    <span className="text-gray-700">{a.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Aucune anomalie
              </p>
            )}

            <Link
              href="/dashboard/business"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Piloter {b.name} →
            </Link>
          </Card>
        ))}
      </div>

      {!hasMultiple && businesses.length === 1 && (
        <p className="text-center text-sm text-slate-400">
          Vous avez 1 activité. Créez-en d'autres depuis votre espace pour piloter plusieurs
          entreprises.
        </p>
      )}
    </div>
  );
}
