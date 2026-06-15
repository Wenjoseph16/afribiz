'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  X, ShoppingCart, MessageCircle, Store, Star, Clock, Truck,
  Shield, Heart, Tag,
  Percent, Zap, Gift, Package, TrendingUp, ChevronDown, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useAddToCart } from '@/features/hooks';
import type { ProductResult } from '@/components/marketplace/cards/types';

interface ProductDetailModalProps {
  product: ProductResult;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const addToCart = useAddToCart();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showPromos, setShowPromos] = useState(false);

  const badge = (product.promoPrice && product.promoPrice < product.price)
    ? Math.round((1 - product.promoPrice / product.price) * 100) : 0;

  const savings = badge > 0 ? product.price - (product.promoPrice || 0) : 0;

  const promos = [
    badge > 0 ? { label: `-${badge}% sur ce produit`, desc: `Économisez ${savings.toLocaleString()} FCFA`, icon: Percent } : null,
    { label: 'Livraison offerte', desc: 'Pour toute commande de 50 000 FCFA', icon: Truck },
    { label: 'Garantie satisfait', desc: 'Remboursement sous 14 jours', icon: Shield },
    { label: 'Programme fidélité', desc: 'Gagnez des points sur chaque achat', icon: Gift },
    { label: 'Achat en gros', desc: '-15% dès 10 unités achetées', icon: Package },
  ].filter(Boolean);

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      await addToCart.mutateAsync({
        productId: product.id,
        name: product.name,
        quantity,
        unitPrice: product.promoPrice || product.price,
        image: product.image,
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (e) {
      console.error('Error adding to cart:', e);
    }
  };

  const handleContactBusiness = () => {
    if (!isAuthenticated()) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    router.push(`/dashboard/messages?businessId=${product.businessId}&businessName=${encodeURIComponent(product.businessName)}`);
  };

  const handleVisitStore = () => {
    router.push(`/business/${product.businessSlug}`);
  };

  const handleOrderNow = async () => {
    await handleAddToCart();
    router.push('/dashboard/cart');
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-y-auto animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* LEFT: Image */}
          <div className="relative bg-gray-50 dark:bg-gray-800/50">
            <div className="aspect-square md:aspect-[4/5] relative overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-gray-300 dark:text-gray-600" />
                </div>
              )}
              {badge > 0 && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-lg">
                  <Percent className="w-4 h-4" />
                  -{badge}%
                </div>
              )}
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-gray-500 hover:text-red-500 transition-all hover:scale-105">
                <Heart className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <button onClick={handleVisitStore} className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group border border-gray-200 dark:border-gray-700">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-emerald-400 flex items-center justify-center text-white font-bold text-sm">
                  {product.businessName?.[0] || '?'}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand transition-colors">{product.businessName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{product.city}{product.country ? `, ${product.country}` : ''}</p>
                </div>
                <Store className="w-5 h-5 text-gray-400 group-hover:text-brand transition-colors" />
              </button>
            </div>
          </div>

          {/* RIGHT: Details */}
          <div className="p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium',
                product.available ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400')}>
                {product.available ? <><Check className="w-3 h-3" /> En stock</> : 'Rupture de stock'}
              </span>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{product.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">({product.reviewCount} avis)</span>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{product.name}</h2>
            {product.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">{product.description}</p>}

            <div className="flex items-baseline gap-3 mb-6">
              {badge > 0 ? (
                <>
                  <span className="text-3xl font-bold text-brand">{product.promoPrice?.toLocaleString()} FCFA</span>
                  <span className="text-lg text-gray-400 dark:text-gray-500 line-through">{product.price.toLocaleString()} FCFA</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg">-{badge}%</span>
                </>
              ) : product.price > 0 ? (
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{product.price.toLocaleString()} FCFA</span>
              ) : (
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">Gratuit</span>
              )}
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantité</span>
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-lg">-</button>
                <span className="w-12 h-10 flex items-center justify-center text-sm font-semibold text-gray-900 dark:text-gray-100 border-x border-gray-200 dark:border-gray-700">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(99, q + 1))} className="w-10 h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium text-lg">+</button>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex gap-3">
                <button onClick={handleAddToCart} disabled={addToCart.isPending}
                  className={cn('flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
                    addedToCart ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700')}>
                  {addToCart.isPending ? <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> :
                    addedToCart ? <><Check className="w-5 h-5" /> Ajouté ✓</> : <><ShoppingCart className="w-5 h-5" /> Ajouter au panier</>}
                </button>
                <button onClick={handleOrderNow} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand to-emerald-400 text-white hover:shadow-lg hover:shadow-brand/20 transition-all duration-200">
                  <Zap className="w-5 h-5" /> Commander
                </button>
              </div>
              <button onClick={handleContactBusiness} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-brand border border-brand/20 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all duration-200">
                <MessageCircle className="w-4 h-4" /> Contacter {product.businessName}
              </button>
              <button onClick={handleVisitStore} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200">
                <Store className="w-4 h-4" /> Voir la boutique
              </button>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
              <button onClick={() => setShowPromos(!showPromos)} className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-brand" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Promotions et offres</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-brand-50 text-brand">{promos.length}</span>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform duration-200', showPromos && 'rotate-180')} />
              </button>
              {showPromos && (
                <div className="space-y-2 animate-fade-in">
                  {promos.map((promo: any, i: number) => {
                    const Icon = promo.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-brand-50/50 to-emerald-50/50 dark:from-brand-900/10 dark:to-emerald-900/10 border border-brand-100/50 dark:border-brand-900/30">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-brand flex-shrink-0 shadow-sm"><Icon className="w-4 h-4" /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{promo.label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{promo.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Truck className="w-4 h-4" /> Livraison disponible</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Clock className="w-4 h-4" /> Retour sous 14 jours</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><Shield className="w-4 h-4" /> Paiement sécurisé</div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><TrendingUp className="w-4 h-4" /> {product.reviewCount} acheteurs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
