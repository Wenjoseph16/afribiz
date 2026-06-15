'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard, Check, Shield, Sparkles, ArrowLeft, Award, BadgeCheck,
  CheckCircle, AlertTriangle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  type: string;
  price: number;
  currency: string;
  billingCycle: string;
  trialDays: number | null;
  benefits: string[];
  isPublic: boolean;
  isActive: boolean;
  featured: boolean;
  badge: string | null;
}

export default function DeveloperSubscriptionPage() {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user && !user.roles?.includes('DEVELOPER') && user.primaryRole !== 'DEVELOPER') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const { data: plansData, isLoading: plansLoading, error, refetch } = useQuery({
    queryKey: ['developer', 'subscription-plans'],
    queryFn: async () => {
      const res = await apiClient.get('/subscriptions/plans');
      const data = res.data.data;
      return (data?.plans || data || []) as SubscriptionPlan[];
    },
  });

  const { data: currentSub, isLoading: subLoading } = useQuery({
    queryKey: ['developer', 'my-subscription'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/subscriptions/my-subscription');
        return res.data.data || null;
      } catch { return null; }
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiClient.post('/subscriptions/subscribe', { planId });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['developer', 'subscription-plans'] });
      qc.invalidateQueries({ queryKey: ['developer', 'my-subscription'] });
      setToast({ message: 'Abonnement souscrit avec succès !', type: 'success' });
      setSelectedPlan(null);
    },
    onError: (err: any) => {
      setToast({ message: err?.response?.data?.error || 'Erreur lors de la souscription', type: 'error' });
    },
  });

  const plans: SubscriptionPlan[] = Array.isArray(plansData) ? plansData : [];
  const hasActiveSub = !!currentSub;
  const isLoading = plansLoading || subLoading;

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="animate-fade-in space-y-6">
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

      <PageHeader
        title="Mon abonnement"
        description="Gérez votre abonnement développeur AfriBiz"
        breadcrumbs={[{ label: 'Développeur', href: '/dashboard/developer' }, { label: 'Abonnement' }]}
        actions={
          <Link href="/dashboard/developer">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Retour
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <Loader variant="spinner" size="md" />
      ) : plans.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-12 w-12" />}
          title="Aucun plan disponible"
          description="Il n'y a pas encore de plan d'abonnement pour les développeurs."
        />
      ) : (
        <>
          {/* Current plan info from API */}
          <Card padding="lg" className={cn(
            'bg-gradient-to-br',
            hasActiveSub
              ? 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/50'
              : 'from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200/50'
          )}>
            <div className="flex items-start gap-4">
              <div className={cn('p-3 rounded-xl shrink-0',
                hasActiveSub ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-indigo-100 dark:bg-indigo-900/40'
              )}>
                <Award className={cn('h-6 w-6', hasActiveSub ? 'text-emerald-600' : 'text-indigo-600')} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentSub?.plan?.name || 'Développeur AfriBiz'}
                  </h2>
                  <Badge variant={hasActiveSub ? 'success' : 'default'} size="xs">
                    {hasActiveSub ? 'Actif' : 'Gratuit'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {hasActiveSub
                    ? `Abonnement ${currentSub.plan.name} actif jusqu'au ${new Date(currentSub.endDate).toLocaleDateString('fr-FR')}`
                    : 'Vous êtes sur le plan Gratuit. Publiez vos modules et gagnez des commissions sur chaque vente.'
                  }
                </p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Publication de modules illimitée</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Commission 85% sur les ventes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>Support technique inclus</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {currentSub?.plan?.price ? `${Number(currentSub.plan.price).toLocaleString()} FCFA` : 'Gratuit'}
                </p>
                <p className="text-xs text-gray-500">
                  {currentSub?.plan?.price ? '/ mois' : '0 FCFA / mois'}
                </p>
              </div>
            </div>
          </Card>

          {/* Available plans */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
              {hasActiveSub ? 'Changer de plan' : 'Plans disponibles'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isCurrent = currentSub?.planId === plan.id;
                return (
                  <Card
                    key={plan.id}
                    padding="lg"
                    className={cn(
                      'relative flex flex-col border-2 transition-all duration-200 hover:shadow-md cursor-pointer',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-lg'
                        : plan.featured && !isCurrent
                          ? 'border-indigo-400 dark:border-indigo-500 shadow-indigo-200/50 dark:shadow-indigo-900/30'
                          : isCurrent
                            ? 'border-emerald-300 dark:border-emerald-700'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                    )}
                    onClick={() => !isCurrent && setSelectedPlan(plan.id)}
                  >
                    {plan.featured && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="brand" size="sm">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {plan.badge || 'RECOMMANDÉ'}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-indigo-500" />
                      <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">{plan.name}</h4>
                      {isCurrent && <Badge variant="success" size="xs">Actuel</Badge>}
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{plan.description}</p>

                    <div className="mb-4">
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {plan.price === 0 ? 'Gratuit' : `${Number(plan.price).toLocaleString()} ${plan.currency}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-gray-500 ml-1">
                          / {plan.billingCycle === 'MONTHLY' ? 'mois' : plan.billingCycle === 'YEARLY' ? 'an' : plan.billingCycle}
                        </span>
                      )}
                    </div>

                    {plan.trialDays && plan.trialDays > 0 && (
                      <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-3">
                        {plan.trialDays} jours d&apos;essai gratuit
                      </p>
                    )}

                    <ul className="space-y-2 flex-1 mb-4">
                      {plan.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                    {isCurrent ? (
                      <Button variant="secondary" className="w-full" disabled>
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Plan actuel
                      </Button>
                    ) : (
                      <Button
                        variant={isSelected ? 'gradient' : 'outline'}
                        className="w-full"
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
                        {isSelected ? 'Confirmer la souscription' :
                          plan.price === 0 ? 'Plan gratuit' :
                          plan.trialDays ? 'Commencer l\'essai' : `Choisir ${plan.name}`}
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
