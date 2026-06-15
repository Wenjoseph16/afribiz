'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, MapPin, ShoppingBag, Zap, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

interface FlashOfferCardProps {
  offer: any;
  onClaim?: (id: string) => void;
  isClaiming?: boolean;
  claimed?: boolean;
  compact?: boolean;
}

function CountdownTimer({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft('Expiré');
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <Clock className="w-3 h-3" />
      <span className={cn(timeLeft === 'Expiré' && 'text-red-400')}>{timeLeft}</span>
    </div>
  );
}

export function FlashOfferCard({ offer, onClaim, isClaiming, claimed, compact }: FlashOfferCardProps) {
  if (!offer) return null;

  const progress = offer.quantity > 0 ? Math.round((offer.soldCount / offer.quantity) * 100) : 0;
  const remaining = offer.quantity - offer.soldCount;
  const isExpired = new Date(offer.endAt).getTime() <= Date.now();
  const isSoldOut = remaining <= 0;

  if (compact) {
    return (
      <Link href={'/dashboard/offers?id=' + offer.id} className="group block">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transition-all">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex-shrink-0 relative">
            {offer.image ? (
              <Image src={offer.image} alt={offer.title} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-brand-400" />
              </div>
            )}
            <div className="absolute top-0 left-0 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-br-md">
              -{offer.discountPercent}%
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{offer.title}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <CountdownTimer endAt={offer.endAt} />
              <span className="text-[10px] text-gray-400">{remaining}/{offer.quantity} restants</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            {offer.flashPrice && (
              <p className="text-sm font-bold text-brand-600 dark:text-brand-400">
                {offer.flashPrice.toLocaleString()} FCFA
              </p>
            )}
            {offer.originalPrice && (
              <p className="text-[10px] text-gray-400 line-through">{offer.originalPrice.toLocaleString()} FCFA</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Card padding="none" variant="elevated" className={cn(
      'group overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5',
      (isExpired || isSoldOut) && 'opacity-50',
      !isExpired && !isSoldOut && 'ring-1 ring-brand-500/10 hover:ring-brand-500/30'
    )}>
      {/* Image avec effet d'urgence */}
      <div className={cn(
        'aspect-[16/9] relative bg-gray-100 dark:bg-gray-900 overflow-hidden',
        !isExpired && !isSoldOut && progress < 80 && 'animate-pulse-soft'
      )}>
        {offer.image ? (
          <Image src={offer.image} alt={offer.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500/10 via-brand-500/10 to-purple-500/10">
            <Zap className="w-12 h-12 text-brand-400/50" />
          </div>
        )}

        {/* Glow overlay */}
        {!isExpired && !isSoldOut && (
          <div className="absolute inset-0 bg-gradient-to-t from-brand-500/5 via-transparent to-transparent" />
        )}

        {/* Overlay badges — verre */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 backdrop-blur-md border border-red-400/30 shadow-lg shadow-red-500/10">
            <Zap className="w-3 h-3 text-red-300" />
            <span className="text-red-300 text-xs font-bold">-{offer.discountPercent}%</span>
          </div>
          {offer.isFeatured && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500/20 backdrop-blur-md border border-brand-400/30">
              <span className="text-brand-300 text-xs font-medium">À la une</span>
            </div>
          )}
        </div>

        {/* Timer — glow */}
        <div className="absolute top-3 right-3">
          <div className="px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs shadow-lg">
            <CountdownTimer endAt={offer.endAt} />
          </div>
        </div>

        {/* Progress bar — animated gradient */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-1.5 bg-black/30 backdrop-blur-sm">
            <div
              className={cn(
                'h-full transition-all duration-1000 ease-out',
                progress >= 80 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                progress >= 50 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                'bg-gradient-to-r from-brand-500 to-brand-400'
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content — glass finish */}
      <div className="p-4 bg-gradient-to-b from-transparent to-white/50 dark:to-gray-800/50">
        {/* Business info */}
        {offer.business && (
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 ring-2 ring-white/50 dark:ring-gray-600/50">
              {offer.business.logo ? (
                <Image src={offer.business.logo} alt="" width={24} height={24} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500">
                  {offer.business.name?.charAt(0)}
                </div>
              )}
            </div>
            <Link href={'/business/' + offer.business.slug} className="text-xs text-gray-500 dark:text-gray-400 hover:text-brand-500 font-medium truncate transition-colors">
              {offer.business.name}
            </Link>
            {offer.business.city && (
              <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-auto">
                <MapPin className="w-2.5 h-2.5" />
                {offer.business.city}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {offer.title}
        </h3>
        {offer.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{offer.description}</p>
        )}

        {/* Pricing — highlight flash price */}
        <div className="flex items-end gap-2 mt-3">
          {offer.flashPrice && (
            <p className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-400 dark:to-brand-300 bg-clip-text text-transparent">
              {offer.flashPrice.toLocaleString()} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">FCFA</span>
            </p>
          )}
          {offer.originalPrice && (
            <p className="text-sm text-gray-400 line-through mb-0.5">
              {offer.originalPrice.toLocaleString()} FCFA
            </p>
          )}
        </div>

        {/* Availability — avec warning si stock bas */}
        <div className="flex items-center justify-between mt-3">
          <div className={cn(
            'flex items-center gap-1 text-xs',
            remaining <= 5 && !isSoldOut ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'
          )}>
            <ShoppingBag className="w-3 h-3" />
            <span>{remaining} / {offer.quantity} restants</span>
            {remaining <= 5 && !isSoldOut && (
              <span className="ml-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-medium animate-pulse-soft">
                Dépêchez-vous !
              </span>
            )}
          </div>
          {offer.maxPerCustomer && (
            <div className="text-[10px] text-gray-400">
              Max {offer.maxPerCustomer} / client
            </div>
          )}
        </div>

        {/* Claim button — avec gradient */}
        <button
          onClick={() => onClaim?.(offer.id)}
          disabled={isExpired || isSoldOut || isClaiming || claimed}
          className={cn(
            'w-full mt-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200',
            claimed
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/20'
              : isExpired || isSoldOut
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 active:scale-[0.97] shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30'
          )}
        >
          {isClaiming ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </span>
          ) : claimed ? (
            <span className="flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              Offre récupérée !
            </span>
          ) : isExpired ? (
            'Offre expirée'
          ) : isSoldOut ? (
            'Épuisé'
          ) : (
            <span className="flex items-center justify-center gap-1.5">
              <Zap className="w-4 h-4" />
              Je profite de l'offre
            </span>
          )}
        </button>

        {/* Terms */}
        {offer.terms && (
          <p className="text-[10px] text-gray-400 mt-2 text-center">{offer.terms}</p>
        )}
      </div>
    </Card>
  );
}
