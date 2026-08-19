'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
  Package,
  Sparkles,
  Zap,
  Check,
  Banknote,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/ToastProvider';

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
  { id: 'MOBILE_MONEY', label: 'Mobile Money', desc: 'Wave, Orange, MTN, Flooz', icon: Phone, color: 'from-blue-500 to-blue-600' },
  { id: 'ESCROW', label: 'Escrow AfriBiz', desc: 'Paiement sécurisé garanti', icon: ShieldCheck, color: 'from-emerald-500 to-emerald-600' },
  { id: 'CASH', label: 'Espèces', desc: 'Payez à la livraison / au retrait', icon: Banknote, color: 'from-emerald-600 to-emerald-700' },
  { id: 'BANK_TRANSFER', label: 'Virement', desc: 'Traitement sous 24h', icon: CreditCard, color: 'from-purple-500 to-purple-600' },
];

const PAYMENT_DEMO_MODE =
  process.env.NEXT_PUBLIC_PAYMENT_DEMO_MODE === 'true' || process.env.NODE_ENV !== 'production';

const STEPS = ['info', 'payment', 'success'] as const;
type Step = (typeof STEPS)[number];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-2">
      {STEPS.filter((s) => s !== 'success').map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
              i <= idx
                ? 'bg-emerald-500 text-gray-900 dark:text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 border border-gray-200 dark:border-white/10'
            )}
          >
            {i < idx ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          {i < 1 && (
            <div
              className={cn(
                'w-12 h-0.5 rounded-full transition-all duration-500',
                i < idx ? 'bg-emerald-500' : 'bg-gray-100 dark:bg-white/10'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function GlassInput({
  label,
  icon: Icon,
  required,
  ...props
}: {
  label: string;
  icon: any;
  required?: boolean;
  [key: string]: any;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-emerald-400">*</span>}
      </label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/20">
          <Icon className="w-4 h-4" />
        </div>
        <input
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:text-white/20 focus:border-emerald-500/40 focus:bg-gray-100 dark:bg-white/[0.06] focus:ring-0 outline-none transition-all duration-200 text-sm"
          {...props}
        />
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { notify } = useToast();

  const [step, setStep] = useState<Step>('info');
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [locating, setLocating] = useState(false);

  const [f, setF] = useState<CheckoutForm>({
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
  });

  const patch = (updates: Partial<CheckoutForm>) => setF((prev) => ({ ...prev, ...updates }));
  const subtotal = totalAmount();
  const currency = items[0]?.currency || 'FCFA';

  // Fetch delivery info
  useEffect(() => {
    const productIds = items.map((i) => i.productId).filter(Boolean);
    if (productIds.length === 0) { setDeliveryLoading(false); return; }
    apiClient
      .getDeliveryInfo(productIds)
      .then((res) => {
        const data = res.data.data as DeliveryInfo;
        setDeliveryInfo(data);
        if (data?.business) {
          if (!data.business.deliveryEnabled) patch({ deliveryType: 'PICKUP' });
          else if (!data.business.pickupEnabled) patch({ deliveryType: 'DELIVERY' });
        }
      })
      .catch(() => setDeliveryInfo(null))
      .finally(() => setDeliveryLoading(false));
  }, []);

  const zones = deliveryInfo?.zones || [];
  const selectedZone = zones.find((z) => z.id === f.deliveryZoneId);
  const deliveryFree = deliveryInfo?.business?.minDeliveryAmount !== null && subtotal >= (deliveryInfo?.business?.minDeliveryAmount ?? Infinity);
  const deliveryFee = f.deliveryType === 'DELIVERY' && selectedZone ? (deliveryFree ? 0 : selectedZone.fee) : 0;
  const total = subtotal + deliveryFee;

  // Empty cart
  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-11 h-11 text-emerald-400/60" />
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">Panier vide</h1>
          <p className="text-gray-500 dark:text-white/40 mb-8 max-w-md">Ajoutez des produits au panier pour finaliser votre commande.</p>
          <Link href="/marketplace">
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white font-bold shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-all duration-500 active:scale-[0.98]">
              Explorer le marketplace
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // Auth gate
  if (!isAuthenticated() && !isGuest) {
    return (
      <div className="min-h-[60vh] max-w-md mx-auto flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-emerald-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">Finaliser votre commande</h1>
        <p className="text-gray-500 dark:text-white/40 mb-8 max-w-sm text-sm">
          Connectez-vous pour la protection Escrow AfriBiz, ou continuez en tant qu&apos;invité.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <Link href="/login?redirect=/checkout" className="w-full">
            <button className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white font-bold text-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300">
              Se connecter
            </button>
          </Link>
          <button
            onClick={() => setIsGuest(true)}
            className="w-full h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white/60 text-sm font-medium hover:bg-gray-100 dark:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            Continuer en tant qu&apos;invité
          </button>
        </div>
      </div>
    );
  }

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
      const refCode = (typeof window !== 'undefined' && localStorage.getItem('afribiz_ref_code')) || undefined;

      if (isGuest) {
        const res = await apiClient.guestCheckout({
          email: f.email, contactName: f.name, contactPhone: f.phone, type: f.deliveryType,
          ...deliveryPayload, refCode, notes: f.notes, paymentMethod: f.paymentMethod,
          items: items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity, unitPrice: item.price, image: item.image })),
        });
        if (res.data.success) {
          setCreatedOrder(res.data.data || null);
          setStep('success');
          clearCart();
          localStorage.removeItem('afribiz_ref_code');
          notify({ title: 'Commande confirmée !', description: 'Votre commande a été transmise au marchand.', variant: 'success' });
        } else {
          setError(res.data.message || 'Une erreur est survenue.');
        }
      } else {
        for (const item of items) {
          await apiClient.post('/cart/items', { productId: item.productId, name: item.name, quantity: item.quantity, unitPrice: item.price, image: item.image });
        }
        const res = await apiClient.checkout({
          type: f.deliveryType, contactPhone: f.phone, contactName: f.name, notes: f.notes,
          refCode, paymentMethod: f.paymentMethod, ...deliveryPayload,
        });
        if (res.data.success) {
          setCreatedOrder(res.data.data || null);
          setStep('success');
          clearCart();
          localStorage.removeItem('afribiz_ref_code');
          notify({ title: 'Commande confirmée !', description: 'Votre commande a été transmise au marchand.', variant: 'success' });
        } else {
          setError(res.data.message || 'Une erreur est survenue.');
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erreur lors de la validation.';
      setError(msg);
      notify({ title: 'Erreur', description: msg, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const useMyPosition = () => {
    if (!('geolocation' in navigator)) { setError("Géolocalisation indisponible."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { patch({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); setError(''); },
      () => { setLocating(false); setError('Position introuvable.'); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // SUCCESS
  if (step === 'success') {
    const order = createdOrder || {};
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}>
          <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">Commande confirmée !</h1>
          <p className="text-gray-500 dark:text-white/40 mb-8 max-w-md mx-auto">
            Votre commande a été transmise avec succès. Vous recevrez une notification dès qu&apos;elle sera traitée.
          </p>
          {order.orderNumber && (
            <div className="glass rounded-2xl divide-y divide-white/5 text-left mb-8">
              {[
                ['Numéro', order.orderNumber],
                ['Marchand', order.business?.name || '—'],
                ['Mode', order.deliveryType === 'PICKUP' ? 'Retrait' : 'Livraison'],
                ['Total', formatPrice(Number(order.totalAmount || 0), order.currency || 'FCFA')],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between px-5 py-3.5">
                  <span className="text-sm text-gray-500 dark:text-white/40">{label}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
            <Link href="/dashboard/orders">
              <button className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white font-bold text-sm hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300">
                Suivre mes commandes
              </button>
            </Link>
            <Link href="/marketplace">
              <button className="w-full h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white/60 text-sm font-medium hover:bg-gray-100 dark:bg-white/10 transition-all duration-200">
                Continuer mes achats
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const deliveryOptions = [
    { value: 'DELIVERY', label: 'Livraison', description: zones.length > 0 ? `${zones.length} zone(s)` : 'À domicile', icon: <Truck className="w-4 h-4" />, disabled: !(deliveryInfo?.business?.deliveryEnabled ?? true) },
    { value: 'PICKUP', label: 'Retrait', description: 'En boutique', icon: <Store className="w-4 h-4" />, disabled: !(deliveryInfo?.business?.pickupEnabled ?? true) },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
        <Link href="/cart" className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-white/10 transition-all duration-200">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight">Finaliser la commande</h1>
          <p className="text-gray-400 dark:text-white/30 text-sm mt-0.5">{items.length} article{items.length > 1 ? 's' : ''} · {formatPrice(total, currency)}</p>
        </div>
        <div className="ml-auto">
          <StepIndicator current={step} />
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left — Forms */}
        <div className="lg:col-span-3 space-y-5">
          <AnimatePresence mode="wait">
            {/* STEP 1: Delivery */}
            {step === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="glass rounded-2xl">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Package className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Mode de réception</h2>
                        <p className="text-xs text-gray-400 dark:text-white/30">Comment souhaitez-vous recevoir votre commande ?</p>
                      </div>
                    </div>

                    {/* Delivery type toggle */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {deliveryOptions.map((opt) => (
                        <button
                          key={opt.value}
                          disabled={opt.disabled}
                          onClick={() => patch({ deliveryType: opt.value as 'DELIVERY' | 'PICKUP', deliveryZoneId: '' })}
                          className={cn(
                            'relative p-4 rounded-xl border text-left transition-all duration-200',
                            f.deliveryType === opt.value
                              ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                              : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:border-white/15',
                            opt.disabled && 'opacity-40 cursor-not-allowed'
                          )}
                        >
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', f.deliveryType === opt.value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30')}>
                            {opt.icon}
                          </div>
                          <p className={cn('text-sm font-semibold', f.deliveryType === opt.value ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white/60')}>{opt.label}</p>
                          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{opt.description}</p>
                          {f.deliveryType === opt.value && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-gray-900 dark:text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Delivery zone + address */}
                    {f.deliveryType === 'DELIVERY' && (
                      <div className="space-y-4">
                        {zones.length > 0 && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-2">Quartier / Zone</label>
                            <div className="space-y-2">
                              {zones.map((z) => (
                                <button
                                  key={z.id}
                                  onClick={() => patch({ deliveryZoneId: z.id })}
                                  className={cn(
                                    'w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 text-left',
                                    f.deliveryZoneId === z.id
                                      ? 'bg-emerald-500/10 border-emerald-500/30'
                                      : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:border-white/15'
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <MapPin className="w-4 h-4 text-gray-400 dark:text-white/30" />
                                    <span className="text-sm text-gray-700 dark:text-white/70">{z.name}</span>
                                  </div>
                                  <span className={cn('text-xs font-semibold', z.fee === 0 || deliveryFree ? 'text-emerald-400' : 'text-gray-500 dark:text-white/40')}>
                                    {z.fee === 0 || deliveryFree ? 'Gratuit' : formatPrice(z.fee, currency)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <GlassInput label="Adresse de livraison" icon={MapPin} required placeholder="Quartier, Rue, Repère..." value={f.address} onChange={(e: any) => patch({ address: e.target.value })} />
                        <div className="flex items-center gap-2">
                          <button onClick={useMyPosition} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all duration-200">
                            <Navigation className="w-3 h-3" />
                            {locating ? 'Localisation...' : 'Ma position GPS'}
                          </button>
                          {f.lat && <span className="text-[11px] text-emerald-400/70">Position détectée</span>}
                        </div>
                      </div>
                    )}

                    {f.deliveryType === 'PICKUP' && deliveryInfo?.business && (
                      <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10"><Store className="w-5 h-5 text-emerald-400" /></div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{deliveryInfo.business.name}</p>
                            <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">{deliveryInfo.business.address || 'Contactez le marchand'}{deliveryInfo.business.city ? ` · ${deliveryInfo.business.city}` : ''}</p>
                            {deliveryInfo.business.phone && (
                              <a href={`tel:${deliveryInfo.business.phone}`} className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-400 hover:text-emerald-300">
                                <Phone className="w-3 h-3" /> {deliveryInfo.business.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {isGuest && (
                      <div className="space-y-4 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                        <GlassInput label="Email" icon={Mail} type="email" required placeholder="votre@email.com" value={f.email} onChange={(e: any) => patch({ email: e.target.value })} />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                      <GlassInput label="Nom" icon={User} required placeholder="Votre nom" value={f.name} onChange={(e: any) => patch({ name: e.target.value })} />
                      <GlassInput label="Téléphone" icon={Phone} required placeholder="+225 XX XX XX XX" value={f.phone} onChange={(e: any) => patch({ phone: e.target.value })} />
                    </div>

                    <button
                      onClick={() => setStep('payment')}
                      disabled={!f.name || !f.phone || (f.deliveryType === 'DELIVERY' && zones.length > 0 && (!f.deliveryZoneId || !f.address)) || (isGuest && !f.email)}
                      className="w-full mt-6 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Continuer vers le paiement
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Payment */}
            {step === 'payment' && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                <div className="glass rounded-2xl">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-900 dark:text-white">Mode de paiement</h2>
                        <p className="text-xs text-gray-400 dark:text-white/30">Choisissez comment payer</p>
                      </div>
                    </div>

                    {PAYMENT_DEMO_MODE && (
                      <div className="mb-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 flex items-start gap-3">
                        <Zap className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">Mode démo</p>
                          <p className="text-[11px] text-gray-400 dark:text-white/30 mt-0.5">Paiement simulé — aucune somme débitée.</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const active = f.paymentMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => patch({ paymentMethod: method.id })}
                            className={cn(
                              'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                              active
                                ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                                : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:border-white/15'
                            )}
                          >
                            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30')}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <p className={cn('text-sm font-semibold', active ? 'text-gray-900 dark:text-white' : 'text-gray-900 dark:text-white/60')}>{method.label}</p>
                              <p className="text-xs text-gray-400 dark:text-white/30">{method.desc}</p>
                            </div>
                            {active && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-gray-900 dark:text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-white/5">
                      <button onClick={() => setStep('info')} className="h-12 px-6 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/50 text-sm font-medium hover:bg-gray-100 dark:bg-white/10 transition-all duration-200">
                        Retour
                      </button>
                      <button
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white font-bold text-sm disabled:opacity-40 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
                        ) : (
                          <><ShieldCheck className="w-4 h-4" /> Confirmer la commande</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right — Live Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <div className="sticky top-24 space-y-4">
            <div className="glass rounded-2xl">
              <div className="relative rounded-[calc(1rem-0.1875rem)] bg-gradient-to-br from-white/[0.02] to-transparent p-5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">Récapitulatif</h3>

                {/* Items */}
                <div className="space-y-3 mb-5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                  {items.map((item) => (
                    <div key={item.productId} className="flex gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 shrink-0 overflow-hidden relative">
                        {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" /> : <ShoppingBag className="w-5 h-5 text-gray-300 dark:text-white/15 absolute inset-0 m-auto" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400 dark:text-white/30">Qte: {item.quantity} × {formatPrice(item.price, currency)}</p>
                      </div>
                      <p className="text-xs font-bold text-emerald-400 tabular-nums whitespace-nowrap">{formatPrice(item.price * item.quantity, currency)}</p>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-gray-100 dark:bg-white/5" />

                {/* Totals */}
                <div className="space-y-2 mt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-white/40">Sous-total</span>
                    <span className="text-gray-700 dark:text-white/70 font-medium tabular-nums">{formatPrice(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-white/40">Livraison</span>
                    <span className={cn('font-medium tabular-nums', deliveryFee === 0 ? 'text-emerald-400' : 'text-gray-700 dark:text-white/70')}>
                      {f.deliveryType === 'PICKUP' ? 'Gratuite' : (deliveryFree ? 'Offerte' : (selectedZone ? formatPrice(deliveryFee, currency) : '—'))}
                    </span>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-white/5" />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-gray-500 dark:text-white/50 font-medium">Total</span>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{formatPrice(total, currency)}</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">{error}</div>
                )}

                <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-gray-300 dark:text-white/15">
                  <ShieldCheck className="w-3 h-3" />
                  Paiement sécurisé · AfriBiz Escrow
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
