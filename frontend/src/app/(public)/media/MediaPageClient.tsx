'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Play, Users, Clock, MapPin, ShoppingBag, ChevronRight,
  TrendingUp, Zap, Calendar, Star, Eye, Heart, MessageCircle,
  Share2, Sparkles, Flame, Tag, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StoryRing } from '@/components/stories/StoryRing';
import { ShortsFeedDynamic as ShortsFeed } from '@/components/stories/ShortsFeedDynamic';
import { useActiveStories, type StoryGroup } from '@/hooks/features/useStories';
import { useShorts } from '@/hooks/features/useShorts';
import { useActiveLives } from '@/hooks/features/useLives';
import { useActiveOffers } from '@/hooks/features/useOffers';

const FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'stories', label: 'Stories' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'lives', label: 'Lives' },
  { id: 'offers', label: 'Offres Flash' },
  { id: 'nearby', label: 'À proximité' },
];

function LiveCard({ live }: { live: any }) {
  return (
    <Link
      href={`/live/${live.id}`}
      className="group flex-shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {live.coverImage ? (
          <Image src={live.coverImage} alt={live.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/20 to-red-600/20">
            <Play className="w-12 h-12 text-red-500/40" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="px-2.5 py-1 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
            <span className="w-2 h-2 bg-white rounded-full" />
            EN DIRECT
          </span>
          {live.hasEscrow && (
            <span className="px-2 py-1 bg-emerald-600/90 text-white text-[10px] font-medium rounded-full backdrop-blur-sm">
              Escrow
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs">
          <Eye className="w-3 h-3" />
          {live.viewerCount || 0}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8">
          <p className="text-white text-sm font-medium truncate">{live.title}</p>
        </div>
      </div>
      <div className="p-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">
            {live.business?.name?.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{live.business?.name}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            <span>{live._count?.participants || 0} spectateurs</span>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold rounded-lg hover:from-red-700 hover:to-red-600 transition-all shrink-0">
          Rejoindre
        </div>
      </div>
    </Link>
  );
}

function OfferCard({ offer }: { offer: any }) {
  const [claimed, setClaimed] = useState(false);
  const timeLeft = offer.endAt ? Math.max(0, Math.floor((new Date(offer.endAt).getTime() - Date.now()) / 1000)) : 0;
  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const stockPercent = offer.quantity ? Math.min(100, Math.round((offer.soldCount / offer.quantity) * 100)) : 0;

  return (
    <div className="group flex-shrink-0 w-56 sm:w-64 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {offer.image ? (
          <Image src={offer.image} alt={offer.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-red-500/20">
            <Zap className="w-10 h-10 text-amber-500/40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-bold rounded-lg shadow-lg">
            -{offer.discountPercent || 0}%
          </span>
        </div>
        {offer.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> À la une
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
          <p className="text-white text-sm font-semibold">{offer.flashPrice?.toLocaleString()} F</p>
          {offer.originalPrice && (
            <p className="text-white/60 text-xs line-through">{offer.originalPrice.toLocaleString()} F</p>
          )}
        </div>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{offer.title}</p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3 h-3 text-red-500" />
          <span className="text-red-500 font-medium">{hours}h {mins}m</span>
          <span className="text-gray-300">|</span>
          <Users className="w-3 h-3" />
          <span>{offer.soldCount || 0} vendus</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              stockPercent > 80 ? 'bg-red-500' : stockPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            )}
            style={{ width: `${stockPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-400">
          {offer.quantity && offer.quantity - (offer.soldCount || 0)} restants
        </p>
        <button
          onClick={() => setClaimed(true)}
          disabled={claimed}
          className={cn(
            'w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200',
            claimed
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-gradient-to-r from-brand-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-brand-500/20 active:scale-95'
          )}
        >
          {claimed ? '✅ Offre obtenue !' : 'Je profite de l\'offre'}
        </button>
      </div>
    </div>
  );
}

function ShortCard({ short }: { short: any }) {
  return (
    <Link
      href={`/shorts/${short.id}`}
      className="group flex-shrink-0 w-40 sm:w-48 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {short.thumbnailUrl ? (
          <Image src={short.thumbnailUrl} alt={short.title || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-500/20 to-purple-500/20">
            <Play className="w-10 h-10 text-brand-500/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          {short.title && (
            <p className="text-white text-xs font-medium truncate">{short.title}</p>
          )}
          <div className="flex items-center gap-2 text-[10px] text-white/70 mt-1">
            <Eye className="w-3 h-3" />
            <span>{short.viewsCount || 0}</span>
            <Heart className="w-3 h-3" />
            <span>{short.likesCount || 0}</span>
          </div>
        </div>
        <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full">
          <Play className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="p-2.5 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-bold text-white">{short.business?.name?.charAt(0) || '?'}</span>
        </div>
        <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 truncate">{short.business?.name}</p>
      </div>
    </Link>
  );
}

function BusinessCard({ business }: { business: any }) {
  return (
    <Link
      href={`/business/${business.slug}`}
      className="group flex-shrink-0 w-36 sm:w-44 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 text-center"
    >
      <div className="p-4 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center overflow-hidden ring-2 ring-brand-500/20 group-hover:ring-brand-500/40 transition-all">
          {business.logo ? (
            <Image src={business.logo} alt={business.name} width={64} height={64} className="object-cover w-full h-full" />
          ) : (
            <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
              {business.name?.charAt(0)}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-full">{business.name}</p>
        {business.type && (
          <p className="text-[11px] text-gray-400 truncate max-w-full">{business.type}</p>
        )}
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-xs text-gray-500">{business.rating || '—'}</span>
        </div>
      </div>
    </Link>
  );
}

export function MediaPageClient() {
  const [activeFilter, setActiveFilter] = useState('all');
  const { data: storyGroups } = useActiveStories();
  const { data: shortsData } = useShorts({ limit: 12 });
  const { data: livesData } = useActiveLives({ status: 'LIVE' });
  const { data: offersData } = useActiveOffers({ limit: 8 });

  const shorts = shortsData?.items || [];
  const lives = livesData?.items || [];
  const offers = offersData?.items || [];

  const businesses = storyGroups?.map((g: StoryGroup) => g.business).slice(0, 10) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Hero section */}
      <div className="text-center space-y-4 py-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-brand-500/10 to-emerald-500/10 dark:from-brand-500/20 dark:to-emerald-500/20 rounded-full text-brand-600 dark:text-brand-400 text-sm font-medium">
          <Play className="w-4 h-4" />
          Découvrez le commerce vidéo
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
          AfriBiz <span className="bg-gradient-to-r from-brand-500 to-emerald-500 bg-clip-text text-transparent">Media</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base">
          Stories, shorts, lives et offres flash. Découvrez des produits et services en vidéo,
          achetez et réservez directement depuis le contenu.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              activeFilter === f.id
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lives en cours */}
      {lives.length > 0 && (activeFilter === 'all' || activeFilter === 'lives') && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Lives en direct</h2>
              <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium rounded-full">
                {lives.length}
              </span>
            </div>
            <Link href="/lives" className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {lives.map((live: any) => (
              <LiveCard key={live.id} live={live} />
            ))}
          </div>
        </section>
      )}

      {/* Stories */}
      {(activeFilter === 'all' || activeFilter === 'stories') && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Stories</h2>
            </div>
            {storyGroups && storyGroups.length > 0 && (
              <span className="text-xs text-gray-400">{storyGroups.length} commerces</span>
            )}
          </div>
          <StoryRing />
        </section>
      )}

      {/* Shorts */}
      {(activeFilter === 'all' || activeFilter === 'shorts') && shorts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Shorts</h2>
            </div>
            <Link href="/shorts" className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {shorts.map((short: any) => (
              <ShortCard key={short.id} short={short} />
            ))}
          </div>
          {shorts.length > 0 && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="text-center mb-3">
                <span className="text-xs text-gray-400 font-medium">Lecture rapide</span>
              </div>
              <ShortsFeed />
            </div>
          )}
        </section>
      )}

      {/* Offres Flash */}
      {(activeFilter === 'all' || activeFilter === 'offers') && offers.length > 0 && (
        <section className="bg-gradient-to-r from-red-600/5 via-amber-500/5 to-orange-600/5 dark:from-red-600/10 dark:via-amber-500/10 dark:to-orange-600/10 rounded-3xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Offres Flash</h2>
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full">
                {offers.length} offres
              </span>
            </div>
            <Link href="/offers" className="text-sm text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
            {offers.map((offer: any) => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        </section>
      )}

      {/* Business populaires */}
      {(activeFilter === 'all' || activeFilter === 'nearby') && businesses.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-500" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Business populaires</h2>
            </div>
            <Link href="/marketplace" className="text-sm text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              Marketplace <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {businesses.map((b: any) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        </section>
      )}

      {/* Marché du Jour */}
      {activeFilter === 'all' && (
        <section className="bg-gradient-to-br from-brand-600 to-emerald-700 rounded-3xl p-6 sm:p-8 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg sm:text-xl font-bold">Marché du Jour</h2>
          </div>
          <p className="text-emerald-100 text-sm mb-6 max-w-xl">
            Les meilleures trouvailles du jour sélectionnées pour vous. Produits, services et offres à ne pas manquer.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Mode & Accessoires', 'Restauration', 'Beauté & Bien-être', 'Tech & Services'].map((cat, i) => (
              <Link
                key={cat}
                href={`/marketplace?category=${cat}`}
                className="p-4 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 transition-all text-center group"
              >
                <p className="text-sm font-medium">{cat}</p>
                <p className="text-[11px] text-emerald-200 mt-1">Découvrir →</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Nouveautés */}
      {activeFilter === 'all' && shorts.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Nouveautés</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {shorts.slice(0, 8).map((short: any) => (
              <ShortCard key={short.id} short={short} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!lives.length && !storyGroups?.length && !shorts.length && !offers.length && (
        <div className="text-center py-20">
          <Play className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Aucun contenu pour le moment
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            Les premiers contenus apparaîtront ici dès que les business publieront.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-all"
          >
            Découvrir le marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
