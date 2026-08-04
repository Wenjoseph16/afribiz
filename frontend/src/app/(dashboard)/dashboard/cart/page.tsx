'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Store, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/utils/helpers';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalItems } = useCartStore();

  const itemCount = totalItems();
  const total = totalAmount();

  if (itemCount === 0) {
    return (
      <Card className="text-center py-16">
        <ShoppingCart className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Votre panier est vide
        </h3>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Explorez le marketplace pour découvrir des produits et services
        </p>
        <Link href="/dashboard/explore">
          <Button size="lg">
            <Store className="h-4 w-4 mr-2" />
            Explorer le marketplace
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Mon panier
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {itemCount} article{itemCount > 1 ? 's' : ''} dans votre panier
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearCart}
          className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <Trash2 className="h-4 w-4 mr-1.5" />
          Vider le panier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.productId} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <ShoppingCart className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {item.businessName || 'AfriBiz Merchant'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatPrice(item.price, item.currency)} / unité
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg disabled:opacity-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatPrice(item.price * item.quantity, item.currency)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Résumé</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>
                  Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})
                </span>
                <span className="text-gray-900 dark:text-gray-100">{formatPrice(total)}</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button className="w-full mt-4" size="lg">
                <CreditCard className="h-4 w-4 mr-2" />
                Commander
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <p className="text-[11px] text-gray-400 text-center mt-3">
              Le paiement se fait à l&apos;étape suivante (Mobile Money, Escrow, carte…)
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
