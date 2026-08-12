'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  Crown,
  Gift,
  Info,
  Loader2,
  Repeat,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useSubscribeToPlan, useConfirmSubscriptionPayment } from '@/features/hooks';

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: '/ semaine',
  MONTHLY: '/ mois',
  QUARTERLY: '/ trimestre',
  SEMI_ANNUAL: '/ semestre',
  SEMESTRIAL: '/ semestre',
  ANNUAL: '/ an',
  YEARLY: '/ an',
  CUSTOM: '',
  DAILY: '/ jour',
};

const CYCLE_NAMES: Record<string, string> = {
  WEEKLY: 'Hebdomadaire',
  MONTHLY: 'Mensuel',
  QUARTERLY: 'Trimestriel',
  SEMI_ANNUAL: 'Semestriel',
  SEMESTRIAL: 'Semestriel',
  ANNUAL: 'Annuel',
  YEARLY: 'Annuel',
  CUSTOM: 'Personnalisé',
  DAILY: 'Journalier',
};

const MOBILE_MONEY_PROVIDERS = [
  { id: 'WAVE', label: 'Wave', color: 'bg-emerald-500', countries: "Sénégal, Côte d'Ivoire" },
  { id: 'MTN_MOMO', label: 'MTN MoMo', color: 'bg-red-500', countries: 'Ghana, Ouganda, Rwanda' },
  { id: 'ORANGE_MONEY', label: 'Orange Money', color: 'bg-orange-500', countries: "Côte d'Ivoire, Sénégal, Mali" },
  { id: 'TMONEY', label: 'T-Money', color: 'bg-blue-500', countries: 'Togo' },
  { id: 'FLOOZ', label: 'Flooz', color: 'bg-yellow-500', countries: 'Togo, Bénin' },
  { id: 'MOOV_MONEY', label: 'Moov Money', color: 'bg-sky-600', countries: 'Bénin, Togo, Côte d\u2019Ivoire' },
  { id: 'AIRTEL_MONEY', label: 'Airtel Money', color: 'bg-red-600', countries: 'Ghana, Ouganda' },
  { id: 'MPESA', label: 'M-Pesa', color: 'bg-green-600', countries: 'Kenya, Tanzanie, RDC' },
  { id: 'FREE', label: 'Free Money', color: 'bg-fuchsia-600', countries: 'Sénégal' },
  { id: 'FEDAPAY', label: 'FedaPay', color: 'bg-violet-500', countries: 'Multi-pays (cartes + Mobile Money)' },
];

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  type?: string;
  price: number;
  currency?: string;
  billingCycle?: string;
  trialDays?: number | null;
  durationDays?: number | null;
  benefits?: string[];
  badge?: string | null;
  featured?: boolean;
  isActive?: boolean;
  _count?: { subscribers?: number };
  privileges?: { label: string; description?: string | null }[];
}

interface SubscriptionsProps {
  slug: string;
  plans: Plan[];
}

type FlowStep = 'confirm' | 'pay' | 'pending' | 'success';

export function Subscriptions({ slug, plans }: SubscriptionsProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const subscribeMutation = useSubscribeToPlan();
  const confirmMutation = useConfirmSubscriptionPayment();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<FlowStep>('confirm');
  const [provider, setProvider] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [providerRef, setProviderRef] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!plans?.length) return null;

  const activePlans = plans.filter((p) => p.isActive !== false);

  const handleSubscribe = (plan: Plan) => {
    if (!isAuthenticated() || !user) {
      router.push(`/login?redirect=/business/${slug}`);
      return;
    }
    setSelectedPlan(plan);
    setStep('confirm');
    setErrorMsg(null);
    setPaymentMessage('');
    setProviderRef('');
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setStep('confirm');
    setErrorMsg(null);
    setPaymentMessage('');
    setProviderRef('');
    setPhone('');
    setPhoneError('');
  };

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/[\s-]/g, '');
    if (cleaned.length < 8) return 'Numéro trop court';
    if (!/^\+?\d{8,15}$/.test(cleaned)) return 'Format invalide (ex: +2250708091011)';
    return '';
  };

  // Étape 1 : confirmation → on passe au paiement
  const goToPayment = () => {
    setErrorMsg(null);
    setStep('pay');
  };

  // Étape 2 : initier le paiement Mobile Money
  const initiatePayment = () => {
    if (!selectedPlan) return;
    if (!provider) {
      setErrorMsg('Choisissez un moyen de paiement');
      return;
    }
    const err = validatePhone(phone);
    if (err) {
      setPhoneError(err);
      return;
    }
    setPhoneError('');
    setErrorMsg(null);
    setPaymentMessage('Initialisation du paiement...');
    subscribeMutation.mutate(
      { planId: selectedPlan.id, opts: { provider, phone: phone.replace(/[\s-]/g, '') } },
      {
        onSuccess: (res: any) => {
          const data = res?.data?.data;
          // Succès immédiat (mode test / provider instantané)
          if (data?.needsConfirmation === false || data?.subscription?.status === 'ACTIVE') {
            setStep('success');
            setPaymentMessage(data?.paymentMessage || 'Abonnement activé avec succès 🎉');
            return;
          }
          // PENDING → le client confirme sur son téléphone
          if (data?.providerRef) {
            setProviderRef(data.providerRef);
            setPaymentMessage(
              data?.paymentMessage ||
                `Paiement ${provider} initié. Confirmez la demande sur votre téléphone.`
            );
            setStep('pending');
            return;
          }
          // Paiement en espèces (CASH) ou aucun provider → activé
          setStep('success');
          setPaymentMessage(data?.paymentMessage || 'Abonnement activé avec succès 🎉');
        },
        onError: (err: any) => {
          const status = Number(err?.response?.status || 0);
          if (status === 409) {
            setErrorMsg(
              'Vous avez déjà un abonnement actif. Gérez-le depuis votre espace client avant d\u2019en souscrire un nouveau.'
            );
          } else if (status === 400) {
            setErrorMsg("Ce plan n'est plus disponible. Essayez un autre forfait.");
          } else {
            setErrorMsg(
              err?.response?.data?.error ||
                err?.response?.data?.message ||
                "Impossible de souscrire pour le moment. Réessayez."
            );
          }
          setStep('confirm');
        },
      }
    );
  };

  // Étape 3 : le client confirme avoir payé sur son téléphone
  const confirmPayment = () => {
    if (!providerRef) return;
    setErrorMsg(null);
    setPaymentMessage('Confirmation du paiement...');
    confirmMutation.mutate(providerRef, {
      onSuccess: () => {
        setStep('success');
        setPaymentMessage('Paiement confirmé, votre abonnement est actif 🎉');
      },
      onError: (err: any) => {
        setErrorMsg(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            'Erreur lors de la confirmation. Vérifiez votre paiement puis réessayez.'
        );
      },
    });
  };

  const formatPrice = (p: Plan) =>
    `${Number(p.price || 0).toLocaleString('fr-FR')} ${p.currency || 'FCFA'}`;

  return (
    <section id="section-subscriptions" className="scroll-mt-24">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500/15 to-emerald-500/15 text-brand">
            <Repeat className="h-5 w-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Abonnements
          </h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Choisissez la formule qui vous ressemble et profitez de tous nos avantages
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {activePlans.map((plan) => {
          const isFeatured = !!plan.featured;
          return (
            <div
              key={plan.id}
              className={cn(
                'group relative flex flex-col rounded-2xl border bg-white dark:bg-gray-800 overflow-hidden transition-all duration-300 hover:shadow-xl',
                isFeatured
                  ? 'border-brand/40 shadow-lg shadow-brand/10 ring-1 ring-brand/20 lg:-translate-y-1'
                  : 'border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:shadow-md'
              )}
            >
              {isFeatured && (
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand via-emerald-400 to-brand" />
              )}
              <div className="p-6 flex flex-col flex-1">
                {/* Badge + nom */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {plan.name}
                  </h3>
                  {plan.badge && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand dark:text-brand-400 whitespace-nowrap">
                      {plan.badge}
                    </span>
                  )}
                </div>

                {plan.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {plan.description}
                  </p>
                )}

                {/* Prix */}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    {Number(plan.price || 0).toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                    {plan.currency || 'FCFA'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {CYCLE_LABELS[plan.billingCycle || ''] || ''}
                  </span>
                </div>

                {/* Essai gratuit */}
                {Number(plan.trialDays || 0) > 0 && (
                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Gift className="h-3.5 w-3.5" />
                    {plan.trialDays} jours d&apos;essai gratuit
                  </span>
                )}

                {/* Bénéfices */}
                <ul className="mt-5 space-y-2.5 flex-1">
                  {(plan.benefits || []).map((benefit, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      {benefit}
                    </li>
                  ))}
                  {(plan.privileges || []).map((pr) => (
                    <li
                      key={pr.label}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      {pr.label}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={isFeatured ? 'primary' : 'outline'}
                  className={cn('w-full mt-6 group/btn', isFeatured && 'shadow-lg shadow-brand/20')}
                  disabled={subscribeMutation.isPending && selectedPlan?.id === plan.id}
                  onClick={() => handleSubscribe(plan)}
                >
                  {subscribeMutation.isPending && selectedPlan?.id === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Crown className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                  )}
                  S&apos;abonner
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de souscription */}
      <Modal open={!!selectedPlan} onClose={closeModal}>
        <div className="p-6">
          {selectedPlan && step === 'confirm' && (
            <>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/15 to-emerald-500/15 flex items-center justify-center text-brand mb-4">
                <BadgeCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                S&apos;abonner à « {selectedPlan.name} »
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {selectedPlan.description}
              </p>

              <div className="mt-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Formule</span>
                  <span className="font-semibold">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Durée</span>
                  <span className="font-semibold">
                    {CYCLE_NAMES[selectedPlan.billingCycle || ''] || 'Mensuel'}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500 dark:text-gray-400">Prix</span>
                  <span className="font-bold text-brand">{formatPrice(selectedPlan)}</span>
                </div>
                {Number(selectedPlan.trialDays || 0) > 0 && (
                  <div className="flex justify-between text-sm mt-2 text-emerald-600">
                    <span>Essai gratuit</span>
                    <span className="font-semibold">{selectedPlan.trialDays} jours</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Vous pourrez gérer votre abonnement depuis votre espace client.
              </p>

              {errorMsg && (
                <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-600 dark:text-red-400">
                  {errorMsg}
                  {errorMsg.includes('déjà un abonnement') && (
                    <Link href="/dashboard/my-subscriptions" className="block mt-2 font-semibold underline">
                      Voir mes abonnements →
                    </Link>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={closeModal}>
                  Annuler
                </Button>
                <Button variant="primary" onClick={goToPayment}>
                  Continuer vers le paiement
                  <Smartphone className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {selectedPlan && step === 'pay' && (
            <>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Paiement Mobile Money
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                « {selectedPlan.name} » — {formatPrice(selectedPlan)}
              </p>

              {/* Choix du provider */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">
                1. Choisissez votre opérateur
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                {MOBILE_MONEY_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setProvider(p.id);
                      setErrorMsg(null);
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                      provider === p.id
                        ? 'border-brand bg-brand-50 dark:bg-brand-900/20 dark:border-brand'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-white', p.color)}>
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                      {p.label}
                    </span>
                    {provider === p.id && <Check className="h-3.5 w-3.5 text-brand" />}
                  </button>
                ))}
              </div>

              {/* Numéro de téléphone */}
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-5 mb-2">
                2. Votre numéro de téléphone
              </p>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="+225 07 08 09 10 11"
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors bg-white dark:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
                    phoneError
                      ? 'border-red-300 dark:border-red-700'
                      : 'border-gray-200 dark:border-gray-700'
                  )}
                />
              </div>
              {phoneError && <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>}
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Vous recevrez une demande de paiement sur votre téléphone à confirmer.
              </p>

              {errorMsg && (
                <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-600 dark:text-red-400">
                  {errorMsg}
                </div>
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="ghost" onClick={() => setStep('confirm')}>
                  Retour
                </Button>
                <Button
                  variant="primary"
                  disabled={subscribeMutation.isPending}
                  onClick={initiatePayment}
                >
                  {subscribeMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Banknote className="h-4 w-4 mr-2" />
                  )}
                  Payer {formatPrice(selectedPlan)}
                </Button>
              </div>
            </>
          )}

          {step === 'pending' && (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-brand" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4">
                Paiement en attente
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{paymentMessage}</p>
              {providerRef && (
                <p className="text-xs text-gray-400 mt-2">
                  Référence : <span className="font-mono font-semibold">{providerRef}</span>
                </p>
              )}
              {errorMsg && (
                <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 p-3 text-sm text-red-600 dark:text-red-400">
                  {errorMsg}
                </div>
              )}
              <div className="flex justify-center gap-2 mt-6">
                <Button variant="ghost" onClick={closeModal}>
                  Plus tard
                </Button>
                <Button variant="secondary" onClick={confirmPayment} disabled={confirmMutation.isPending}>
                  {confirmMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  J&apos;ai confirmé le paiement
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <BadgeCheck className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-4">
                Abonnement activé 🎉
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {paymentMessage || 'Retrouvez tous vos abonnements dans votre espace client.'}
              </p>
              <p className="text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Paiement sécurisé · gestion transparente
              </p>
              <div className="flex gap-2 justify-center mt-6">
                <Button variant="ghost" onClick={closeModal}>
                  Continuer ma visite
                </Button>
                <Link href="/dashboard/my-subscriptions">
                  <Button variant="primary">Voir mes abonnements</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
