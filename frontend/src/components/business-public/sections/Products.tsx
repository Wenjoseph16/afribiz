'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types/business';
import {
  ShoppingCart,
  Star,
  Heart,
  Check,
  Loader2,
  Grid3X3,
  Sparkles,
  TrendingUp,
  Clock,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import { ProductViewTracker, useProductClick } from '@/components/customer360/ProductTracker';
import { useCartStore } from '@/stores/cartStore';
import { apiClient } from '@/services/apiClient';

interface ProductsProps {
  businessId: string;
  businessName?: string;
  products: Product[];
}

type ProductFilter = 'all' | 'featured' | 'popular' | 'recent' | 'sale';

export function Products({ businessId, businessName, products }: ProductsProps) {
  const router = useRouter();
  const trackClick = useProductClick();
  const addItem = useCartStore((s) => s.addItem);
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<ProductFilter>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [layawayStarting, setLayawayStarting] = useState<string | null>(null);

  // Badge 🔒 Épargne — offres actives sur les produits de ce business (1 seul appel)
  const productIds = useMemo(() => products.map((p) => p.id), [products]);
  const { data: layawayMap } = useQuery({
    queryKey: ['layaway-offers', businessId, productIds],
    queryFn: async () => {
      try {
        const res = await apiClient.getActiveLayawayOffers('PRODUCT', productIds);
        return res.data.data?.offers || {};
      } catch {
        return {};
      }
    },
    enabled: productIds.length > 0,
    staleTime: 60_000,
  });

  const handleLayaway = async (product: Product) => {
    const offer = (layawayMap || {})[product.id];
    if (!offer) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) {
      router.push('/login?redirect=/dashboard/my-layaway');
      return;
    }
    setLayawayStarting(product.id);
    try {
      await apiClient.createLayawayPlan(offer.id);
      router.push('/dashboard/my-layaway');
    } catch {
      // Plan déjà existant → on y va quand même
      router.push('/dashboard/my-layaway');
    } finally {
      setLayawayStarting(null);
    }
  };

  if (!products?.length) return null;

  // Extract unique categories with product counts
  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    products.forEach((p) => {
      const catName = p.category?.name || 'Autres';
      catMap.set(catName, (catMap.get(catName) || 0) + 1);
    });
    return Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter((p) => (p.category?.name || 'Autres') === activeCategory);
    }

    // Sort/filter by type
    switch (activeFilter) {
      case 'featured':
        filtered = filtered.filter((p) => p.featured);
        break;
      case 'popular':
        filtered = filtered.sort((a, b) => b.orderCount - a.orderCount);
        break;
      case 'recent':
        filtered = filtered.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'sale':
        filtered = filtered.filter((p) => p.isPromotional);
        break;
      default:
        // 'all' — keep as-is
        break;
    }

    return filtered;
  }, [products, activeCategory, activeFilter]);

  const filterTabs: { key: ProductFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tous', icon: <Grid3X3 className="w-4 h-4" /> },
    { key: 'featured', label: 'Vedettes', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'popular', label: 'Populaires', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'recent', label: 'Récents', icon: <Clock className="w-4 h-4" /> },
    ...(products.some((p) => p.isPromotional)
      ? [{ key: 'sale' as ProductFilter, label: 'Promos', icon: <Star className="w-4 h-4" /> }]
      : []),
  ];

  const handleAddToCart = async (product: Product) => {
    setAddingId(product.id);
    await trackClick(businessId, product.id, 'public-page');

    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      currency: product.currency,
      quantity: 1,
      image: product.images?.[0],
      businessId,
      businessName,
    });

    setAddingId(null);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 2000);
    openDrawer();
  };

  return (
    <section id="section-products" className="scroll-mt-32 bg-gray-50 dark:bg-gray-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Nos Produits
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {products.length} produit{products.length > 1 ? 's' : ''} disponible
          {products.length > 1 ? 's' : ''}
        </p>

        {/* Filter tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all',
                activeFilter === tab.key
                  ? 'bg-brand text-white shadow-sm shadow-brand/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-brand/30 hover:text-brand'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-6">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                activeCategory === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              )}
            >
              Tout ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  activeCategory === cat.name
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {/* Product grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <ProductViewTracker
                  businessId={businessId}
                  productId={product.id}
                  source="public-page"
                />
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingCart className="w-12 h-12" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.featured && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-amber-900 rounded-full shadow-sm">
                        Vedette
                      </span>
                    )}
                    {product.isPromotional && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full shadow-sm">
                        -{product.discountPercent || ''}%
                      </span>
                    )}
                    {(layawayMap || {})[product.id] && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full shadow-sm flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Épargne dispo
                      </span>
                    )}
                  </div>

                  <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 hover:scale-110">
                    <Heart className="w-4 h-4" />
                  </button>

                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-lg">
                        Rupture de stock
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {product.category && (
                    <p className="text-[10px] font-medium text-brand uppercase tracking-wider mb-1">
                      {product.category.name}
                    </p>
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      {product.isPromotional && product.promotionalPrice ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg font-bold text-red-500">
                            {formatPrice(Number(product.promotionalPrice), product.currency)}
                          </span>
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(Number(product.price), product.currency)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-brand">
                          {formatPrice(Number(product.price), product.currency)}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {product.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Stock indicator */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {product.stock > 0 ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        {product.stock <= 5 ? `Plus que ${product.stock} en stock` : 'En stock'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Rupture
                      </span>
                    )}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0 || addingId === product.id}
                      className={cn(
                        'flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                        justAddedId === product.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-brand text-white hover:bg-brand-600',
                        (product.stock <= 0 || addingId === product.id) &&
                          'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {addingId === product.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : justAddedId === product.id ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <ShoppingCart className="w-3 h-3" />
                      )}
                      {justAddedId === product.id ? 'Ajouté' : 'Commander'}
                    </button>
                    {(layawayMap || {})[product.id] && (
                      <button
                        onClick={() => handleLayaway(product)}
                        disabled={layawayStarting === product.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                      >
                        {layawayStarting === product.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )}
                        Épargner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Aucun produit ne correspond à ce filtre.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
