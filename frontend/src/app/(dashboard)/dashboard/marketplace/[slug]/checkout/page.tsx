'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Package, ShoppingCart, Loader2, CheckCircle2,
  AlertCircle, Smartphone, Banknote, ArrowRight, ExternalLink,
  Shield, Info, Check, Sparkles,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import {
  useMarketplaceModule,
  usePurchaseMarketplaceModule,
  useConfirmMarketplaceModulePayment,
  useStartMarketplaceModuleTrial,
} from '@/features/developerHooks';

type PaymentStatus = 'idle' | 'pending' | 'success' | 'error' | 'confirming';

const MOBILE_MONEY_PROVIDERS = [
  { id: 'TMONEY', label: 'T-Money', color: 'bg-blue-500', countries: 'Togo' },
  { id: 'FLOOZ', label: 'Flooz', color: 'bg-yellow-500', countries: 'Togo, Bénin' },
  { id: 'ORANGE_MONEY', label: 'Orange Money', color: 'bg-orange-500', countries: 'Côte d\'Ivoire, Sénégal, Mali, Burkina' },
  { id: 'WAVE', label: 'Wave', color: 'bg-emerald-500', countries: 'Sénégal, Côte d\'Ivoire' },
  { id: 'MTN_MOMO', label: 'MTN MoMo', color: 'bg-red-500', countries: 'Ghana, Ouganda, Rwanda' },
  { id: 'AIRTEL_MONEY', label: 'Airtel Money', color: 'bg-red-600', countries: 'Ghana, Ouganda' },
  { id: 'MPESA', label: 'M-Pesa', color: 'bg-green-600', countries: 'Kenya, Tanzanie, RDC' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;
  const { data: mod, isLoading } = useMarketplaceModule(slug);
  const purchaseMutation = usePurchaseMarketplaceModule();
  const confirmMutation = useConfirmMarketplaceModulePayment();
  const trialMutation = useStartMarketplaceModuleTrial();

  const [selectedProvider, setSelectedProvider] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [providerRef, setProviderRef] = useState('');
  const [step, setStep] = useState<'select' | 'pay' | 'confirm' | 'trial'>('select');

  const handleStartTrial = async () => {
    if (!mod?.id) return;
    try {
      await trialMutation.mutateAsync(mod.id);
      setPaymentStatus('success');
      setPaymentMessage(`Essai gratuit de 7 jours commencé ! Profitez de ${mod.name} sans payer.`);
      setStep('confirm');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Erreur lors du démarrage de l\'essai';
      setPaymentStatus('error');
      setPaymentMessage(errorMsg);
    }
  };

  const isFree = mod?.pricingType === 'FREE' || mod?.isFree;
  const price = Number(mod?.price) || 0;

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-]/g, '');
    if (cleaned.length < 8) return 'Numéro trop court';
    if (!/^\+?\d{8,15}$/.test(cleaned)) return 'Format invalide (ex: +22890123456)';
    return '';
  };

  const handleInitiatePayment = async () => {
    if (!mod?.id || !selectedProvider) return;

    const error = validatePhone(phoneNumber);
    if (error) {
      setPhoneError(error);
      return;
    }
    setPhoneError('');
    setPaymentStatus('pending');
    setPaymentMessage('Initialisation du paiement...');

    try {
      const res = await purchaseMutation.mutateAsync({
        moduleId: mod.id,
        data: { provider: selectedProvider, phone: phoneNumber.replace(/[\s\-]/g, '') },
      });

      const data = res.data?.data;
      if (data?.installation) {
        // Immediate success (test mode)
        setPaymentStatus('success');
        setPaymentMessage('Module installé avec succès !');
        setStep('confirm');
      } else if (data?.status === 'PENDING') {
        // Pending — user must confirm on phone
        setProviderRef(data.providerRef || '');
        setPaymentMessage(data.message || 'Confirmez le paiement sur votre téléphone.');
        setPaymentStatus('pending');
      } else {
        setPaymentStatus('success');
        setPaymentMessage(res.data?.message || 'Paiement réussi !');
        setStep('confirm');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Erreur lors du paiement';
      setPaymentStatus('error');
      setPaymentMessage(errorMsg);
    }
  };

  const handleConfirmPayment = async () => {
    if (!providerRef) return;
    setPaymentStatus('confirming');
    setPaymentMessage('Confirmation du paiement...');

    try {
      const res = await confirmMutation.mutateAsync({ providerRef });
      setPaymentStatus('success');
      setPaymentMessage(res.data?.message || 'Paiement confirmé et module installé !');
      setStep('confirm');
    } catch (err: any) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Erreur lors de la confirmation';
      setPaymentStatus('error');
      setPaymentMessage(errorMsg);
    }
  };

  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  if (!mod) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in flex flex-col items-center justify-center py-20">
        <Package className="h-16 w-16 text-gray-200 dark:text-gray-700 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Module introuvable</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Le module que vous cherchez à acheter n&apos;existe pas.</p>
        <Link href="/dashboard/marketplace"><Button variant="secondary" className="mt-4">Retour à la marketplace</Button></Link>
      </div>
    );
  }

  if (isFree) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in flex flex-col items-center justify-center py-20">
        <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Module gratuit</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ce module est gratuit. Vous pouvez l&apos;installer directement depuis la page du module.</p>
        <Link href={`/dashboard/marketplace/${slug}`}><Button variant="primary" className="mt-4">Retour au module</Button></Link>
      </div>
    );
  }

  const formatPrice = (p: number) => p.toLocaleString() + ' FCFA';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finaliser l&apos;achat</h1>

      {/* Résumé de la commande */}
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Récapitulatif</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand to-emerald-500 flex items-center justify-center text-white shadow-lg shrink-0 overflow-hidden">
              {mod.logo ? (
                <Image src={mod.logo ?? ''} alt={mod.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
              ) : (
                <Package className="h-7 w-7" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{mod.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{mod.shortDescription || mod.tagline || ''}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="purple" size="sm">{mod.category}</Badge>
                {mod.version && <span className="text-xs text-gray-400">v{mod.version}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-gray-900 dark:text-gray-100">{formatPrice(price)}</p>
              <p className="text-xs text-gray-500">Paiement unique</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Échec du paiement */}
      {paymentStatus === 'error' && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800 dark:text-red-200 text-sm">Erreur de paiement</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{paymentMessage}</p>
            <Button size="xs" variant="ghost" className="mt-2 text-red-600" onClick={() => { setPaymentStatus('idle'); setPaymentMessage(''); }}>
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Succès */}
      {paymentStatus === 'success' && (
        <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mb-1">Paiement réussi !</h3>
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-6">{paymentMessage}</p>
          <div className="flex items-center justify-center gap-3">
            <Link href={`/dashboard/marketplace/${slug}`}>
              <Button variant="secondary">
                Voir le module
              </Button>
            </Link>
            <Link href="/dashboard/marketplace">
              <Button variant="primary">
                <ArrowRight className="h-4 w-4 mr-1.5" />Continuer
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Formulaire de paiement */}
      {paymentStatus !== 'success' && (
        <>
          {/* Choix du fournisseur */}
          {step === 'select' && (
            <Card>
              <div className="p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">1. Choisissez votre méthode de paiement</h2>

                {/* Option essai gratuit */}
                <button
                  onClick={() => setStep('trial')}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-400 transition-all mb-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">Essai gratuit — 7 jours</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Testez sans payer. Aucun risque.</p>
                  </div>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">Gratuit</span>
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-400">Ou payer directement</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MOBILE_MONEY_PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => { setSelectedProvider(provider.id); setStep('pay'); }}
                      className={cn(
                        'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                        selectedProvider === provider.id
                          ? 'border-brand bg-brand-50 dark:bg-brand-900/20 dark:border-brand'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0', provider.color)}>
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{provider.label}</p>
                        <p className="text-xs text-gray-500">{provider.countries}</p>
                      </div>
                      {selectedProvider === provider.id && (
                        <Check className="h-5 w-5 text-brand ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Option Essai gratuit */}
          {step === 'trial' && (
            <Card>
              <div className="p-5 sm:p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200/50">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Essai gratuit de 7 jours</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Testez {mod.name} sans risque pendant 7 jours. Aucun paiement maintenant.
                </p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Accès complet à toutes les fonctionnalités</span>
                </div>
                <div className="flex items-center gap-3 justify-center">
                  <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
                    Payer maintenant
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleStartTrial}
                    isLoading={trialMutation.isPending}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                  >
                    {trialMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Démarrage...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-1.5" /> Essayer gratuitement 7 jours</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  <Info className="h-3 w-3 inline mr-1" />
                  Après 7 jours, vous pourrez payer pour continuer à utiliser le module
                </p>
              </div>
            </Card>
          )}

          {/* Saisie du numéro */}
          {step === 'pay' && (
            <Card>
              <div className="p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  2. Paiement {selectedProvider && `via ${MOBILE_MONEY_PROVIDERS.find(p => p.id === selectedProvider)?.label}`}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Numéro de téléphone
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                        placeholder="+228 90 12 34 56"
                        className={cn(
                          'w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition-colors bg-white dark:bg-gray-800',
                          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
                          phoneError ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
                        )}
                        disabled={paymentStatus === 'pending' || paymentStatus === 'confirming'}
                      />
                    </div>
                    {phoneError && <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>}
                    <p className="text-xs text-gray-400 mt-1.5">
                      <Info className="h-3 w-3 inline mr-1" />
                      Vous recevrez une demande de paiement sur votre téléphone
                    </p>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <Banknote className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Montant : {formatPrice(price)}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button variant="ghost" size="sm" onClick={() => { setStep('select'); setSelectedProvider(''); }}>
                      Modifier le fournisseur
                    </Button>
                    <div className="flex-1" />
                    <Button
                      size="lg"
                      onClick={handleInitiatePayment}
                      isLoading={paymentStatus === 'pending' || paymentStatus === 'confirming'}
                      disabled={paymentStatus === 'pending' || paymentStatus === 'confirming' || !phoneNumber}
                    >
                      {paymentStatus === 'pending' || paymentStatus === 'confirming' ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> En cours...</>
                      ) : (
                        <><ShoppingCart className="h-4 w-4 mr-1.5" /> Payer {formatPrice(price)}</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Confirmation en attente */}
          {paymentStatus === 'pending' && providerRef && (
            <Card>
              <div className="p-5 sm:p-6 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-brand mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Paiement en attente</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{paymentMessage}</p>
                <p className="text-xs text-gray-400 mb-4">Référence : {providerRef}</p>
                <Button onClick={handleConfirmPayment} variant="secondary" isLoading={confirmMutation.isPending}>
                  <Check className="h-4 w-4 mr-1.5" />J&apos;ai confirmé le paiement
                </Button>
              </div>
            </Card>
          )}

          {/* Sécurité */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Paiement sécurisé via Mobile Money. Vos informations sont protégées.</span>
          </div>
        </>
      )}
    </div>
  );
}
