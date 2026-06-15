'use client';

import { useState } from 'react';
import {
  CreditCard, CheckCircle, Clock, AlertTriangle,
  ArrowLeft, Sparkles, XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number;
  currency: string;
  billingCycle: string;
  benefits: string[];
  isPublic: boolean;
  isActive: boolean;
  featured: boolean;
  badge: string | null;
  trialDays: number | null;
}

export default function BusinessSubscriptionPage() {
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch plans from API
  const { data: plansData, isLoading } = useQuery({
    queryKey: ['subscriptions', 'plans'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions/plans');
      const data = res.data.data;
      return (data?.plans || data || []) as Plan[];
    },
  });

  // Fetch current subscription
  const { data: currentSub, isLoading: subLoading } = useQuery({
    queryKey: ['subscriptions', 'my-subscription'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/subscriptions/my-subscription');
        return res.data.data || null;
      } catch { return null; }
    },
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiClient.post('/subscriptions/subscribe', { planId });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      setToast({ message: 'Abonnement souscrit avec succès !', type: 'success' });
      setSelectedPlan(null);
    },
    onError: (err: any) => {
      setToast({ message: err?.response?.data?.error || 'Erreur lors de la souscription', type: 'error' });
    },
  });

  const plans: Plan[] = Array.isArray(plansData) ? plansData : [];
  const hasActiveSub = !!currentSub;

  if (isLoading || subLoading) return <Loader className="py-20" />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-down',
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
        )}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/dashboard/business" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Mon abonnement</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gérez votre abonnement AfriBiz</p>
        </div>
      </div>

      {/* Current Plan */}
      <Card padding="lg" className={cn(
        'bg-gradient-to-br',
        hasActiveSub ? 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50' : 'from-gray-50 to-white dark:from-gray-800/30 dark:to-gray-900'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-xl', hasActiveSub ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-brand-50 dark:bg-brand-900/20')}>
              <CreditCard className={cn('h-6 w-6', hasActiveSub ? 'text-emerald-600' : 'text-brand')} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {currentSub?.plan?.name || 'Plan Gratuit'}
              </h3>
              <p className="text-sm text-gray-500">
                {hasActiveSub ? 'Abonnement actif' : 'Aucun abonnement actif'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {hasActiveSub ? (
                  <Badge variant="success" size="sm">Actif</Badge>
                ) : (
                  <Badge variant="default" size="sm">Pay-as-you-go</Badge>
                )}
                {currentSub?.endDate && (
                  <span className="text-xs text-gray-400">
                    Expire le {new Date(currentSub.endDate).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentSub?.plan?.price ? `${Number(currentSub.plan.price).toLocaleString()} FCFA` : '0 FCFA'}
            </p>
            <p className="text-xs text-gray-500">/ mois</p>
          </div>
        </div>
      </Card>

      {/* Plans disponibles */}
      {plans.length > 0 && (
        <>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {hasActiveSub ? 'Changer de plan' : 'Choisissez un plan'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isCurrent = currentSub?.planId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-2xl border-2 p-5 transition-all cursor-pointer',
                    isSelected ? 'border-brand bg-brand-5 dark:bg-brand-900/10 shadow-lg shadow-brand-500/10' :
                    plan.featured ? 'border-brand-300 dark:border-brand-700 bg-white dark:bg-gray-800' :
                    'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                  )}
                  onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                >
                  {plan.featured && !isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand text-white text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {plan.badge || 'Populaire'}
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                    )}
                    <div className="mt-2">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        {plan.price === 0 ? 'Gratuit' : `${Number(plan.price).toLocaleString()} FCFA`}
                      </span>
                      <span className="text-sm text-gray-500">/mois</span>
                    </div>
                    {plan.price === 0 && <p className="text-xs text-gray-400 mt-1">Paiement à l&apos;usage</p>}
                    {plan.trialDays && plan.trialDays > 0 && (
                      <p className="text-xs text-indigo-600 mt-1">{plan.trialDays} jours d&apos;essai</p>
                    )}
                  </div>
                  <ul className="space-y-2 mt-4">
                    {plan.benefits.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full mt-6" variant="secondary" disabled>
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      Plan actuel
                    </Button>
                  ) : (
                    <Button
                      className="w-full mt-6"
                      variant={isSelected ? 'primary' : 'outline'}
                      isLoading={subscribeMutation.isPending && isSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) {
                          subscribeMutation.mutate(plan.id);
                        } else {
                          setSelectedPlan(plan.id);
                        }
                      }}
                    >
                      {isSelected ? 'Confirmer la souscription' : `Choisir ${plan.name}`}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Payment History */}
      <Card title="Historique de facturation">
        {currentSub?._count?.payments && currentSub._count.payments > 0 ? (
          <p className="text-sm text-gray-500">{currentSub._count.payments} paiement(s) enregistré(s)</p>
        ) : (
          <EmptyState
            icon={<Clock className="h-8 w-8" />}
            title="Aucune facture"
            description="Votre historique de facturation apparaîtra ici après votre premier abonnement."
          />
        )}
      </Card>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <p className="font-medium mb-1">💡 Pourquoi passer à un plan payant ?</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Réduisez vos commissions de 1% à 0% sur les transactions</li>
          <li>Accédez à des fonctionnalités exclusives (API, marketplace prioritaire)</li>
          <li>Bénéficiez d&apos;un support dédié et prioritaire</li>
          <li>Pas d&apos;engagement — annulez à tout moment</li>
        </ul>
      </div>
    </div>
  );
}
