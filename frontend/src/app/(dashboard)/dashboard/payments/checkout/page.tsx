'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Smartphone, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useInitiatePayment } from '@/features/hooks';
import DemoPaymentConfirm from '@/components/payments/DemoPaymentConfirm';

const FEDAPAY_MODES = [
  { id: 'mtn_open', name: 'MTN Mobile Money', icon: '📱', color: 'bg-yellow-500' },
  { id: 'moov_open', name: 'Moov Money', icon: '📱', color: 'bg-blue-600' },
  { id: 'orange_open', name: 'Orange Money', icon: '📱', color: 'bg-orange-500' },
  { id: 'wave_open', name: 'Wave', icon: '🌊', color: 'bg-blue-500' },
  { id: 'card', name: 'Carte bancaire', icon: '💳', color: 'bg-purple-600' },
  { id: 'demo', name: 'Démo (simulation)', icon: '🧪', color: 'bg-emerald-500' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const initiatePayment = useInitiatePayment();

  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMode, setSelectedMode] = useState('mtn_open');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [pendingRef, setPendingRef] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      const res: any = await initiatePayment.mutateAsync({
        provider: selectedMode === 'demo' ? 'DEMO' : 'FEDAPAY',
        amount: parseFloat(amount),
        phone: selectedMode === 'demo' ? undefined : phone || undefined,
        mode: selectedMode === 'demo' ? undefined : selectedMode,
        currency: 'XOF',
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        callbackUrl: `${window.location.origin}/payment/callback`,
      });

      const data = res.data.data;

      // Démo : le paiement reste PENDING (comme un vrai mobile money) — on attend
      // la confirmation sur le « téléphone », rejouée par le webhook simulé.
      if (selectedMode === 'demo' && data?.status === 'PENDING' && data?.providerRef) {
        setPendingRef(data.providerRef);
        return;
      }

      // If FedaPay returns a redirect URL (for card payments), redirect there
      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        // For Mobile Money, show success
        router.push('/dashboard/payments?success=true&ref=' + data?.transaction?.id);
      }
    } catch (err) {
      console.error('Payment failed', err);
    }
  };

  const handleDemoConfirmed = () => {
    setPendingRef(null);
    router.push(`/dashboard/payments?success=true&ref=demo`);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Paiement FedaPay"
        description="Payez par Mobile Money ou Carte bancaire"
        breadcrumbs={[{ label: 'Paiements', href: '/dashboard/payments' }, { label: 'Checkout' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode de paiement */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mode de paiement
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FEDAPAY_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSelectedMode(mode.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedMode === mode.id
                        ? 'border-brand bg-brand-50 dark:bg-brand-900/20 text-brand'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    <span>{mode.icon}</span>
                    <span>{mode.name}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Montant */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Montant
              </h3>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-3xl font-bold text-center py-4 bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-brand outline-none dark:text-white"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  FCFA
                </span>
              </div>
            </Card>

            {/* Infos client */}
            {selectedMode !== 'card' && selectedMode !== 'demo' && (
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Téléphone Mobile Money
                </h3>
                <input
                  type="tel"
                  placeholder="+229 01 00 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent dark:text-white outline-none focus:border-brand"
                  required={selectedMode !== 'card'}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Numéro associé à votre compte{' '}
                  {FEDAPAY_MODES.find((m) => m.id === selectedMode)?.name}
                </p>
              </Card>
            )}

            {/* Coordonnées (optionnel) */}
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Vos coordonnées (optionnel)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nom et prénoms"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent dark:text-white outline-none focus:border-brand"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent dark:text-white outline-none focus:border-brand"
                />
              </div>
            </Card>

            {pendingRef && (
              <DemoPaymentConfirm
                providerRef={pendingRef}
                amount={parseInt(amount) || 0}
                onConfirmed={handleDemoConfirmed}
              />
            )}

            {!pendingRef && (
              <Button
                type="submit"
                className="w-full py-4 text-lg"
                disabled={
                  initiatePayment.isPending || !amount || parseFloat(amount) <= 0
                }
              >
                {initiatePayment.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Paiement en cours...
                  </span>
                ) : (
                  `Payer ${parseInt(amount) > 0 ? parseInt(amount).toLocaleString() : ''} FCFA`
                )}
              </Button>
            )}

            {initiatePayment.error && (
              <p className="text-sm text-red-500 text-center">
                Erreur :{' '}
                {(initiatePayment.error as any)?.response?.data?.error || 'Échec du paiement'}
              </p>
            )}
          </form>
        </div>

        {/* Résumé */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Résumé du paiement
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Type</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {FEDAPAY_MODES.find((m) => m.id === selectedMode)?.name || 'FedaPay'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Montant</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {parseInt(amount) > 0 ? `${parseInt(amount).toLocaleString()} FCFA` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Frais estimés</span>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {parseInt(amount) > 0
                      ? `${Math.round(parseInt(amount) * 0.012).toLocaleString()} FCFA`
                      : '—'}
                  </span>
                </div>
                <hr className="dark:border-gray-700" />
                <div className="flex justify-between font-semibold text-gray-900 dark:text-gray-100">
                  <span>Total</span>
                  <span>
                    {parseInt(amount) > 0
                      ? `${(parseInt(amount) + Math.round(parseInt(amount) * 0.012)).toLocaleString()} FCFA`
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  💡 Paiement sécurisé via FedaPay. Pour les modes Mobile Money, confirmez le
                  paiement sur votre téléphone après validation.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
