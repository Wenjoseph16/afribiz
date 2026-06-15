'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, Shield, MapPin, Zap, Clock, ShoppingBag, Calendar, Truck, CreditCard, ChevronRight, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PremiumBusiness {
  id: string;
  type: 'business' | 'product' | 'service' | 'module';
  name: string;
  slug?: string;
  rating: number;
  reviewCount: number;
  image?: string;
  logo?: string;
  city?: string;
  country?: string;
  category?: string;
  description?: string;
  price?: number;
  badges?: string[];
  modules?: string[];
  afriScore?: number;
  isVerified?: boolean;
  isPremium?: boolean;
  isTopSeller?: boolean;
  fastResponse?: boolean;
}

const BADGE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  verified: { label: 'Vérifié', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Shield },
  premium: { label: 'Premium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Star },
  top_seller: { label: 'Top vendeur', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Zap },
  fast_response: { label: 'Réponse rapide', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
};

const MODULE_ICONS: Record<string, any> = {
  PRODUCTS: ShoppingBag, BOOKINGS: Calendar, ORDERS: ShoppingBag,
  DELIVERIES: Truck, PAYMENTS: CreditCard, SERVICES: Zap,
};

function formatPrice(p: number) {
  return `${(p || 0).toLocaleString('fr-FR')} FCFA`;
}

export default function PremiumBusinessCard({ item, view = 'grid' }: { item: PremiumBusiness; view?: 'grid' | 'list' }) {
  const href = item.type === 'module' ? `/marketplace/modules/${item.slug || item.id}` : `/marketplace/${item.slug || item.id}`;
  const imgSrc = item.image || item.logo || '';
  const initials = item.name?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() || '?';

  if (view === 'list') {
    return (
      <Link href={href} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/30 dark:hover:border-brand/30 hover:shadow-md transition-all duration-200 group">
        <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 shrink-0 overflow-hidden">
          {imgSrc ? (
            <Image src={imgSrc || ''} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400 dark:text-gray-500">{initials}</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand transition-colors truncate">{item.name}</h3>
            {item.isVerified && <Shield className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.rating?.toFixed(1)}</span>
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">({item.reviewCount || 0})</span>
            {item.city && (
              <>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <MapPin className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{item.city}</span>
              </>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{item.description}</p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-brand/30 dark:hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5 dark:hover:shadow-brand/5 transition-all duration-300"
    >
      {/* Cover image */}
      <div className="relative h-40 sm:h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
         {imgSrc ? (
          <Image src={imgSrc || ''} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{initials}</span>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {item.isVerified && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-500/90 backdrop-blur-sm rounded-md text-[10px] font-semibold text-white shadow-sm">
              <Shield className="h-3 w-3" /> Vérifié
            </span>
          )}
          {item.isPremium && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/90 backdrop-blur-sm rounded-md text-[10px] font-semibold text-white shadow-sm">
              <Star className="h-3 w-3" /> Premium
            </span>
          )}
          {item.isTopSeller && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/90 backdrop-blur-sm rounded-md text-[10px] font-semibold text-white shadow-sm">
              <Zap className="h-3 w-3" /> Top
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand transition-colors truncate">
              {item.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.rating?.toFixed(1)}</span>
              </div>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">({item.reviewCount || 0})</span>
              {item.city && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{item.city}</span>
                </>
              )}
            </div>
          </div>

          {/* AfriScore */}
          {item.afriScore && (
            <div className="shrink-0 text-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{item.afriScore}</span>
              </div>
              <span className="text-[9px] text-gray-400 dark:text-gray-500 mt-0.5 block">Score</span>
            </div>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">{item.description}</p>
        )}

        {/* Modules */}
        {item.modules && item.modules.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {item.modules.slice(0, 4).map((mod) => {
              const ModIcon = MODULE_ICONS[mod] || Zap;
              return (
                <span key={mod} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-gray-800 text-[10px] font-medium text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                  <ModIcon className="h-2.5 w-2.5" />
                  {mod.charAt(0) + mod.slice(1).toLowerCase()}
                </span>
              );
            })}
          </div>
        )}

        {/* Price + action */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            {item.price && item.price > 0 ? (
              <span className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.price)}</span>
            ) : (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Gratuit</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand/20"
            >
              Voir
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
