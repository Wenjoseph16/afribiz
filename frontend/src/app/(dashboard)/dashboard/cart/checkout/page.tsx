'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, ArrowLeft, ShoppingCart, Smartphone, Banknote, Landmark, Shield, Loader, CheckCircle, Truck, MapPin, Phone, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCart, useCheckout } from '@/features/hooks';
import Image from 'next/image';
import { formatPrice } from '@/utils/helpers';

const PAYMENT_METHODS = [
  { value: 'MOBILE_MONEY', label: 'Mobile Money', icon: Smartphone, description: 'TMoney, Flooz, Wave, Orange Money, M-Pesa' },
  { value: 'BANK_TRANSFER', label: 'Virement bancaire', icon: Landmark, description: 'Transfert depuis votre compte bancaire' },
  { value: 'CREDIT_CARD', label: 'Carte bancaire', icon: CreditCard, description: 'Visa, Mastercard' },
  { value: 'ESCROW', label: 'Paiement sécurisé (Escrow)', icon: Shield, description: 'Fonds séquestrés jusqu\'à réception' },
  { value: 'CASH', label: 'Espèces', icon: Banknote, description: 'Paiement à la livraison ou sur place' },
];

const DELIVERY_TYPES = [
  { value: 'DELIVERY', label: 'Livraison', icon: Truck, description: 'Reçu chez vous' },
  { value: 'PICKUP', label: 'Retrait sur place', icon: MapPin, description: 'À récupérer chez le vendeur' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { data: cart, isLoading } = useCart();
  const checkout = useCheckout();
  const [deliveryType, setDeliveryType] = useState('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState('MOBILE_MONEY');
  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    deliveryAddress: '',
    notes: '',
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.total), 0);
  const discountAmount = cart?.coupon
    ? cart.coupon.discountType === 'PERCENTAGE'
      ? subtotal * (Number(cart.coupon.discountValue) / 100)
      : Number(cart.coupon.discountValue)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async () => {
    checkout.mutate({
      type: deliveryType,
      paymentMethod,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      deliveryAddress: deliveryType === 'DELIVERY' ? form.deliveryAddress : undefined,
      notes: form.notes || undefined,
    }, {
      onSuccess: (res: any) => {
        const orderId = res.data.data?.id;
        if (orderId) {
          router.push(`/dashboard/orders/${orderId}`);
        } else {
          router.push('/dashboard/orders');
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="animate-fade-in text-center py-16">
        <ShoppingCart className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Votre panier est vide</h3>
        <p className="text-sm text-gray-500 mb-6">Ajoutez des articles avant de passer commande</p>
        <Link href="/dashboard/cart">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />Retour au panier</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/cart" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Finaliser la commande</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{items.length} article{items.length > 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Type */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Truck className="h-4 w-4 text-brand" />
              Type de commande
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {DELIVERY_TYPES.map((dt) => {
                const Icon = dt.icon;
                return (
                  <button
                    key={dt.value}
                    onClick={() => setDeliveryType(dt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      deliveryType === dt.value
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mb-2 ${deliveryType === dt.value ? 'text-brand' : 'text-gray-400'}`} />
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{dt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{dt.description}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Contact Info */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <User className="h-4 w-4 text-brand" />
              Informations de contact
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Votre nom"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="+228 XX XX XX XX"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
                  />
                </div>
              </div>
            </div>

            {deliveryType === 'DELIVERY' && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Adresse de livraison</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Adresse complète"
                    value={form.deliveryAddress}
                    onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Payment Method */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand" />
              Mode de paiement
            </h3>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((pm) => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.value}
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                      paymentMethod === pm.value
                        ? 'border-brand bg-brand/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${paymentMethod === pm.value ? 'bg-brand/10 text-brand' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pm.label}</p>
                      <p className="text-xs text-gray-500">{pm.description}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === pm.value ? 'border-brand bg-brand' : 'border-gray-300'
                    }`}>
                      {paymentMethod === pm.value && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-brand" />
              Note (optionnelle)
            </h3>
            <textarea
              placeholder="Instructions particulières pour le vendeur..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100 resize-none"
            />
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4">
          <Card className="p-5 sticky top-24">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Récapitulatif</h3>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {item.image || item.product?.images?.[0] ? (
                      <Image src={(item.image || item.product?.images?.[0]) ?? ''} alt={item.name} fill className="object-cover" sizes="40px" unoptimized />
                    ) : (
                      <ShoppingCart className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-500">x{item.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{formatPrice(Number(item.total))}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Sous-total</span>
                <span className="text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
              </div>
              {cart?.coupon && (
                <div className="flex justify-between text-emerald-600">
                  <span>Réduction ({cart.coupon.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-4"
              size="lg"
              onClick={handleSubmit}
              disabled={checkout.isPending}
            >
              {checkout.isPending ? (
                <><Loader className="h-4 w-4 animate-spin mr-2" />Traitement...</>
              ) : (
                <><CreditCard className="h-4 w-4 mr-2" />Confirmer et payer {formatPrice(total)}</>
              )}
            </Button>

            <p className="text-[10px] text-gray-400 text-center mt-3">
              En confirmant, vous acceptez les conditions générales de vente
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
