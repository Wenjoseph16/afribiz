'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalAmount, totalItems } = useCartStore();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-[70] transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-brand" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Votre Panier</h2>
              <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs font-bold">
                {totalItems()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.productId} className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 relative overflow-hidden shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                      {item.businessName || 'AfriBiz Merchant'}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Minus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatPrice(item.price * item.quantity, item.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <ShoppingCart className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">Votre panier est vide</p>
                <button
                  onClick={onClose}
                  className="text-sm font-medium text-brand mt-2 hover:underline"
                >
                  Continuer vos achats
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Sous-total</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(totalAmount(), items[0].currency)}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                Frais de livraison calculés lors de la commande.
              </p>
              <Link href="/checkout" onClick={onClose}>
                <Button className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-brand/20">
                  Passer la commande
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
