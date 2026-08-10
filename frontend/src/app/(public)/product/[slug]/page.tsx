'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ShoppingCart,
  MessageCircle,
  Store,
  Star,
  Shield,
  Truck,
  Clock,
  Package,
  Share2,
  Heart,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useAddToCart } from '@/features/hooks';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import StarRating from '@/components/marketplace/cards/StarRating';
import AdSlot from '@/components/ads/AdSlot';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const addToCart = useAddToCart();
  const addToLocalCart = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['marketplace-product', slug],
    queryFn: async () => {
      const res = await apiClient.getMarketplaceProduct(slug);
      return res.data.data;
    },
  });

  const handleAddToCart = async () => {
    if (!product) return;
    addToLocalCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.promotionalPrice || product.price,
      currency: product.currency || 'FCFA',
      quantity: qty,
      image: product.images?.[0],
      businessId: product.business?.id,
      businessName: product.business?.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    if (isAuthenticated()) {
      try {
        await addToCart.mutateAsync({
          productId: product.id,
          quantity: qty,
        } as any);
      } catch {
        /* handled */
      }
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl" />
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || product.shortDescription,
        image: product.images?.[0],
        offers: {
          '@type': 'Offer',
          price: product.promotionalPrice || product.price,
          priceCurrency: product.currency || 'XOF',
          availability:
            product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
        aggregateRating: product.rating
          ? {
              '@type': 'AggregateRating',
              ratingValue: product.rating,
              reviewCount: product.reviewCount || 0,
            }
          : undefined,
      }
    : null;

  if (error || !product)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Produit introuvable</h2>
          <p className="text-gray-500 mb-6">Ce produit n'existe pas ou a été retiré.</p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-brand font-medium hover:underline"
          >
            <ChevronLeft className="h-4 w-4" /> Retour au marketplace
          </Link>
        </main>
        <Footer />
      </div>
    );

  const images = product.images?.length > 0 ? product.images : ['/placeholder-product.svg'];
  const promo =
    product.promotionalPrice && product.promotionalPrice < product.price
      ? Math.round((1 - product.promotionalPrice / product.price) * 100)
      : 0;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/marketplace" className="hover:text-brand">
            Marketplace
          </Link>
          <span>/</span>
          {product.category && (
            <>
              <Link
                href={`/marketplace?category=${product.category.id}`}
                className="hover:text-brand"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              {promo > 0 && (
                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                  -{promo}%
                </span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${i === selectedImage ? 'border-brand' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <Image
                      src={img}
                      alt=""
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <StarRating rating={product.rating || 0} />
                <span className="text-sm text-gray-500">({product.reviewCount || 0} avis)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              {promo > 0 ? (
                <>
                  <span className="text-3xl font-bold text-brand">
                    {product.promotionalPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    {product.price.toLocaleString('fr-FR')} FCFA
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {product.price.toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span
                className={`flex items-center gap-1.5 ${inStock ? 'text-emerald-600' : 'text-red-500'}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-red-500'}`}
                />
                {inStock ? 'En stock' : 'Rupture de stock'}
              </span>
              {product.deliveryFee !== null && product.deliveryFee !== undefined && (
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Truck className="h-4 w-4" /> Livraison disponible
                </span>
              )}
            </div>

            {product.business && (
              <Link
                href={`/business/${product.business.slug}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  {product.business.logo ? (
                    <Image
                      src={product.business.logo}
                      alt=""
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  ) : (
                    <Store className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                    {product.business.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.business.city}
                    {product.business.country ? `, ${product.business.country}` : ''}
                  </p>
                </div>
                <ChevronLeft className="h-4 w-4 text-gray-300 rotate-180 shrink-0" />
              </Link>
            )}

            {product.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Description
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="px-3 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[3rem] text-center border-x border-gray-200 dark:border-gray-700">
                  {qty}
                </span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="px-3 py-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${added ? 'bg-emerald-600 text-white' : 'bg-brand text-white hover:bg-brand-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ShoppingCart className="h-4 w-4" />
                {added ? 'Ajouté !' : 'Ajouter au panier'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!inStock}
                className="flex-1 px-6 py-3 rounded-xl text-sm font-semibold bg-white dark:bg-gray-800 text-brand border-2 border-brand hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Acheter maintenant
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/dashboard/messages`)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> Contacter
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <Share2 className="h-4 w-4" /> Partager
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {product.deliveryFee !== null && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Truck className="h-4 w-4 text-brand" /> Livraison disponible
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4 text-brand" /> Retour sous 14 jours
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4 text-brand" /> Paiement sécurisé
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Package className="h-4 w-4 text-brand" /> Produit original
              </div>
            </div>

            {product.reviews?.length > 0 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Avis récents
                </h3>
                <div className="space-y-3">
                  {product.reviews.slice(0, 3).map((review: any) => (
                    <div key={review.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">
                        {review.user?.firstName?.[0] || '?'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {review.user?.firstName} {review.user?.lastName}
                          </p>
                          <StarRating rating={review.rating} />
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-500 mt-0.5">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* Produits sponsorisés */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <AdSlot page="PRODUCT_PAGE" position="BOTTOM_BANNER" />
      </div>
      <Footer />
    </div>
  );
}
