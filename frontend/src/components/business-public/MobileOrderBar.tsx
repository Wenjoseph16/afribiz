'use client';

import { useState, useCallback } from 'react';
import { ShoppingCart, Phone, MessageCircle, X, ChevronUp, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { Business } from '@/types/business';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileOrderBarProps {
  business: Business;
  slug: string;
}

export function MobileOrderBar({ business, slug }: MobileOrderBarProps) {
  const [expanded, setExpanded] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());
  const totalAmount = useCartStore((s) => s.totalAmount());
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);

  const hasActions = business.phone || business.whatsapp || business.modules.includes('PRODUCTS');
  if (!hasActions) return null;

  const handleScrollTo = useCallback((sectionId: string) => {
    setExpanded(false);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  }, []);

  const fmtPrice = (price: number) => {
    if (Number.isNaN(price)) return '0 FCFA';
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  return (
    <>
      <div className="h-16 sm:hidden" />
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            onClick={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
        <AnimatePresence>
          {expanded && totalItems > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-2xl mx-2 mb-2 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Mon panier ({totalItems})
                  </h4>
                  <button
                    onClick={() => setExpanded(false)}
                    className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 py-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs text-gray-400 font-medium w-5 shrink-0">
                          {item.quantity}x
                        </span>
                        <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {fmtPrice(Number(item.price) * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {items.length > 5 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                      +{items.length - 5} autre{items.length - 5 > 1 ? 's' : ''} article
                      {items.length - 5 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-base font-bold text-brand">{fmtPrice(totalAmount)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-brand hover:text-white transition-all active:scale-95"
                  aria-label="Appeler"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
            {totalItems > 0 ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex-1 flex items-center justify-between gap-2 px-4 py-2.5 bg-brand text-white rounded-xl font-medium text-sm hover:bg-brand-600 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-brand text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-brand">
                      {totalItems}
                    </span>
                  </div>
                  <span>Panier</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold">{fmtPrice(totalAmount)}</span>
                  <ChevronUp
                    className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')}
                  />
                </div>
              </button>
            ) : (
              <div className="flex-1 flex items-center gap-1.5">
                {business.modules.includes('PRODUCTS') && (
                  <button
                    onClick={() => handleScrollTo('section-products')}
                    className="flex-1 px-4 py-2.5 bg-brand text-white rounded-xl font-medium text-sm hover:bg-brand-600 transition-colors active:scale-[0.98]"
                  >
                    Commander maintenant
                  </button>
                )}
                {business.modules.includes('ROOMS') && (
                  <button
                    onClick={() => handleScrollTo('section-rooms')}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-[0.98]"
                  >
                    Réserver maintenant
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
