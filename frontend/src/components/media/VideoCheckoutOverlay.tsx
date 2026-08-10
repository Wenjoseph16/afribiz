'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShieldCheck, Loader2, Check, ShoppingBag, Calendar, ArrowRight, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/apiClient';

const PAYMENT_METHODS = [
  { id: 'WAVE', label: 'Wave', emoji: '🌊', desc: 'Numéro Wave' },
  { id: 'ORANGE_MONEY', label: 'Orange', emoji: '🟠', desc: 'Orange Money' },
  { id: 'MTN_MOMO', label: 'MoMo', emoji: '🟡', desc: 'MTN Mobile Money' },
  { id: 'CARD', label: 'Carte', emoji: '💳', desc: 'Visa / Mastercard' },
];

interface VideoCheckoutOverlayProps {
  open: boolean;
  onClose: () => void;
  commerce: any; // { type, data, action, label }
}

export function VideoCheckoutOverlay({ open, onClose, commerce }: VideoCheckoutOverlayProps) {
  const { user } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState('WAVE');
  const [date, setDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  if (!open || !commerce) return null;

  const { type, data, action } = commerce;
  const isProduct = action === 'order' || action === 'add_to_cart';
  const isBook = action === 'book';
  const price = data?.price ?? data?.flashPrice ?? 0;
  const image = data?.images?.[0] || data?.image || data?.coverImage || null;
  const total = Number(price) * quantity;

  const handleClose = () => {
    setOrder(null);
    setError(null);
    setQuantity(1);
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isBook) {
        const res = await apiClient.mediaBook({
          serviceId: data.id,
          businessId: data.businessId,
          scheduledAt: new Date(date + 'T10:00:00').toISOString(),
        });
        setOrder({ reference: res.data?.data?.bookingNumber || 'Réservation', kind: 'book' });
      } else {
        const res = await apiClient.mediaCreateOrder({
          productId: data.id,
          businessId: data.businessId,
          quantity,
          paymentMethod: method,
        });
        setOrder({ reference: res.data?.data?.orderNumber || 'Commande', kind: 'order' });
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Action échouée');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div
        className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-slide-up overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand-500" />
            {order ? 'Commande confirmée' : isBook ? 'Réserver' : 'Acheter sur la vidéo'}
          </h3>
          <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {order ? (
          /* ─── SUCCESS STATE ─── */
          <div className="p-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center animate-pop-in">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {order.kind === 'book' ? 'Réservation créée ✓' : 'Commande créée ✓'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Référence : <span className="font-mono font-semibold text-gray-700 dark:text-gray-200">{order.reference}</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Le business a été notifié. Vous pourrez finaliser le paiement depuis vos commandes.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Continuer la vidéo
              </button>
              <Link
                href="/dashboard/orders"
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-sm font-semibold text-white hover:from-brand-600 hover:to-brand-700 transition-all flex items-center justify-center gap-1"
              >
                Voir mes commandes <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* ─── CHECKOUT ─── */
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Produit */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {image ? (
                  <Image src={image} alt={data?.name || data?.title || ''} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{data?.name || data?.title}</p>
                <p className="text-lg font-bold text-brand-600 dark:text-brand-400">
                  {Number(price).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Quantité (produits) */}
            {isProduct && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantité</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-90 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-600 dark:text-brand-400 hover:bg-brand-200 dark:hover:bg-brand-800 active:scale-90 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Date (services / réservations) */}
            {isBook && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-brand-500" /> Date
                </span>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="px-3 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            )}

            {/* Moyen de paiement */}
            {isProduct && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payer avec</p>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMethod(m.id)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all active:scale-[0.98]',
                        method === m.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 ring-1 ring-brand-500/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{m.label}</p>
                        <p className="text-[10px] text-gray-400 truncate">{m.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sécurité escrow */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Paiement 100% sécurisé par l'escrow AfriBiz : vos fonds sont bloqués jusqu'à la
                confirmation de livraison. En cas de litige, votre argent est protégé.
              </p>
            </div>

            {/* Total + CTA */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <p className="text-[11px] text-gray-400">Total</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {Number(total).toLocaleString('fr-FR')} <span className="text-sm font-medium">FCFA</span>
                </p>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-bold hover:from-brand-600 hover:to-brand-700 active:scale-95 transition-all shadow-lg shadow-brand-500/30 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isBook ? (
                  <>
                    <Calendar className="w-4 h-4" /> Réserver
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Commander
                  </>
                )}
              </button>
            </div>

            {/* Épargne tontine (produits seulement) */}
            {isProduct && (
              <Link
                href={`/products/${data?.slug || data?.id}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all"
              >
                <PiggyBank className="w-4 h-4" />
                Pas assez maintenant ? Épargnez via la tontine et achetez plus tard →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
