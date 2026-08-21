'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  HeartPulse,
  AlertTriangle,
  AlertCircle,
  Wallet,
  Package,
  HandCoins,
  TrendingUp,
  ArrowRight,
  Building2,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

const SEVERITY_STYLES: Record<string, { label: string; cls: string; icon: any }> = {
  high: { label: 'Critique', cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  medium: {
    label: 'À surveiller',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
  },
  low: { label: 'Info', cls: 'bg-sky-50 text-sky-700 border-sky-200', icon: AlertTriangle },
};

const SCORE_STYLES: Record<string, { ring: string; text: string; label: string }> = {
  good: { ring: 'stroke-emerald-500', text: 'text-emerald-600', label: 'Sain' },
  warning: { ring: 'stroke-amber-500', text: 'text-amber-600', label: 'À surveiller' },
  critical: { ring: 'stroke-red-500', text: 'text-red-600', label: 'Critique' },
};

function fmt(n: number | null | undefined) {
  return Number(n || 0).toLocaleString('fr-FR');
}

function ScoreRing({ score, status }: { score: number; status: string }) {
  const s = SCORE_STYLES[status] || SCORE_STYLES.good;
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="7"
          className="text-gray-100 dark:text-gray-800"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={cn('transition-all duration-700', s.ring)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-xl font-bold leading-none', s.text)}>{score}</span>
        <span className="text-[9px] uppercase tracking-wide text-gray-400 mt-0.5">{s.label}</span>
      </div>
    </div>
  );
}

/** Cockpit Santé du Boss (Chantier 5 — Brique B). Centre le pilotage, ne supprime rien. */
export function CockpitBoss() {
  const [activeBusinessId, setActiveBusinessId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['boss-cockpit'],
    queryFn: async () => {
      const res = await apiClient.getBossCockpit();
      return res.data.data;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Card padding="lg" className="animate-pulse">
        <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800" />
      </Card>
    );
  }

  if (error || !data) {
    return null; // Le cockpit est une couche — si elle échoue, le dashboard reste intact
  }

  const businesses = data.businesses || [];
  const consolidated = data.consolidated;
  const hasMultiple = data.hasMultiple;
  const active = activeBusinessId ? businesses.find((b: any) => b.id === activeBusinessId) : null;
  const current = active || (businesses[0] as any) || null;
  const anomalies = current?.anomalies || [];
  const cash = current?.cash || {};
  const stock = current?.stock || {};
  const today = current?.today || {};

  const quickActions = [
    { label: 'Vendre (POS)', href: '/dashboard/business/pos', icon: Wallet },
    { label: 'Ma caisse', href: '/dashboard/business/caisse', icon: HandCoins },
    { label: 'Commandes', href: '/dashboard/orders', icon: TrendingUp },
    { label: 'Ajouter un produit', href: '/dashboard/products/new', icon: Package },
  ];

  return (
    <Card padding="lg" className="overflow-hidden border-slate-200/80 dark:border-slate-800">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Score + identité */}
        <div className="flex items-center gap-5">
          <ScoreRing score={current?.score ?? 0} status={current?.status || 'good'} />
          <div>
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Cockpit Santé
              </p>
            </div>
            <h2 className="mt-1 text-xl font-display font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
              {current?.name || 'Mon entreprise'}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              {cash.open
                ? `Caisse ouverte · ${fmt(cash.expectedBalance)} F attendus`
                : 'Caisse fermée — ouvrez-la pour commencer la journée'}
            </p>
            {/* Bascule multi-activités */}
            {hasMultiple && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {businesses.map((b: any) => (
                  <button
                    key={b.id}
                    onClick={() => setActiveBusinessId(b.id === current?.id ? null : b.id)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                      b.id === current?.id
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    <Building2 className="h-3 w-3" />
                    {b.name}
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        b.status === 'good'
                          ? 'bg-emerald-500'
                          : b.status === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      )}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Caisse attendue
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">{fmt(cash.expectedBalance)} F</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Stock (prix vente)
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">{fmt(stock.valueAtSale)} F</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Créances clients
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">{fmt(current?.debts)} F</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              CA aujourd'hui
            </p>
            <p className="mt-1 text-lg font-bold text-gray-900">{fmt(today.revenue)} F</p>
            <p className="text-[10px] text-slate-400">{today.ordersCount || 0} vente(s)</p>
          </div>
        </div>
      </div>

      {/* Anomalies */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        {anomalies.length === 0 ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm text-emerald-700">
              Tout est cohérent — aucune anomalie détectée sur {current?.name}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Anomalies détectées ({anomalies.length})
            </p>
            {anomalies.slice(0, 4).map((a: any, i: number) => {
              const s = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.low;
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-2.5"
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 mt-0.5',
                      a.severity === 'high'
                        ? 'text-red-500'
                        : a.severity === 'medium'
                          ? 'text-amber-500'
                          : 'text-sky-500'
                    )}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{a.message}</p>
                    {a.gap != null && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Attendu {fmt(a.expected)} F · comptabilisé {fmt(a.accounted)} F
                      </p>
                    )}
                  </div>
                  <Badge className={cn('shrink-0', s.cls)}>{s.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions rapides + vue consolidée */}
      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Actions :
          </span>
          {quickActions.map((qa) => (
            <Link key={qa.href} href={qa.href}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <qa.icon className="h-3.5 w-3.5" />
                {qa.label}
              </Button>
            </Link>
          ))}
        </div>
        {hasMultiple && consolidated && (
          <Link href="/dashboard/business/cockpit" className="group">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 group-hover:underline">
              Vue consolidée — {consolidated.businessCount} activités ·{' '}
              {consolidated.highAnomalyCount > 0
                ? `${consolidated.highAnomalyCount} anomalie(s) critique(s)`
                : 'tout est sain'}
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}
      </div>
    </Card>
  );
}
