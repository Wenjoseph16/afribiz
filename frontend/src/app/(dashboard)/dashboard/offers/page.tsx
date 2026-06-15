'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Zap, MapPin, Navigation, Clock, ShoppingBag, Percent,
  Sparkles, Filter, SlidersHorizontal, ChevronRight,
  Star, Users, Store, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FlashOfferCard } from '@/components/offers/FlashOfferCard';
import {
  useActiveOffers,
  useClaimOffer,
  useNearbyBusinesses,
} from '@/hooks/features/useOffers';

export default function OffresPage() {
  const [view, setView] = useState<'offers' | 'nearby'>('offers');
  const [radius, setRadius] = useState(10);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const { data: offersData, isLoading: offersLoading } = useActiveOffers({
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
    radiusKm: view === 'nearby' ? radius : undefined,
    limit: 20,
  });

  const { data: nearbyData, isLoading: nearbyLoading } = useNearbyBusinesses({
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
    radiusKm: radius,
    limit: 20,
  });

  const claimOffer = useClaimOffer();
  const [claimedIds, setClaimedIds] = useState<Set<string>>(new Set());

  const offers = offersData?.items || [];
  const nearbyBusinesses = nearbyData?.items || [];
  const [claimedOfferId, setClaimedOfferId] = useState<string | null>(null);

  const handleClaim = (id: string) => {
    setClaimedOfferId(id);
    claimOffer.mutate(id, {
      onSuccess: () => {
        setClaimedIds(prev => new Set(prev).add(id));
        setClaimedOfferId(null);
      },
      onError: () => setClaimedOfferId(null),
    });
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Géolocalisation non supportée');
      return;
    }
    setLocationLoading(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      (err) => {
        setLocationError('Impossible de vous localiser');
        setLocationLoading(false);
        // Default to Abidjan
        setUserLocation({ lat: 5.36, lng: -4.01 });
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

  // Updates
  const activeOffers = offers.filter(o => new Date(o.endAt).getTime() > Date.now());
  const featuredOffers = offers.filter(o => o.isFeatured);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Offres Flash
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Promotions limitées près de chez vous
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('offers')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              view === 'offers'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            )}
          >
            <Zap className="w-4 h-4 inline mr-1" />
            Offres
          </button>
          <button
            onClick={() => setView('nearby')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all',
              view === 'nearby'
                ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            )}
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            Autour de moi
          </button>
        </div>
      </div>

      {/* Location bar */}
      {locationLoading && (
        <div className="flex items-center gap-2 text-sm text-brand-600 dark:text-brand-400">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Localisation en cours...
        </div>
      )}
      {locationError && (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <MapPin className="w-4 h-4" />
          {locationError}
          <button onClick={getLocation} className="text-brand-500 hover:underline ml-1">Réessayer</button>
        </div>
      )}
      {userLocation && (
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <MapPin className="w-3 h-3 text-brand-500" />
          Localisé · {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          <span className="mx-1">·</span>
          <button onClick={getLocation} className="text-brand-500 hover:underline flex items-center gap-0.5">
            <RefreshCw className="w-3 h-3" /> Rafraîchir
          </button>
        </div>
      )}

      {view === 'offers' ? (
        /* OFFERS VIEW */
        <>
          {/* Featured offers carousel */}
          {featuredOffers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-500" />
                Offres à la une
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredOffers.slice(0, 3).map((offer: any) => (
                  <FlashOfferCard
                    key={offer.id}
                    offer={offer}
                    onClaim={handleClaim}
                    isClaiming={claimedOfferId === offer.id}
                    claimed={claimedIds.has(offer.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All active offers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-brand-500" />
                Toutes les offres
                {activeOffers.length > 0 && (
                  <Badge variant="brand" size="sm">{activeOffers.length} actives</Badge>
                )}
              </h2>
            </div>

            {offersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                    <div className="aspect-[16/9] bg-gray-200 dark:bg-gray-700" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : offers.length === 0 ? (
              <Card className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Zap className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">Aucune offre flash en ce moment</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md">
                    Les commerces à proximité publient ici leurs offres à durée limitée. Activez votre position pour voir celles près de chez vous.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.map((offer: any) => (
                  <FlashOfferCard
                    key={offer.id}
                    offer={offer}
                    onClaim={handleClaim}
                    isClaiming={claimedOfferId === offer.id}
                    claimed={claimedIds.has(offer.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Compact offers list */}
          {offers.length > 6 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-brand-500" />
                Plus d'offres
              </h2>
              <div className="space-y-2">
                {offers.slice(6).map((offer: any) => (
                  <FlashOfferCard
                    key={offer.id}
                    offer={offer}
                    onClaim={handleClaim}
                    isClaiming={claimedOfferId === offer.id}
                    claimed={claimedIds.has(offer.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* NEARBY VIEW */
        <>
          {/* Radius selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">Rayon :</span>
            {[5, 10, 25, 50].map((km) => (
              <button
                key={km}
                onClick={() => setRadius(km)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  radius === km
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                )}
              >
                {km} km
              </button>
            ))}
          </div>

          {/* Nearby businesses */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
              <Store className="w-4 h-4 text-brand-500" />
              Commerces à proximité
              {nearbyBusinesses.length > 0 && (
                <Badge variant="brand" size="sm">{nearbyBusinesses.length}</Badge>
              )}
            </h2>

            {nearbyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ))}
              </div>
            ) : nearbyBusinesses.length === 0 ? (
              <Card className="text-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <Navigation className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun commerce trouvé dans ce rayon</p>
                  <button onClick={() => setRadius(prev => Math.min(prev * 2, 100))} className="text-brand-500 text-sm hover:underline">
                    Élargir le rayon à {Math.min(radius * 2, 100)} km
                  </button>
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {nearbyBusinesses.map((biz: any) => (
                  <Link
                    key={biz.id}
                    href={'/business/' + biz.slug}
                    className="block p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                        {biz.logo ? (
                          <Image src={biz.logo} alt={biz.name} width={48} height={48} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                            {biz.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate group-hover:text-brand-600 transition-colors">
                            {biz.name}
                          </h3>
                          {biz.rating > 0 && (
                            <div className="flex items-center gap-0.5 text-xs text-amber-500">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{biz.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        {biz.shortDescription && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{biz.shortDescription}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {biz.city || 'À proximité'}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Navigation className="w-3 h-3" />
                            {biz.distance < 1
                              ? `${(biz.distance * 1000).toFixed(0)} m`
                              : `${biz.distance.toFixed(1)} km`}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3" />
                            {biz.reviewCount} avis
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-brand-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Nearby offers */}
          {offers.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-brand-500" />
                Offres à proximité
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {offers.slice(0, 6).map((offer: any) => (
                  <FlashOfferCard
                    key={offer.id}
                    offer={offer}
                    onClaim={handleClaim}
                    isClaiming={claimedOfferId === offer.id}
                    claimed={claimedIds.has(offer.id)}
                    compact
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
