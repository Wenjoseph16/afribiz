'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Banknote, Lock, LockOpen, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

/** Widget cockpit — la caisse du jour en un coup d'œil (« il doit y avoir X F dans la boîte »). */
export function CashWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['cash', 'widget'],
    queryFn: async () => {
      const res = await apiClient.getCashWidget();
      return res.data?.data;
    },
  });

  const widget = data as any;

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-card dark:border-gray-700/80 dark:bg-gray-800/90">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Caisse du jour</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {widget?.open ? 'Ouverte — suivi en direct' : 'Non ouverte aujourd’hui'}
            </p>
          </div>
        </div>
        {widget?.open ? (
          <Badge variant="success">
            <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            En direct
          </Badge>
        ) : (
          <Badge variant="warning">Fermée</Badge>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Il doit y avoir dans la boîte
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isLoading ? '…' : formatPrice(widget?.totals?.expectedBalance ?? 0)}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-3 py-2.5 dark:border-emerald-900/30 dark:bg-emerald-900/15">
          <p className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" /> Entrées
          </p>
          <p className="mt-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {isLoading ? '…' : formatPrice(widget?.totals?.entries ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-3 py-2.5 dark:border-rose-900/30 dark:bg-rose-900/15">
          <p className="flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-3.5 w-3.5" /> Sorties
          </p>
          <p className="mt-0.5 text-sm font-bold text-rose-600 dark:text-rose-400">
            {isLoading ? '…' : formatPrice(widget?.totals?.expenses ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href="/dashboard/business/caisse"
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-slate-700 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {widget?.open ? (
            <>
              <Banknote className="h-4 w-4" /> Voir ma caisse
            </>
          ) : (
            <>
              <LockOpen className="h-4 w-4" /> Ouvrir la caisse
            </>
          )}
          <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
        </Link>
        {widget?.open && (
          <Link
            href="/dashboard/business/caisse"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 dark:border-gray-700 dark:text-slate-300 dark:hover:border-gray-600 dark:hover:text-white"
          >
            <Lock className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
