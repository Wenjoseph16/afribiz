'use client';

import Image from 'next/image';
import { Business } from '@/types/business';
import { MapPin, Star, ShieldCheck, Crown, Zap, Award, BadgeCheck, TrendingUp } from 'lucide-react';
import { getBusinessTypeLabel } from '@/utils/helpers';
import { LiveVisitorCounter } from './LiveVisitorCounter';

interface BannerProps {
  business: Business;
  slug?: string;
}

export function Banner({ business, slug }: BannerProps) {
  const badges: { label: string; icon: React.ReactNode; className: string }[] = [];

  if (business.isVerified) {
    badges.push({
      label: 'Vérifié',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      className: 'bg-blue-500/20 backdrop-blur-sm text-blue-100 border border-blue-400/30',
    });
  }
  const vl = (business as any).verificationLevel;
  if (vl && vl !== 'ARGENT') {
    const levelLabel = vl === 'OR' ? 'Or' : vl === 'PLATINE' ? 'Platine' : vl;
    badges.push({
      label: levelLabel,
      icon: <Crown className="w-3.5 h-3.5" />,
      className: 'bg-amber-500/20 backdrop-blur-sm text-amber-100 border border-amber-400/30',
    });
  }
  if (business.isPremium) {
    badges.push({
      label: 'Premium',
      icon: <Crown className="w-3.5 h-3.5" />,
      className: 'bg-amber-500/20 backdrop-blur-sm text-amber-100 border border-amber-400/30',
    });
  }
  if (business.isNew) {
    badges.push({
      label: 'Nouveau',
      icon: <Zap className="w-3.5 h-3.5" />,
      className: 'bg-emerald-500/20 backdrop-blur-sm text-emerald-100 border border-emerald-400/30',
    });
  }
  if (business.isTopSeller) {
    badges.push({
      label: 'Top vendeur',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      className: 'bg-purple-500/20 backdrop-blur-sm text-purple-100 border border-purple-400/30',
    });
  }
  if (business.isTopProvider) {
    badges.push({
      label: 'Top prestataire',
      icon: <Award className="w-3.5 h-3.5" />,
      className: 'bg-indigo-500/20 backdrop-blur-sm text-indigo-100 border border-indigo-400/30',
    });
  }
  if (business.isRecommended) {
    badges.push({
      label: 'Recommandé',
      icon: <BadgeCheck className="w-3.5 h-3.5" />,
      className: 'bg-teal-500/20 backdrop-blur-sm text-teal-100 border border-teal-400/30',
    });
  }

  return (
    <div className="relative">
      {/* Cover Image with cinematic overlay */}
      <div className="relative h-56 sm:h-72 lg:h-96 w-full overflow-hidden">
        {business.coverImage ? (
          <Image
            src={business.coverImage}
            alt={`Couverture ${business.name}`}
            fill
            sizes="100vw"
            priority
            className="object-cover scale-105 animate-[KenBurn_20s_ease-in-out_infinite_alternate]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900" />
        )}
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-24 sm:-mt-28 lg:-mt-32 flex flex-col sm:flex-row items-end sm:items-end gap-4 sm:gap-8 pb-8">
          {/* Logo — Double-Bezel */}
          <div className="relative shrink-0">
            {/* Outer shell */}
            <div className="p-1 rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              {/* Inner core */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-xl overflow-hidden bg-white shadow-2xl">
                {business.logo ? (
                  <Image
                    src={business.logo}
                    alt={`Logo ${business.name}`}
                    fill
                    sizes="(max-width: 640px) 96px, 128px"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl lg:text-4xl font-bold">
                    {business.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pb-1">
            {/* Type badge */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-sm text-white/90 border border-white/10">
                {getBusinessTypeLabel(business.type)}
              </span>
              {badges.slice(0, 3).map((badge, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${badge.className}`}
                >
                  {badge.icon} {badge.label}
                </span>
              ))}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-2">
              {business.name}
            </h1>

            {/* Rating + Location */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-white">{business.rating.toFixed(1)}</span>
                <span className="text-white/60">({business.reviewCount} avis)</span>
              </span>
              {business.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {business.city}{business.country ? `, ${business.country}` : ''}
                </span>
              )}
              {business.shortDescription && (
                <span className="hidden sm:inline text-white/60">·</span>
              )}
              {business.shortDescription && (
                <span className="hidden sm:inline text-white/70">{business.shortDescription}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live counter */}
      {slug && (
        <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8">
          <LiveVisitorCounter slug={slug} variant="banner" />
        </div>
      )}
    </div>
  );
}
