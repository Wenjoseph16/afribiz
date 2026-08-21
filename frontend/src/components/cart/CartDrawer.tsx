'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Truck,
  Smartphone,
  Banknote,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutHref?: string;
  checkoutLabel?: string;
}

const FREE_SHIPPING_THRESHOLD = 50000;

const PAYMENT_METHODS = [
  { id: 'wave', label: 'Wave', icon: Smartphone, color: 'from-blue-500 to-blue-600' },
  { id: 'momo', label: 'Mobile Money', icon: Smartphone, color: 'from-yellow-500 to-orange-500' },
  { id: 'cod', label: 'À la livraison', icon: Banknote, color: 'from-emerald-500 to-emerald-600' },
] as const;

export function CartDrawer({
  isOpen,
  onClose,
  checkoutHref = '/checkout',
  checkoutLabel = 'Passer la commande',
}: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalAmount, totalItems } = useCartStore();
  const [selectedPayment, setSelectedPayment] = useState<string>('wave');

  const subtotal = totalAmount();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 2500;
  const total = subtotal + shipping;
  const progress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-[420px] z-[70] flex flex-col"
          >
            {/* Glass panel */}
            <div className="h-full bg-slate-950/95 backdrop-blur-2xl border-l border-emerald-500/10 shadow-[-20px_0_60px_-15px_rgba(16,185,129,0.08)] flex flex-col overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-emerald-400" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full opacity-60"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                        Mon Panier Express
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                        {totalItems()} article{totalItems() > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/40 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-white/10 hover:border-white/20 transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 scrollbar-thin">
                {items.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {items.map((item, idx) => (
                      <motion.div
                        key={item.productId}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative rounded-2xl bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all duration-300 overflow-hidden"
                      >
                        {/* Hover glow */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

                        <div className="relative flex gap-3 p-3">
                          {/* Image */}
                          <div className="relative w-16 h-16 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden shrink-0">
                            {item.image ? (
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="w-6 h-6 text-gray-400 dark:text-white/20" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {item.name}
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 truncate">
                                  {item.businessName || 'Marchand AfriBiz'}
                                </p>
                              </div>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Price + Qty */}
                            <div className="flex items-center justify-between mt-2.5">
                              {/* Quantity */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:bg-white/10 hover:border-white/20 active:scale-95 transition-all duration-150"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                  className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-emerald-500/20 hover:border-emerald-500/30 active:scale-95 transition-all duration-150"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Price */}
                              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                                {formatPrice(item.price * item.quantity, item.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  /* Empty state */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center py-12"
                  >
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mb-5">
                      <ShoppingBag className="w-9 h-9 text-emerald-500/30" />
                    </div>
                    <p className="text-gray-500 dark:text-white/40 font-medium">
                      Votre panier est vide
                    </p>
                    <p className="text-gray-400 dark:text-white/20 text-sm mt-1">
                      Parcourez la marketplace pour trouver des produits
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-5 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-all duration-200"
                    >
                      Continuer vos achats
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-gray-100 dark:border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                  {/* Progress bar */}
                  <div className="px-6 pt-4 pb-3">
                    {remaining > 0 ? (
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="text-gray-500 dark:text-white/40 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" />
                            Livraison offerte à {formatPrice(FREE_SHIPPING_THRESHOLD, 'FCFA')}
                          </span>
                          <span className="text-emerald-400 font-semibold tabular-nums">
                            {formatPrice(remaining, 'FCFA')} restant
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        Livraison offerte eligible !
                      </div>
                    )}
                  </div>

                  {/* Payment method selector */}
                  <div className="px-6 pb-3">
                    <p className="text-xs text-gray-400 dark:text-white/30 mb-2 font-medium uppercase tracking-wider">
                      Paiement rapide
                    </p>
                    <div className="flex gap-2">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isActive = selectedPayment === method.id;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPayment(method.id)}
                            className={cn(
                              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border',
                              isActive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                : 'bg-white/[0.03] border-gray-100 dark:border-white/5 text-gray-400 dark:text-white/30 hover:text-gray-500 dark:text-white/50 hover:border-gray-200 dark:border-white/10'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {method.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="px-6 pb-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-white/40">Sous-total</span>
                      <span className="text-gray-700 dark:text-white/70 font-medium tabular-nums">
                        {formatPrice(subtotal, items[0]?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-white/40">Livraison</span>
                      <span
                        className={cn(
                          'font-medium tabular-nums',
                          shipping === 0 ? 'text-emerald-400' : 'text-gray-700 dark:text-white/70'
                        )}
                      >
                        {shipping === 0 ? 'Gratuite' : formatPrice(shipping, 'FCFA')}
                      </span>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
                    <div className="flex justify-between items-baseline">
                      <span className="text-gray-500 dark:text-white/50 font-medium">Total</span>
                      <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatPrice(total, items[0]?.currency)}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-6 pb-6">
                    <Link href={checkoutHref} onClick={onClose}>
                      <button className="group/btn relative w-full h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-gray-900 dark:text-white font-bold text-base tracking-tight overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] active:scale-[0.98]">
                        {/* Animated shine */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 ease-out" />
                        <span className="relative flex items-center justify-center gap-2">
                          {checkoutLabel}
                          <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform duration-200" />
                        </span>
                      </button>
                    </Link>
                    <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-gray-400 dark:text-white/20">
                      <ShieldCheck className="w-3 h-3" />
                      Paiement securise &middot; AfriBiz Escrow
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
