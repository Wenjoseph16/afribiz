'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isGuest, setIsGuest] = useState(false);

  const [form, setForm] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    phone: user?.phone || '',
    address: '',
    notes: '',
    email: '',
    paymentMethod: 'MOBILE_MONEY',
    deliveryType: 'DELIVERY',
  });

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

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      if (isGuest) {
        const res = await apiClient.guestCheckout({
          email: form.email,
          contactName: form.name,
          contactPhone: form.phone,
          deliveryAddress: form.address,
          notes: form.notes,
          paymentMethod: form.paymentMethod,
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
          type: form.deliveryType,
          deliveryAddress: form.address,
          contactPhone: form.phone,
          contactName: form.name,
          notes: form.notes,
          paymentMethod: form.paymentMethod,
        });

        if (res.data.success) {
          setStep('success');
          clearCart();
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
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Info */}
          <Card padding="lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand font-bold text-sm">
                1
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Informations de livraison
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {isGuest && (
                <div className="sm:col-span-2">
                  <Input
                    label="Email *"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="votre@email.com"
                    icon={<Mail className="w-4 h-4" />}
                    required
                  />
                </div>
              )}
              <Input
                label="Nom complet"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Jean Dupont"
                icon={<User className="w-4 h-4" />}
              />
              <Input
                label="Téléphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+225 07..."
                icon={<Phone className="w-4 h-4" />}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Adresse de livraison"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Quartier, Rue, Porte..."
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Notes additionnelles
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 focus:border-brand outline-none transition-all resize-none"
                  rows={3}
                  placeholder="Instructions pour le livreur..."
                />
              </div>
            </div>
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

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  id: 'MOBILE_MONEY',
                  label: 'Mobile Money',
                  desc: 'Wave, Orange, MTN, Flooz',
                  icon: Phone,
                },
                {
                  id: 'ESCROW',
                  label: 'Escrow AfriBiz',
                  desc: 'Paiement sécurisé garanti',
                  icon: ShieldCheck,
                },
                {
                  id: 'CASH',
                  label: 'Espèces à la livraison',
                  desc: 'Payez quand vous recevez',
                  icon: DollarSign,
                },
                {
                  id: 'BANK_TRANSFER',
                  label: 'Virement bancaire',
                  desc: 'Traitement sous 24h',
                  icon: CreditCard,
                },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setForm({ ...form, paymentMethod: method.id })}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all',
                    form.paymentMethod === method.id
                      ? 'border-brand bg-brand/5 ring-4 ring-brand/10'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      form.paymentMethod === method.id
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                    )}
                  >
                    <method.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">
                      {method.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{method.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Summary */}
        <div className="space-y-6">
          <Card padding="lg" className="sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Récapitulatif</h2>

            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
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

            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sous-total</span>
                <span className="font-medium">{formatPrice(totalAmount(), items[0].currency)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Livraison</span>
                <span className="text-emerald-600 font-medium">À confirmer</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                <span>Total</span>
                <span className="text-brand">{formatPrice(totalAmount(), items[0].currency)}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded-lg mb-4">
                {error}
              </div>
            )}

            <Button
              className="w-full h-12 rounded-xl text-base font-bold"
              onClick={handleCheckout}
              isLoading={isSubmitting}
              disabled={!form.name || !form.phone || !form.address || (isGuest && !form.email)}
            >
              Confirmer la commande
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>

            <p className="text-[10px] text-gray-400 text-center mt-4 uppercase tracking-widest">
              Paiement sécurisé via AfriBiz
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
