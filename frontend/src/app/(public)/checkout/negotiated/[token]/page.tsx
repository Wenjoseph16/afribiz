'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Handshake,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  Store,
  ShieldCheck,
  ArrowLeft,
  Phone,
  MapPin,
  User,
  Clock,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ChoiceCard } from '@/components/formkit';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import { apiClient } from '@/services/apiClient';

const PAYMENT_METHODS = [
  {
    value: 'CASH',
    label: 'Espèces à la réception',
    description: 'Payez à la livraison / au retrait',
    icon: <Phone className="w-4 h-4" />,
  },
  {
    value: 'MOBILE_MONEY',
    label: 'Mobile Money',
    description: 'Wave, Orange, MTN, Flooz',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
];

function NegotiatedCheckoutInner() {
  const { token } = useParams<{ token: string }>();
  const [resolved, setResolved] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [order, setOrder] = useState<any | null>(null);

  // Résolution du lien éphémère : prix accordé FIGÉ, article, disponibilité
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    apiClient
      .resolveNegotiatedToken(token)
      .then((res: any) => {
        if (!cancelled) setResolved(res.data?.data || null);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.response?.data?.error || 'Lien invalide ou expiré.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const demoMode = useMemo(
    () =>
      process.env.NEXT_PUBLIC_PAYMENT_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production',
    []
  );

  const handleSubmit = async () => {
    if (!resolved) return;
    if (!contactName.trim() || !contactPhone.trim()) {
      setSubmitError('Nom et téléphone requis pour finaliser la commande.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await apiClient.createNegotiatedOrder(token, {
        paymentMethod,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        deliveryAddress: deliveryAddress.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOrder(res.data?.data || null);
    } catch (e: any) {
      setSubmitError(
        e?.response?.data?.error || e?.message || 'Commande impossible. Le lien a peut-être expiré.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Chargement ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
          <p className="text-sm text-gray-500">Vérification de votre lien…</p>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Lien invalide / expiré / déjà utilisé ──
  if (error || !resolved) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-24">
          <Card padding="lg" className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/30">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Lien invalide ou expiré
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {error ||
                'Ce lien éphémère a expiré (48 h) ou a déjà été utilisé. Recontactez le commerçant pour obtenir un nouveau lien.'}
            </p>
            <Link href="/marketplace">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4" /> Retour au marketplace
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Indisponible maintenant (stock, fermeture…) ──
  if (resolved.available === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-24">
          <Card padding="lg" className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-900/30">
              <Package className="h-8 w-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {resolved.reason || 'Article indisponible'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Le commerçant a accepté votre prix, mais l'article n'est pas disponible pour le
              moment. Contactez-le pour finaliser autrement.
            </p>
            <Link href="/marketplace">
              <Button variant="outline" className="w-full">
                Retour au marketplace
              </Button>
            </Link>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // ── Succès ──
  if (order) {
    const paid = order.payment?.status === 'SUCCESS' || order.paymentStatus === 'PAID';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="max-w-lg mx-auto px-4 py-24">
          <Card padding="lg" className="text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-10 w-10 text-gray-900 dark:text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Commande confirmée !
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Votre commande au prix négocié a bien été enregistrée. Le commerçant est notifié
              instantanément.
            </p>

            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-left mb-6">
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">Article</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {order.negotiated?.itemName || resolved.itemName}
                </span>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">Prix négocié</span>
                <span className="text-sm font-bold text-emerald-600">
                  {formatPrice(order.negotiated?.agreedPrice ?? resolved.agreedPrice)}
                </span>
              </div>
              {Number(order.negotiated?.discountAmount ?? resolved.discountAmount) > 0 && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Vous économisez</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {formatPrice(order.negotiated?.discountAmount ?? resolved.discountAmount)}
                  </span>
                </div>
              )}
              {order.orderNumber && (
                <div className="flex items-center justify-between p-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Référence</span>
                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {order.orderNumber}
                  </span>
                </div>
              )}
              {paid && (
                <div className="p-4 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300 rounded-b-2xl">
                  ✓ Paiement confirmé
                  {order.payment?.isDemo ? ' (mode démonstration)' : ''} — montant enregistré dans
                  la caisse du commerçant.
                </div>
              )}
            </div>

            <div className="grid gap-3">
              <Link href="/dashboard/orders">
                <Button className="w-full">Suivre mes commandes</Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" className="w-full">
                  Continuer mes achats
                </Button>
              </Link>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const savings = Math.max(0, resolved.discountAmount || 0);

  // ── Formulaire ──
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
            <Handshake className="w-3.5 h-3.5" /> Prix négocié accepté
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" /> Lien valable 48 h — usage unique
          </span>
        </div>

        <Card padding="lg" className="mb-6 overflow-hidden">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 relative">
              {resolved.image ? (
                <Image src={resolved.image} alt="" fill className="object-cover" sizes="96px" />
              ) : (
                <Package className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {resolved.itemName}
              </h1>
              <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(resolved.agreedPrice)}
                </span>
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(resolved.basePrice)}
                </span>
                {savings > 0 && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-lg">
                    -{formatPrice(savings)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                <Store className="w-3.5 h-3.5" /> Prix figé à l'accord — le catalogue ne change rien
                ici.
              </p>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="space-y-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Vos coordonnées</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Nom complet *"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Votre nom"
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Téléphone (WhatsApp) *"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+225…"
              icon={<Phone className="w-4 h-4" />}
            />
          </div>
          <Input
            label="Adresse de livraison"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Quartier, rue, repère…"
            icon={<MapPin className="w-4 h-4" />}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Note pour le commerçant (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ex : disponible le soir après 18 h"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 resize-none"
            />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Méthode de paiement
            </h3>
            <ChoiceCard
              options={PAYMENT_METHODS}
              value={paymentMethod}
              onChange={(v) => setPaymentMethod(v as string)}
              columns={2}
            />
            {demoMode && paymentMethod !== 'CASH' && (
              <p className="text-xs text-gray-400 mt-2">
                Mode démonstration : le paiement mobile est confirmé automatiquement (webhook
                simulé) — la caisse du commerçant est créditée du montant négocié.
              </p>
            )}
          </div>

          {submitError && (
            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
              {submitError}
            </div>
          )}

          <Button
            className="w-full h-12 rounded-xl text-base font-bold"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Confirmer au prix négocié · {formatPrice(resolved.agreedPrice)}</>
            )}
          </Button>
          <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
            Paiement sécurisé via AfriBiz · {formatPrice(savings)} d'économies
          </p>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function NegotiatedCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      }
    >
      <NegotiatedCheckoutInner />
    </Suspense>
  );
}
