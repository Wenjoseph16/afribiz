'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ShoppingCart, MessageCircle, Store } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useAddToCart } from '@/features/hooks';
import { ProductDetailModal } from '@/components/marketplace/ProductDetailModal';
import StarRating from './StarRating';
import type { ProductResult } from './types';

interface ProductCardProps {
  item: ProductResult;
  view?: 'grid' | 'list';
}

export default function ProductCard({ item, view = 'grid' }: ProductCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const addToCart = useAddToCart();
  const [showDetail, setShowDetail] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const badge = (item.promoPrice && item.promoPrice < item.price)
    ? Math.round((1 - item.promoPrice / item.price) * 100) : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      await addToCart.mutateAsync({
        productId: item.id,
        name: item.name,
        quantity: 1,
        unitPrice: item.promoPrice || item.price,
        image: item.image,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (e) {
      console.error('Error adding to cart:', e);
    }
  };

  const handleContactBusiness = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated()) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    router.push('/dashboard/messages?businessId=' + item.businessId + '&businessName=' + encodeURIComponent(item.businessName));
  };

  const handleVisitStore = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push('/business/' + item.businessSlug);
  };

  const handleQuickOrder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await handleAddToCart(e);
    router.push('/dashboard/cart');
  };

  const renderPrice = () => {
    if (badge > 0) {
      return (
        <div className="flex items-center gap-2">
          <span className={view === 'list' ? 'text-lg font-bold text-brand' : 'text-base font-bold text-brand'}>
            {item.promoPrice?.toLocaleString()} FCFA
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
            {item.price.toLocaleString()} FCFA
          </span>
        </div>
      );
    }
    if (item.price > 0) {
      return (
        <span className={cn('font-bold text-gray-900 dark:text-gray-100', view === 'list' ? 'text-lg' : 'text-base')}>
          {item.price.toLocaleString()} FCFA
        </span>
      );
    }
    return (
      <span className={cn('font-bold text-emerald-600 dark:text-emerald-400', view === 'list' ? 'text-lg' : 'text-base')}>
        Gratuit
      </span>
    );
  };

  const renderActions = (isList: boolean) => (
    <div className={isList ? 'flex items-center gap-2 mt-3 flex-wrap' : 'flex flex-wrap gap-1.5'}>
      <button onClick={handleAddToCart} disabled={addToCart.isPending}
        className={cn(
          isList
            ? 'text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5'
            : 'flex-1 text-xs font-semibold px-2.5 py-2 rounded-lg inline-flex items-center justify-center gap-1.5',
          'transition-all',
          addedToCart ? 'bg-emerald-500 text-white' : 'bg-brand text-white hover:bg-brand-700'
        )}>
        {addToCart.isPending
          ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          : addedToCart
            ? <><span>✓</span> Ajouté</>
            : <><ShoppingCart className={isList ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> Panier</>
        }
      </button>
      <button onClick={handleQuickOrder}
        className={cn(
          isList
            ? 'text-xs font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 bg-gradient-to-r from-brand to-emerald-400 text-white hover:shadow-md transition-all'
            : 'flex-1 text-xs font-semibold px-2.5 py-2 rounded-lg inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-brand to-emerald-400 text-white hover:shadow-md transition-all'
        )}>
        Commander
      </button>
      {!isList && (
        <div className="w-full flex gap-1.5 mt-1">
          <button onClick={handleVisitStore}
            className="flex-1 text-[11px] font-medium px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-1">
            <Store className="w-3 h-3" /> Boutique
          </button>
          <button onClick={handleContactBusiness}
            className="flex-1 text-[11px] font-medium px-2 py-1.5 rounded-lg border border-brand/20 text-brand hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors inline-flex items-center justify-center gap-1">
            <MessageCircle className="w-3 h-3" /> Contacter
          </button>
        </div>
      )}
      {isList && (
        <>
          <button onClick={handleVisitStore}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5">
            <Store className="w-3 h-3" /> Boutique
          </button>
          <button onClick={handleContactBusiness}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand/20 text-brand hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors inline-flex items-center gap-1.5">
            <MessageCircle className="w-3 h-3" /> Contacter
          </button>
        </>
      )}
    </div>
  );

  if (view === 'list') {
    return (
      <>
        <div
          onClick={() => setShowDetail(true)}
          className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/30 hover:shadow-card transition-all duration-200 group cursor-pointer"
        >
          <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 relative">
            {item.image ? (
              <Image src={item.image} alt="" width={96} height={96} className="w-full h-full object-cover" unoptimized />
            ) : (
              <div className="text-gray-300 dark:text-gray-600">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M3 7l2 14h14l2-14M3 7l3-4h12l3 4" />
                </svg>
              </div>
            )}
            {badge > 0 && (
              <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded">
                -{badge}%
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.businessName} - {item.city}</p>
              </div>
              <div className="flex items-center gap-1">
                <StarRating rating={item.rating} />
                <span className="text-xs text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-2">
              {renderPrice()}
            </div>
            {renderActions(true)}
          </div>
        </div>
        <ProductDetailModal product={item} isOpen={showDetail} onClose={() => setShowDetail(false)} />
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => setShowDetail(true)}
        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/30 hover:shadow-xl transition-all duration-300 group overflow-hidden cursor-pointer hover:-translate-y-1"
      >
        <div className="h-40 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
          {item.image ? (
            <Image src={item.image} alt="" width={400} height={160} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7h18M3 7l2 14h14l2-14M3 7l3-4h12l3 4" />
              </svg>
            </div>
          )}
          {badge > 0 && (
            <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg shadow flex items-center gap-1">
              -{badge}%
            </span>
          )}
          {!item.available && (
            <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 bg-white/80 dark:bg-gray-900/80 px-3 py-1 rounded-lg">
                Rupture
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300">
              Détails
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 group-hover:text-brand transition-colors line-clamp-2">
              {item.name}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              <StarRating rating={item.rating} />
              <span className="text-xs text-gray-400">({item.reviewCount})</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
            {item.businessName} - {item.city}
          </p>
          <div className="mb-3">
            {renderPrice()}
          </div>
          {renderActions(false)}
        </div>
      </div>
      <ProductDetailModal product={item} isOpen={showDetail} onClose={() => setShowDetail(false)} />
    </>
  );
}
