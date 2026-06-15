'use client';

import Image from 'next/image';
import { Product } from '@/types/business';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { ProductViewTracker, useProductClick } from '@/components/customer360/ProductTracker';

interface ProductsProps {
  businessId: string;
  products: Product[];
}

export function Products({ businessId, products }: ProductsProps) {
  const trackClick = useProductClick();

  if (!products?.length) return null;

  return (
    <section id="section-products" className="scroll-mt-32 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Nos Produits</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group">
              <ProductViewTracker businessId={businessId} productId={product.id} source="public-page" />
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                {product.images?.[0] ? (
                  <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400"><ShoppingCart className="w-12 h-12" /></div>
                )}
                <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">{product.name}</h3>
                {product.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{product.description}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand">{formatPrice(Number(product.price), product.currency)}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {product.rating.toFixed(1)} ({product.reviewCount})
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  {product.stock > 0 ? (
                    <span className="text-xs text-green-600 dark:text-green-400">En stock</span>
                  ) : (
                    <span className="text-xs text-red-500">Rupture</span>
                  )}
                  <button
                    onClick={() => trackClick(businessId, product.id, 'public-page')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors"
                  >
                    <ShoppingCart className="w-3 h-3" /> Commander
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
