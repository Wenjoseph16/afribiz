'use client';

import { useState } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Boxes,
  Users,
  CalendarCheck2,
  Bot,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';
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

export default function BusinessSubscriptionPage() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: overview, isLoading } = useQuery({
    queryKey: ['business', 'plan'],
    queryFn: async () => {
      const res = await apiClient.get('/business/plan');
      return res.data.data as PlanOverview;
    },
  });

  if (isLoading) return <Loader className="py-20" />;

  const plan = overview;
  const priceLabel = plan
    ? plan.isPromo
      ? '0 FCFA'
      : `${Number(plan.price).toLocaleString('fr-FR')} FCFA`
    : '—';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-down',
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      <PageHeader
        title="Mon abonnement"
        description="Votre plan AfriBiz — tout inclus, gratuit pour le lancement"
        breadcrumbs={[{ label: 'Business', href: '/dashboard/business' }, { label: 'Abonnement' }]}
      />

      {/* Current Plan */}
      <Card
        padding="lg"
        className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="p-3 rounded-xl shrink-0 bg-emerald-100 dark:bg-emerald-900/40">
              <CreditCard className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {plan?.planName || 'AfriBiz'}
                </h3>
                {plan?.badge && (
                  <Badge variant="success" size="sm" className="whitespace-normal">
                    {plan.badge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {plan?.description || "L'abonnement unique, tout inclus."}
              </p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge variant="success" size="sm">
                  Actif
                </Badge>
                {plan?.isPromo && (
                  <Badge variant="default" size="sm">
                    Promo de lancement
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{priceLabel}</p>
            <p className="text-xs text-gray-500">/ mois · pendant la promo</p>
          </div>
        </div>

        {plan?.benefits && plan.benefits.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-2 mt-6 pt-6 border-t border-emerald-100 dark:border-emerald-900/30">
            {plan.benefits.map((b) => (
              <div key={b} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quotas d'utilisation */}
      <Card title="Vos limites actuelles">
        {plan?.quotas && plan.quotas.length > 0 ? (
          <div className="space-y-5">
            {plan.quotas.map((q) => {
              const Icon = QUOTA_ICONS[q.code] || Boxes;
              const unlimited = q.limit === null;
              const pct = unlimited ? 0 : Math.min(100, Math.round((q.used / (q.limit || 1)) * 100));
              const warn = !unlimited && pct >= 80;
              return (
                <div key={q.code}>
                  <div className="flex items-center justify-between mb-1.5 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 min-w-0">
                      <Icon className="h-4 w-4 text-brand shrink-0" />
                      <span className="truncate">{q.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {unlimited ? (
                        <Badge variant="success" size="sm">
                          Illimité
                        </Badge>
                      ) : (
                        <span
                          className={cn(
                            'text-xs font-semibold',
                            warn ? 'text-amber-600' : 'text-gray-500'
                          )}
                        >
                          {q.used} / {q.limit}
                        </span>
                      )}
                    </div>
                  </div>
                  {!unlimited && (
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
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
        ) : (
          <p className="text-sm text-gray-500">Aucune limite — votre plan est illimité.</p>
        )}
      </Card>

      {/* Copilot inclus */}
      <Card padding="lg" className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200/50">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl shrink-0 bg-purple-100 dark:bg-purple-900/40">
            <Bot className="h-6 w-6 text-purple-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              Copilot IA
              <Badge variant="success" size="sm">
                Inclus gratuitement
              </Badge>
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Votre assistant intelligent : brief du matin, alertes de stock, prévisions de ventes.
              Inclus avec AfriBiz pendant la promo de lancement.
            </p>
            <Link
              href="/dashboard/business/copilot"
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Ouvrir mon Copilot
            </Link>
          </div>
        </div>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-medium mb-1">💡 Comment la plateforme gagne de l&apos;argent ?</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>1% de commission sur chaque transaction réussie (Mobile Money, carte)</li>
          <li>2% de commission sur le service Escrow (tiers de confiance)</li>
          <li>Aucun abonnement à payer pendant la promo de lancement</li>
          <li>Après le lancement, AfriBiz passera à 5 000 FCFA/mois — les commissions resteront identiques</li>
        </ul>
      </div>
    </div>
  );
}
