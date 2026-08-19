'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowRight, Store,
  ShieldCheck, Sparkles, Truck, Package, ChevronRight, ShoppingBag,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/helpers';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';

const FREE_SHIPPING_THRESHOLD = 50000;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  exit: { opacity: 0, x: 80, transition: { duration: 0.25 } },
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalItems } = useCartStore();
  const { notify } = useToast();

  const itemCount = totalItems();
  const total = totalAmount();
  const progress = Math.min((total / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - total, 0);
  const currency = items[0]?.currency || 'FCFA';

  const handleRemove = (productId: string, name: string) => {
    removeItem(productId);
    notify({ title: 'Retiré du panier', description: `${name} a été supprimé.`, variant: 'success' });
  };

  const handleClear = () => {
    if (items.length === 0) return;
    clearCart();
    notify({ title: 'Panier vidé', description: 'Tous les articles ont été retirés.', variant: 'success' });
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-11 h-11 text-emerald-400/60" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white tracking-tight mb-2">Panier vide</h2>
          <p className="text-gray-500 dark:text-white/40 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
            Parcourez la marketplace pour trouver des produits incroyables près de chez vous.
          </p>
          <Link href="/marketplace">
            <button className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white font-bold text-base shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-all duration-500 active:scale-[0.98]">
              Explorer le marketplace
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] font-semibold uppercase tracking-[0.15em] mb-3">
            <Package className="w-3 h-3" />
            Votre sélection
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white tracking-tight">Mon panier</h1>
          <p className="text-gray-500 dark:text-white/40 text-sm mt-1">{itemCount} article{itemCount > 1 ? 's' : ''} — {formatPrice(total, currency)}</p>
        </div>
        <button onClick={handleClear} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all active:scale-[0.98]">
          <Trash2 className="w-3.5 h-3.5" /> Vider
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div key={item.productId} layout variants={itemVariants} exit="exit" className="group">
                <div className="glass rounded-2xl hover:border-emerald-500/20 transition-all duration-300 p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden shrink-0">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-7 h-7 text-gray-300 dark:text-white/15" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
                          <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">{item.businessName || 'Marchand AfriBiz'}</p>
                          <p className="text-xs text-emerald-400/70 mt-0.5 font-medium">{formatPrice(item.price, item.currency)} / unité</p>
                        </div>
                        <button onClick={() => handleRemove(item.productId, item.name)} className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 dark:text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all active:scale-95">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-white/10 active:scale-95 transition-all disabled:opacity-30">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-emerald-500/20 active:scale-95 transition-all">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-base font-bold text-emerald-400 tabular-nums">{formatPrice(item.price * item.quantity, item.currency)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <motion.div variants={itemVariants} className="space-y-4">
          {/* Free shipping progress */}
          <div className="glass rounded-2xl p-5">
            {remaining > 0 ? (
              <div>
                <div className="flex items-center justify-between text-xs mb-2.5">
                  <span className="text-gray-500 dark:text-white/40 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Livraison offerte à {formatPrice(FREE_SHIPPING_THRESHOLD, 'FCFA')}
                  </span>
                  <span className="text-emerald-400 font-semibold tabular-nums">{formatPrice(remaining, 'FCFA')} restant</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }} className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.4)]" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Livraison offerte éligible !
              </div>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="glass rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 tracking-tight">Récapitulatif</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-white/40">Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})</span>
              <span className="text-gray-700 dark:text-white/70 font-medium tabular-nums">{formatPrice(total, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-white/40">Livraison</span>
              <span className={cn('font-medium tabular-nums', total >= FREE_SHIPPING_THRESHOLD ? 'text-emerald-400' : 'text-gray-700 dark:text-white/70')}>
                {total >= FREE_SHIPPING_THRESHOLD ? 'Gratuite' : '2 500 FCFA'}
              </span>
            </div>
            <div className="h-px bg-gray-100 dark:bg-white/5" />
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-gray-500 dark:text-white/50 font-medium">Total</span>
              <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{formatPrice(total + (total >= FREE_SHIPPING_THRESHOLD ? 0 : 2500), currency)}</span>
            </div>
          </div>

          {/* CTA */}
          <Link href="/checkout">
            <button className="group relative w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white font-bold text-base tracking-tight overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] active:scale-[0.98]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative flex items-center justify-center gap-2">
                Commander
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-white/20">
            <ShieldCheck className="w-3 h-3" /> Paiement sécurisé · AfriBiz Escrow
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
