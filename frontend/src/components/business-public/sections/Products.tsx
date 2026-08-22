'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  X,
  ChevronLeft,
  ChevronRight,
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

/* ─── Stagger entry observer hook ─── */
function useStaggerReveal(itemCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, visible, itemCount };
}

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
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [quickViewImg, setQuickViewImg] = useState(0);

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
      router.push('/dashboard/my-layaway');
    } finally {
      setLayawayStarting(null);
    }
  };

  if (!products?.length) return null;

  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    products.forEach((p) => {
      const catName = p.category?.name || 'Autres';
      catMap.set(catName, (catMap.get(catName) || 0) + 1);
    });
    return Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (activeCategory !== 'all') {
      filtered = filtered.filter((p) => (p.category?.name || 'Autres') === activeCategory);
    }
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
    }
    return filtered;
  }, [products, activeCategory, activeFilter]);

  const filterTabs: { key: ProductFilter; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tous', icon: <Grid3X3 className="w-3.5 h-3.5" /> },
    { key: 'featured', label: 'Vedettes', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'popular', label: 'Populaires', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { key: 'recent', label: 'Récents', icon: <Clock className="w-3.5 h-3.5" /> },
    ...(products.some((p) => p.isPromotional)
      ? [{ key: 'sale' as ProductFilter, label: 'Promos', icon: <Star className="w-3.5 h-3.5" /> }]
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

  const stagger = useStaggerReveal(filteredProducts.length);

  return (
    <section id="section-products" className="scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        {/* ─── Eyebrow + Title ─── */}
        <div className="mb-10 md:mb-14">
          <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-brand-50 text-brand-700 border border-brand-100 mb-4">
            Catalogue
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
                Nos Produits
              </h2>
              <p className="mt-2 text-gray-500 text-sm">
                {products.length} produit{products.length > 1 ? 's' : ''} disponible
                {products.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Filters — floating pill ─── */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]',
                activeFilter === tab.key
                  ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                  : 'bg-white text-gray-500 border border-gray-100 hover:border-gray-200 hover:text-gray-900'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Category chips ─── */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-10">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300',
                activeCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              )}
            >
              Tout ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300',
                  activeCategory === cat.name
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                )}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        )}

        {/* ─── Asymmetrical Bento Grid ─── */}
        {filteredProducts.length > 0 ? (
          <div
            ref={stagger.ref}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
          >
            {filteredProducts.map((product, idx) => {
              /* First item spans 2 cols on large screens for visual break */
              const isHero = idx === 0 && filteredProducts.length > 2;
              return (
                <div
                  key={product.id}
                  className={cn(
                    'group relative transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]',
                    isHero && 'sm:col-span-2 lg:col-span-2',
                    stagger.visible
                      ? 'opacity-100 translate-y-0 blur-0'
                      : 'opacity-0 translate-y-8 blur-[2px]'
                  )}
                  style={{ transitionDelay: `${Math.min(idx * 80, 400)}ms` }}
                >
                  <ProductViewTracker
                    businessId={businessId}
                    productId={product.id}
                    source="public-page"
                  />
                  {/* ─── Double-Bezel Card ─── */}
                  <div className="p-[1px] rounded-[1.25rem] bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
                    <div className="bg-white rounded-[calc(1.25rem-1px)] overflow-hidden">
                      {/* Image Zone */}
                      <div
                        className={cn(
                          'relative overflow-hidden bg-gray-50 cursor-pointer',
                          isHero ? 'aspect-[16/10]' : 'aspect-square'
                        )}
                        onClick={() => {
                          setQuickView(product);
                          setQuickViewImg(0);
                        }}
                      >
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            sizes={
                              isHero
                                ? '(max-width: 768px) 100vw, 66vw'
                                : '(max-width: 768px) 100vw, 33vw'
                            }
                            className="object-cover group-hover:scale-[1.04] transition-transform duration-[800ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="w-10 h-10 text-gray-200" />
                          </div>
                        )}

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Badges — top left */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          {product.featured && (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-400/90 text-amber-900 rounded-full backdrop-blur-sm">
                              ★ Vedette
                            </span>
                          )}
                          {product.isPromotional && (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-red-500/90 text-white rounded-full backdrop-blur-sm">
                              -{product.discountPercent || ''}%
                            </span>
                          )}
                          {(layawayMap || {})[product.id] && (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/90 text-white rounded-full backdrop-blur-sm flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Épargne
                            </span>
                          )}
                        </div>

                        {/* Heart — magnetic on hover */}
                        <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-gray-400 hover:text-red-500 transition-all duration-300 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 hover:scale-110 active:scale-95">
                          <Heart className="w-4 h-4" />
                        </button>

                        {/* Stock overlay */}
                        {product.stock <= 0 && (
                          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-4 py-2 bg-gray-900 text-white text-xs font-semibold rounded-full">
                              Rupture de stock
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Zone */}
                      <div className="p-4 md:p-5">
                        {product.category && (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-600 mb-2">
                            {product.category.name}
                          </p>
                        )}
                        <h3
                          className="font-semibold text-gray-900 text-[15px] leading-tight mb-1 line-clamp-1 cursor-pointer hover:text-brand-700 transition-colors"
                          onClick={() => {
                            setQuickView(product);
                            setQuickViewImg(0);
                          }}
                        >
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-[13px] text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {product.description}
                          </p>
                        )}

                        {/* Price + Rating */}
                        <div className="flex items-center justify-between mb-3">
                          {product.isPromotional && product.promotionalPrice ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-bold text-red-500 tracking-tight">
                                {formatPrice(Number(product.promotionalPrice), product.currency)}
                              </span>
                              <span className="text-xs text-gray-300 line-through">
                                {formatPrice(Number(product.price), product.currency)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xl font-bold text-gray-900 tracking-tight">
                              {formatPrice(Number(product.price), product.currency)}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {product.rating.toFixed(1)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                          <div className="flex-1">
                            {product.stock > 0 ? (
                              <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {product.stock <= 5 ? `${product.stock} en stock` : 'En stock'}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[11px] text-red-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                Indisponible
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock <= 0 || addingId === product.id}
                            className={cn(
                              'flex items-center gap-1.5 px-4 py-2 text-[12px] font-semibold rounded-full transition-all duration-300 active:scale-[0.97]',
                              justAddedId === product.id
                                ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/10 hover:shadow-gray-900/20',
                              (product.stock <= 0 || addingId === product.id) &&
                                'opacity-40 cursor-not-allowed'
                            )}
                          >
                            {addingId === product.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : justAddedId === product.id ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <ShoppingCart className="w-3.5 h-3.5" />
                            )}
                            {justAddedId === product.id ? 'Ajouté' : 'Commander'}
                          </button>
                          {(layawayMap || {})[product.id] && (
                            <button
                              onClick={() => handleLayaway(product)}
                              disabled={layawayStarting === product.id}
                              className="flex items-center gap-1 px-3 py-2 text-[12px] font-semibold rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all duration-300 active:scale-[0.97]"
                            >
                              {layawayStarting === product.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Lock className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── Empty State ─── */
          <div className="text-center py-20 rounded-[1.5rem] border border-dashed border-gray-200 bg-gray-50/50">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm font-medium">
              Aucun produit ne correspond à ce filtre.
            </p>
          </div>
        )}
      </div>

      {/* ─── Quick View Modal ─── */}
      {quickView && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQuickView(null)}
        >
          <div
            className="relative bg-white rounded-[1.5rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setQuickView(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:scale-105 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="grid md:grid-cols-2">
              {/* Gallery */}
              <div className="relative aspect-square bg-gray-50 md:rounded-l-[1.5rem] overflow-hidden">
                {quickView.images?.[quickViewImg] ? (
                  <Image
                    src={quickView.images[quickViewImg]}
                    alt={quickView.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-gray-200" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                  {quickView.featured && (
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-400/90 text-amber-900 rounded-full backdrop-blur-sm">
                      ★ Vedette
                    </span>
                  )}
                  {quickView.isPromotional && (
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-red-500/90 text-white rounded-full backdrop-blur-sm">
                      -{quickView.discountPercent || ''}%
                    </span>
                  )}
                </div>

                {/* Gallery nav */}
                {(quickView.images?.length || 0) > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setQuickViewImg(
                          (quickViewImg - 1 + quickView.images.length) % quickView.images.length
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setQuickViewImg((quickViewImg + 1) % quickView.images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                      {quickView.images.map((_, i) => (
                        <span
                          key={i}
                          className={cn(
                            'w-1.5 h-1.5 rounded-full transition-all',
                            i === quickViewImg ? 'bg-gray-900 w-4' : 'bg-gray-300'
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Details */}
              <div className="p-6 md:p-8 flex flex-col">
                {quickView.category && (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-brand-600 mb-2">
                    {quickView.category.name}
                  </p>
                )}
                <h3 className="text-xl font-bold tracking-tight text-gray-900 leading-tight mb-2">
                  {quickView.name}
                </h3>

                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {quickView.rating.toFixed(1)}
                  </span>
                  {quickView.orderCount > 0 && <span className="text-xs text-gray-300">·</span>}
                  {quickView.orderCount > 0 && (
                    <span className="text-xs text-gray-400">{quickView.orderCount} ventes</span>
                  )}
                </div>

                {quickView.description && (
                  <p className="text-[13px] text-gray-500 leading-relaxed mb-5 whitespace-pre-line">
                    {quickView.description}
                  </p>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-6">
                  {quickView.isPromotional && quickView.promotionalPrice ? (
                    <>
                      <span className="text-3xl font-bold text-red-500 tracking-tight">
                        {formatPrice(Number(quickView.promotionalPrice), quickView.currency)}
                      </span>
                      <span className="text-sm text-gray-300 line-through">
                        {formatPrice(Number(quickView.price), quickView.currency)}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-gray-900 tracking-tight">
                      {formatPrice(Number(quickView.price), quickView.currency)}
                    </span>
                  )}
                </div>

                {/* Stock */}
                <div className="mb-5">
                  {quickView.stock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {quickView.stock <= 5 ? `Plus que ${quickView.stock} en stock` : 'En stock'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Rupture de stock
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-auto pt-4 border-t border-gray-50">
                  <button
                    onClick={() => {
                      handleAddToCart(quickView);
                      setQuickView(null);
                    }}
                    disabled={quickView.stock <= 0}
                    className={cn(
                      'w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-full transition-all duration-300 active:scale-[0.98]',
                      quickView.stock > 0
                        ? 'bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/15'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Ajouter au panier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
