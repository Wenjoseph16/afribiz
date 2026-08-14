'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  ShieldCheck,
  MapPin,
  Phone,
  User,
  ChevronRight,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  DollarSign,
  Mail,
  Store,
  Navigation,
  Clock,
  Save,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { ChoiceCard, LiveSummary, useAutoSave } from '@/components/formkit';
import Link from 'next/link';

interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  minOrder: number | null;
  estimatedTime: number | null;
}

interface DeliveryInfo {
  business: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    whatsapp: string | null;
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    minDeliveryAmount: number | null;
  } | null;
  zones: DeliveryZone[];
}

interface CheckoutForm {
  name: string;
  phone: string;
  address: string;
  notes: string;
  email: string;
  paymentMethod: string;
  deliveryType: 'DELIVERY' | 'PICKUP';
  deliveryZoneId: string;
  scheduledAt: string;
  lat: number | null;
  lng: number | null;
}

const PAYMENT_METHODS = [
  { id: 'MOBILE_MONEY', label: 'Mobile Money', desc: 'Wave, Orange, MTN, Flooz', icon: Phone },
  { id: 'ESCROW', label: 'Escrow AfriBiz', desc: 'Paiement sécurisé garanti', icon: ShieldCheck },
  {
    id: 'CASH',
    label: 'Espèces à la réception',
    desc: 'Payez à la livraison / au retrait',
    icon: DollarSign,
  },
  {
    id: 'BANK_TRANSFER',
    label: 'Virement bancaire',
    desc: 'Traitement sous 24h',
    icon: CreditCard,
  },
];

const PAYMENT_DEMO_MODE =
  process.env.NEXT_PUBLIC_PAYMENT_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  const initialForm: CheckoutForm = {
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    phone: user?.phone || '',
    address: '',
    notes: '',
    email: '',
    paymentMethod: 'MOBILE_MONEY',
    deliveryType: 'DELIVERY',
    deliveryZoneId: '',
    scheduledAt: '',
    lat: null,
    lng: null,
  };

  const {
    value: f,
    patch,
    setValue,
    savedAt,
  } = useAutoSave<CheckoutForm>('checkout:v1', initialForm);

  const subtotal = totalAmount();

  // Checkout intelligent : récupérer la config livraison/retrait + zones du business du panier
  useEffect(() => {
    const productIds = items.map((i) => i.productId).filter(Boolean);
    if (productIds.length === 0) {
      setDeliveryLoading(false);
      return;
    }
    apiClient
      .getDeliveryInfo(productIds)
      .then((res) => {
        const data = res.data.data as DeliveryInfo;
        setDeliveryInfo(data);
        // Livraison désactivée par le business → forcer le retrait (et inversement)
        if (data?.business) {
          if (!data.business.deliveryEnabled && f.deliveryType === 'DELIVERY') {
            patch({ deliveryType: 'PICKUP' });
          } else if (!data.business.pickupEnabled && f.deliveryType === 'PICKUP') {
            patch({ deliveryType: 'DELIVERY' });
          }
        }
      })
      .catch(() => {
        setDeliveryInfo(null);
      })
      .finally(() => setDeliveryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Votre panier est vide
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Vous n'avez pas encore ajouté de produits à votre panier. Parcourez la marketplace pour
          trouver des offres incroyables.
        </p>
        <Link href="/marketplace">
          <Button>Découvrir les produits</Button>
        </Link>
      </div>
    );
  }

  if (!isAuthenticated() && !isGuest) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-brand mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Finaliser votre commande
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          Connectez-vous pour bénéficier de la protection Escrow AfriBiz, ou continuez en tant
          qu'invité.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Link href={`/login?redirect=/checkout`} className="w-full">
            <Button className="w-full">Se connecter</Button>
          </Link>
          <Link href="/signup" className="w-full">
            <Button variant="outline" className="w-full">
              Créer un compte
            </Button>
          </Link>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 dark:bg-gray-950 px-2 text-gray-400">ou</span>
            </div>
          </div>
          <button
            onClick={() => setIsGuest(true)}
            className="w-full text-sm font-medium text-brand hover:text-brand-700 px-4 py-2.5 rounded-xl border-2 border-brand/20 hover:border-brand/40 transition-colors"
          >
            Continuer en tant qu'invité
          </button>
        </div>
      </div>
    );
  }

  const deliveryEnabled = deliveryInfo?.business?.deliveryEnabled ?? true;
  const pickupEnabled = deliveryInfo?.business?.pickupEnabled ?? true;
  const zones = deliveryInfo?.zones || [];
  const selectedZone = zones.find((z) => z.id === f.deliveryZoneId);
  const minDeliveryAmount = deliveryInfo?.business?.minDeliveryAmount ?? null;
  const deliveryFree = minDeliveryAmount !== null && subtotal >= minDeliveryAmount;
  const deliveryFee =
    f.deliveryType === 'DELIVERY' && selectedZone ? (deliveryFree ? 0 : selectedZone.fee) : 0;
  const total = subtotal + deliveryFee;

  const useMyPosition = () => {
    if (!('geolocation' in navigator)) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        patch({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        setError('');
      },
      () => {
        setLocating(false);
        setError('Position introuvable. Saisissez votre quartier manuellement.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const deliveryPayload = {
        deliveryAddress: f.deliveryType === 'DELIVERY' ? f.address : undefined,
        deliveryZoneId: f.deliveryType === 'DELIVERY' ? f.deliveryZoneId : undefined,
        scheduledAt: f.scheduledAt || undefined,
        deliveryLat: f.lat ?? undefined,
        deliveryLng: f.lng ?? undefined,
      };

      // Affiliation : le parrain mémorisé via /r/:code est crédité si la commande est payée
      const refCode = (typeof window !== 'undefined' && localStorage.getItem('afribiz_ref_code')) || undefined;

      if (isGuest) {
        const res = await apiClient.guestCheckout({
          email: f.email,
          contactName: f.name,
          contactPhone: f.phone,
          type: f.deliveryType,
          ...deliveryPayload,
          refCode,
          notes: f.notes,
          paymentMethod: f.paymentMethod,
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            image: item.image,
          })),
        });

        if (res.data.success) {
          setStep('success');
          clearCart();
          localStorage.removeItem('afribiz_ref_code');
        } else {
          setError(res.data.message || 'Une erreur est survenue lors de la commande.');
        }
      } else {
        // 1. Sync local cart items to backend cart first
        for (const item of items) {
          await apiClient.post('/cart/items', {
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            image: item.image,
          });
        }

        // 2. Perform checkout
        const res = await apiClient.checkout({
          type: f.deliveryType,
          contactPhone: f.phone,
          contactName: f.name,
          notes: f.notes,
          refCode,
          paymentMethod: f.paymentMethod,
          ...deliveryPayload,
        });

        if (res.data.success) {
          setStep('success');
          clearCart();
          localStorage.removeItem('afribiz_ref_code');
        } else {
          setError(res.data.message || 'Une erreur est survenue lors de la commande.');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la validation de la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Commande confirmée !
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Votre commande a été transmise au marchand avec succès. Vous recevrez une notification dès
          qu'elle sera traitée.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/orders">
            <Button className="w-full">Suivre mes commandes</Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" className="w-full">
              Continuer mes achats
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const deliveryOptions = [
    {
      value: 'DELIVERY',
      label: 'Livraison',
      description:
        zones.length > 0
          ? `${zones.length} zone(s) · frais selon votre quartier`
          : 'Livraison à domicile',
      icon: <Truck className="w-4 h-4" />,
      disabled: !deliveryEnabled,
    },
    {
      value: 'PICKUP',
      label: 'Retrait en boutique',
      description: 'Vous venez chercher votre commande',
      icon: <Store className="w-4 h-4" />,
      disabled: !pickupEnabled,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/marketplace"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
          Finaliser votre commande
        </h1>
        {savedAt && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">
            <Save className="w-3 h-3" /> Brouillon sauvegardé
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Livraison / Retrait */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand font-bold text-sm">
                1
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {f.deliveryType === 'DELIVERY' ? 'Livraison' : 'Retrait'}
              </h2>
            </div>

            {/* Choix livraison / retrait — décidé par le business, choisi par le client */}
            <ChoiceCard
              label="Comment voulez-vous recevoir votre commande ?"
              options={deliveryOptions}
              value={f.deliveryType}
              onChange={(v) => setValue('deliveryType', v as 'DELIVERY' | 'PICKUP')}
              columns={2}
              className="mb-5"
            />

            {deliveryLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Loader2 className="w-4 h-4 animate-spin" /> Chargement des options de réception…
              </div>
            ) : (
              <>
                {f.deliveryType === 'DELIVERY' && (
                  <>
                    {/* Zones du business avec frais réels */}
                    {zones.length > 0 ? (
                      <ChoiceCard
                        label="Choisissez votre quartier"
                        help={
                          deliveryFree
                            ? `Livraison offerte dès ${formatPrice(minDeliveryAmount!, items[0].currency)}`
                            : 'Frais calculés par le marchand, selon sa zone'
                        }
                        options={zones.map((z) => ({
                          value: z.id,
                          label: z.name,
                          description: [
                            z.fee === 0 || deliveryFree
                              ? 'Gratuit'
                              : formatPrice(z.fee, items[0].currency),
                            z.estimatedTime ? `~${z.estimatedTime} min` : '',
                          ]
                            .filter(Boolean)
                            .join(' · '),
                          badge: deliveryFree ? 'Offert' : undefined,
                        }))}
                        value={f.deliveryZoneId}
                        onChange={(v) => setValue('deliveryZoneId', v)}
                        columns={1}
                        size="sm"
                        className="mb-4"
                      />
                    ) : (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                        Ce commerce n'a pas encore défini ses zones. Le frais sera confirmé par le
                        marchand.
                      </p>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Input
                          label="Adresse de livraison *"
                          value={f.address}
                          onChange={(e) => setValue('address', e.target.value)}
                          placeholder="Quartier, Rue, Repère..."
                          icon={<MapPin className="w-4 h-4" />}
                          required
                          rightIcon={
                            <button
                              type="button"
                              onClick={useMyPosition}
                              className="flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-700"
                            >
                              <Navigation className="w-3 h-3" />
                              {locating ? '...' : 'GPS'}
                            </button>
                          }
                        />
                        {(f.lat !== null || f.lng !== null) && (
                          <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1">
                            <Navigation className="w-3 h-3" /> Position détectée
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Livraison planifiée <span className="text-gray-400">(optionnel)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={f.scheduledAt}
                          onChange={(e) => setValue('scheduledAt', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                          Instructions pour le livreur
                        </label>
                        <textarea
                          value={f.notes}
                          onChange={(e) => setValue('notes', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand focus:ring-brand/20 outline-none transition-all resize-none"
                          rows={1}
                          placeholder="Ex: sonner 2 fois..."
                        />
                      </div>
                    </div>
                  </>
                )}

                {f.deliveryType === 'PICKUP' && (
                  <div className="rounded-xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {deliveryInfo?.business?.name || 'La boutique'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                          {deliveryInfo?.business?.address ||
                            'Adresse non renseignée — contactez le marchand'}
                          {deliveryInfo?.business?.city ? ` · ${deliveryInfo.business.city}` : ''}
                        </p>
                        {deliveryInfo?.business?.phone && (
                          <a
                            href={`tel:${deliveryInfo.business.phone}`}
                            className="inline-flex items-center gap-1.5 mt-1 text-sm font-medium text-brand hover:text-brand-700"
                          >
                            <Phone className="w-3.5 h-3.5" /> {deliveryInfo.business.phone}
                          </a>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Retrait gratuit · Présentez votre numéro de commande au moment du retrait.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isGuest && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-5">
                    <div className="sm:col-span-2">
                      <Input
                        label="Email *"
                        type="email"
                        value={f.email}
                        onChange={(e) => setValue('email', e.target.value)}
                        placeholder="votre@email.com"
                        icon={<Mail className="w-4 h-4" />}
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {/* Step 2: Payment */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand font-bold text-sm">
                2
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Méthode de paiement
              </h2>
            </div>

            {PAYMENT_DEMO_MODE && (
              <div className="mb-5 rounded-xl border-2 border-dashed border-brand/30 bg-brand/5 p-4 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-brand/10 text-brand shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Mode démonstration
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Le paiement est simulé pour tester le parcours complet : aucune somme ne sera
                    débitée. L'escrow et les notifications fonctionnent normalement.
                  </p>
                </div>
              </div>
            )}

            <ChoiceCard
              options={PAYMENT_METHODS.map((m) => ({
                value: m.id,
                label: m.label,
                description: m.desc,
                icon: <m.icon className="w-4 h-4" />,
              }))}
              value={f.paymentMethod}
              onChange={(v) => setValue('paymentMethod', v)}
              columns={2}
            />
          </Card>
        </div>

        {/* Right: LiveSummary */}
        <LiveSummary
          title="Récapitulatif"
          rows={[
            { label: 'Sous-total', value: formatPrice(subtotal, items[0].currency) },
            {
              label: 'Livraison',
              value:
                f.deliveryType === 'PICKUP'
                  ? 'Gratuit'
                  : selectedZone
                    ? deliveryFree
                      ? 'Offerte'
                      : formatPrice(deliveryFee, items[0].currency)
                    : 'À choisir',
              muted: f.deliveryType === 'PICKUP',
            },
          ]}
          totalLabel="Total"
          total={formatPrice(total, items[0].currency)}
          footer={
            <>
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg mb-4">
                  {error}
                </div>
              )}
              <Button
                className="w-full h-12 rounded-xl text-base font-bold"
                onClick={handleCheckout}
                isLoading={isSubmitting}
                disabled={
                  !f.name ||
                  !f.phone ||
                  (isGuest && !f.email) ||
                  (f.deliveryType === 'DELIVERY' &&
                    zones.length > 0 &&
                    (!f.deliveryZoneId || !f.address))
                }
              >
                Confirmer la commande
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-widest">
                Paiement sécurisé via AfriBiz
              </p>
            </>
          }
        >
          <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden relative">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Qte: {item.quantity} x {formatPrice(item.price, item.currency)}
                  </p>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  {formatPrice(item.price * item.quantity, item.currency)}
                </p>
              </div>
            ))}
          </div>
        </LiveSummary>
      </div>
    </div>
  );
}
