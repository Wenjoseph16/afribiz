'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import type { MenuResult } from './types';

interface MenuCardProps {
  item: MenuResult;
  view?: 'grid' | 'list';
}

export default function MenuCard({ item, view = 'grid' }: MenuCardProps) {
  const router = useRouter();
  const addToCart = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.available) return;
    addToCart({
      id: item.id,
      productId: item.id,
      name: item.name,
      price: item.price,
      currency: 'FCFA',
      quantity: 1,
      image: item.image || '',
      businessId: item.businessSlug || item.id,
      businessName: item.restaurant,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleQuickOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.available) return;
    addToCart({
      id: item.id,
      productId: item.id,
      name: item.name,
      price: item.price,
      currency: 'FCFA',
      quantity: 1,
      image: item.image || '',
      businessId: item.businessSlug || item.id,
      businessName: item.restaurant,
    });
    router.push('/checkout');
  };

  const handleCardClick = () => {
    router.push(`/business/${item.businessSlug || item.id}`);
  };

  if (view === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 cursor-pointer"
      >
        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <ShoppingBag className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.restaurant}</p>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1 block">
              {item.price.toLocaleString()} FCFA
            </span>
          </div>
          <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
            <span
              className={cn(
                'text-xs font-medium',
                item.available
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400'
              )}
            >
              {item.available ? 'Disponible' : 'Indisponible'}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleQuickOrder}
                disabled={!item.available}
                className="text-xs font-medium text-white bg-brand hover:bg-brand-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                Commander
              </button>
              <button
                onClick={handleAddToCart}
                disabled={!item.available}
                className={cn(
                  'text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors border',
                  added
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'text-brand border-brand/30 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                )}
              >
                {added ? '✓' : <ShoppingCart className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 overflow-hidden group cursor-pointer"
    >
      <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            width={400}
            height={128}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <ShoppingBag className="h-10 w-10 text-gray-300 dark:text-gray-600" />
        )}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.restaurant}</p>
        <div className="flex items-center justify-between mb-3">
          <span
            className={cn(
              'text-xs font-medium',
              item.available
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-500 dark:text-red-400'
            )}
          >
            {item.available ? 'Disponible' : 'Indisponible'}
          </span>
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">
            {item.price.toLocaleString()} FCFA
          </span>
        </div>
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleQuickOrder}
            disabled={!item.available}
            className="flex-1 text-center text-xs font-medium text-white bg-brand rounded-lg py-2 hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            Commander
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!item.available}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
              added
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'text-brand border-brand/30 hover:bg-brand-50 dark:hover:bg-brand-900/20'
            )}
          >
            {added ? '✓ Ajouté' : <ShoppingCart className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
