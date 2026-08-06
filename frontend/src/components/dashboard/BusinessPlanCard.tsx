'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CreditCard,
  Sparkles,
  Boxes,
  Users,
  CalendarCheck2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Quota {
  code: string;
  label: string;
  used: number;
  limit: number | null;
}

interface PlanOverview {
  planId: string;
  planName: string;
  price: number;
  currency: string;
  billingCycle: string;
  badge: string | null;
  description: string | null;
  benefits: string[];
  isPromo: boolean;
  quotas: Quota[];
}

const QUOTA_ICONS: Record<string, typeof Boxes> = {
  PRODUCTS_LIMIT: Boxes,
  CLIENTS_LIMIT: Users,
  BOOKINGS_LIMIT: CalendarCheck2,
};

export default function BusinessPlanCard() {
  const { data: plan, isLoading } = useQuery({
    queryKey: ['business', 'plan'],
    queryFn: async () => {
      const res = await apiClient.get('/business/plan');
      return res.data.data as PlanOverview;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="h-48 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />
    );
  }

  if (!plan) return null;

  return (
    <Card
      padding="lg"
      className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50 h-full"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 shrink-0">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate">
                Plan {plan.planName}
              </h3>
              {plan.isPromo && (
                <Badge variant="success" size="sm">
                  Promo
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {plan.isPromo ? '0 FCFA/mois pendant le lancement' : `${plan.price.toLocaleString('fr-FR')} FCFA/mois`}
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/business/subscription"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 shrink-0"
        >
          Gérer
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {plan.badge && (
        <p className="mt-3 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-800 rounded-lg px-2.5 py-1.5">
          {plan.badge}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {plan.quotas.map((q) => {
          const Icon = QUOTA_ICONS[q.code] || Boxes;
          const unlimited = q.limit === null;
          const pct = unlimited ? 0 : Math.min(100, Math.round((q.used / (q.limit || 1)) * 100));
          const warn = !unlimited && pct >= 80;
          return (
            <div key={q.code}>
              <div className="flex items-center justify-between mb-1 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 min-w-0">
                  <Icon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate">{q.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                  {unlimited ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Illimité
                    </span>
                  ) : (
                    `${q.used} / ${q.limit}`
                  )}
                </span>
              </div>
              {!unlimited && (
                <div className="h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      warn ? 'bg-amber-500' : 'bg-gradient-to-r from-brand to-emerald-400'
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {plan.benefits && plan.benefits.length > 0 && (
        <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-900/30">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">
            Inclus
          </p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
            {plan.benefits.slice(0, 3).join(' · ')}
          </p>
        </div>
      )}
    </Card>
  );
}
