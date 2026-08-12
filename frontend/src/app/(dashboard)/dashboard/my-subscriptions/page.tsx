'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Crown,
  Loader2,
  Repeat,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  XCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  useMySubscription,
  useCancelMySubscription,
  useConfirmSubscriptionPayment,
} from '@/features/hooks';

const CYCLE_NAMES: Record<string, string> = {
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  SEMI_ANNUAL: 'Semestriel',
  ANNUAL: 'Annuel',
  CUSTOM: 'Personnalisé',
  DAILY: 'Journalier',
};

export default function MySubscriptionsPage() {
  const [cancelOpen, setCancelOpen] = useState(false);
  const { data: subscription, isLoading, error, refetch } = useMySubscription();
  const cancelMutation = useCancelMySubscription();
  const confirmPaymentMutation = useConfirmSubscriptionPayment();
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const isPendingPayment = subscription?.status === 'SUSPENDED';
  const pendingProviderRef = subscription?.pendingPayment?.providerRef;

  const handleConfirmPayment = () => {
    if (!pendingProviderRef) return;
    setConfirmError(null);
    setConfirming(true);
    confirmPaymentMutation.mutate(pendingProviderRef, {
      onSuccess: () => {
        setConfirming(false);
        refetch();
      },
      onError: (err: any) => {
        setConfirming(false);
        setConfirmError(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            'Erreur lors de la confirmation. Réessayez.'
        );
      },
    });
  };

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (error) {
    // 404 = pas d'abonnement → état vide propre (React Query retry:false)
    const isNotFound = String((error as any)?.response?.status || error) === '404';
    if (!isNotFound) return <ErrorState message="Erreur de chargement" onRetry={refetch} />;
  }

  const hasSubscription = !!subscription;

  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const daysLeft = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Mes abonnements"
        description="Gérez vos forfaits et abonnements auprès de vos commerçants préférés"
        breadcrumbs={[{ label: 'Abonnements' }]}
      />

      {!hasSubscription ? (
        <EmptyState
          icon={<Repeat className="h-12 w-12" />}
          title="Aucun abonnement actif"
          description="Vous n'avez pas encore souscrit à un abonnement. Découvrez les forfaits proposés par les business de la marketplace (salle de sport, salon, restaurant, hôtel...)."
          action={
            <Link href="/dashboard/explore">
              <Button variant="primary">
                <Store className="h-4 w-4 mr-2" />
                Explorer la marketplace
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Bandeau paiement en attente */}
          {isPendingPayment && (
            <Card className="p-5 border-amber-200 dark:border-amber-800/50 bg-amber-50/70 dark:bg-amber-900/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 shrink-0">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Paiement en attente de confirmation
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {subscription?.pendingPayment?.provider
                      ? `Une demande de ${Number(subscription?.pendingPayment?.amount || subscription?.plan?.price || 0).toLocaleString('fr-FR')} ${subscription?.plan?.currency || 'FCFA'} a été envoyée via ${subscription.pendingPayment.provider}. Confirmez-la sur votre téléphone puis validez ici.`
                      : 'Votre souscription est en attente de paiement. Confirmez votre paiement Mobile Money pour activer votre abonnement.'}
                  </p>
                  {subscription?.pendingPayment?.providerRef && (
                    <p className="text-[11px] text-gray-400 mt-1 font-mono">
                      Référence : {subscription.pendingPayment.providerRef}
                    </p>
                  )}
                  {confirmError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">{confirmError}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="primary"
                    onClick={handleConfirmPayment}
                    disabled={confirming || !pendingProviderRef}
                  >
                    {confirming ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    J&apos;ai confirmé le paiement
                  </Button>
                  {!pendingProviderRef && (
                    <Link href={`/business/${subscription?.business?.slug || ''}`}>
                      <Button variant="outline">
                        <Store className="h-4 w-4 mr-2" />
                        Retour au business
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Abonnement</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
                    {subscription?.plan?.name || 'Actif'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Statut</p>
                  {isPendingPayment ? (
                    <Badge variant="warning" size="sm">
                      Paiement en attente
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm">
                      Actif
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Échéance</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {endDate
                      ? endDate.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Jours restants</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {daysLeft !== null ? daysLeft : '—'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Carte abonnement */}
          <Card className="p-6 overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand via-emerald-400 to-brand" />
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/15 to-emerald-500/15 flex items-center justify-center text-brand shrink-0">
                <Crown className="h-7 w-7" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {subscription?.plan?.name}
                  </h2>
                  {subscription?.plan?.badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand">
                      {subscription?.plan?.badge}
                    </span>
                  )}
                  {isExpiringSoon && (
                    <Badge variant="warning" size="xs">
                      Expire bientôt
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {subscription?.business?.name || 'Business'} ·{' '}
                  {CYCLE_NAMES[subscription?.plan?.billingCycle || ''] || 'Mensuel'}
                </p>

                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {Number(subscription?.plan?.price || 0).toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">
                    {subscription?.plan?.currency || 'FCFA'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {' '}
                    · renouvellement{' '}
                    {subscription?.autoRenew ? 'automatique' : 'manuel'}
                  </span>
                </div>

                {subscription?.plan?.benefits && subscription.plan.benefits.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {subscription.plan.benefits.map((b: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Sparkles className="h-3.5 w-3.5 text-brand shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="lg:w-64 shrink-0 space-y-2">
                <Link href={subscription?.business?.slug ? `/business/${subscription.business.slug}` : '#'}>
                  <Button variant="secondary" className="w-full">
                    <Store className="h-4 w-4 mr-2" />
                    Voir le business
                  </Button>
                </Link>
                {!isPendingPayment && (
                  <Button
                    variant="outline"
                    className="w-full !text-red-600 hover:!bg-red-50 dark:hover:!bg-red-900/20"
                    onClick={() => setCancelOpen(true)}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Résilier l&apos;abonnement
                  </Button>
                )}
                <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Géré en toute transparence
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Modal résiliation */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)}>
        <div className="p-6">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500 mb-4">
            <XCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Résilier votre abonnement ?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Vous perdrez l&apos;accès aux avantages de « {subscription?.plan?.name} » à la fin de la
            période en cours. Cette action est définitive.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Garder mon abonnement
            </Button>
            <Button
              variant="danger"
              disabled={cancelMutation.isPending}
              onClick={() => {
                cancelMutation.mutate(undefined, {
                  onSuccess: () => setCancelOpen(false),
                });
              }}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Oui, résilier
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
