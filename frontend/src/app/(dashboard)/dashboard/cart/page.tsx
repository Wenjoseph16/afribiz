'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Tag, Percent, Loader, Store, ChevronRight, CreditCard, Truck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCart, useUpdateCartItem, useRemoveFromCart, useClearCart, useApplyCoupon, useRemoveCoupon } from '@/features/hooks';
import { formatPrice } from '@/utils/helpers';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeFromCart = useRemoveFromCart();
  const clearCart = useClearCart();
  const applyCoupon = useApplyCoupon();
  const removeCoupon = useRemoveCoupon();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const items = cart?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.total), 0);
  const itemCount = items.length;

  const handleQuantityChange = (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    updateCartItem.mutate({ itemId, data: { quantity: newQty } });
  };

  const handleRemove = (itemId: string) => {
    removeFromCart.mutate(itemId);
  };

  const handleApplyCoupon = () => {
    setCouponError('');
    if (!couponCode.trim()) return;
    applyCoupon.mutate(couponCode.trim(), {
      onError: (err: any) => {
        setCouponError(err?.response?.data?.error || 'Code promo invalide');
      },
    });
  };

  const handleRemoveCoupon = () => {
    removeCoupon.mutate();
    setCouponCode('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  const discountAmount = cart?.coupon
    ? cart.coupon.discountType === 'PERCENTAGE'
      ? subtotal * (Number(cart.coupon.discountValue) / 100)
      : Number(cart.coupon.discountValue)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Mon panier</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{itemCount} article{itemCount > 1 ? 's' : ''} dans votre panier</p>
        </div>
        {itemCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => clearCart.mutate()} className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="h-4 w-4 mr-1.5" />Vider le panier
          </Button>
        )}
      </div>

      {itemCount === 0 ? (
        <Card className="text-center py-16">
          <ShoppingCart className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Votre panier est vide</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Explorez le marketplace pour découvrir des produits et services
          </p>
          <Link href="/dashboard/explore">
            <Button size="lg">
              <Store className="h-4 w-4 mr-2" />Explorer le marketplace
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {item.image || item.product?.images?.[0] ? (
                      <Image src={(item.image || item.product?.images?.[0]) ?? ''} alt={item.name} fill className="object-cover" sizes="80px" unoptimized />
                    ) : (
                      <ShoppingCart className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={item.product ? `/dashboard/explore/product/${item.product.slug}` : '#'}>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-brand transition-colors truncate">{item.name}</h3>
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{formatPrice(Number(item.unitPrice))} / unité</p>
                    {item.notes && <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>}
                    {item.product && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Stock: {item.product.stock > 0 ? (
                          <span className="text-emerald-600">{item.product.stock} disponible{item.product.stock > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-red-500">Rupture</span>
                        )}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-l-lg disabled:opacity-50"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-r-lg"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(Number(item.total))}</p>
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
                  <span>Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatPrice(subtotal)}</span>
                </div>
                {cart?.coupon && (
                  <div className="flex justify-between text-emerald-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      Code {cart.coupon.code}
                    </span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 flex justify-between font-bold text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Link href="/dashboard/cart/checkout">
                <Button className="w-full mt-4" size="lg" disabled={itemCount === 0}>
                  <CreditCard className="h-4 w-4 mr-2" />Commander
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Percent className="h-4 w-4 text-brand" />
                Code promo
              </h3>
              {cart?.coupon ? (
                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{cart.coupon.code}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">
                      {cart.coupon.discountType === 'PERCENTAGE' ? `${cart.coupon.discountValue}% de réduction` : `${formatPrice(Number(cart.coupon.discountValue))} de réduction`}
                    </p>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:text-red-600">
                    Retirer
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Entrez votre code"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                    className="flex-1"
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={!couponCode.trim() || applyCoupon.isPending}>
                    {applyCoupon.isPending ? <Loader className="h-4 w-4 animate-spin" /> : 'Appliquer'}
                  </Button>
                </div>
              )}
              {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
