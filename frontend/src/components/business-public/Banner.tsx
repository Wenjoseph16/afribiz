'use client';

import Image from 'next/image';
import { Business } from '@/types/business';
import { MapPin, Star, ShieldCheck, Crown, Zap, Award, BadgeCheck, TrendingUp } from 'lucide-react';
import { getBusinessTypeLabel } from '@/utils/helpers';
import { VERIFICATION_LEVEL_LABELS } from '@afribiz/shared';
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
      className: 'bg-blue-400/15 backdrop-blur-md text-blue-200 ring-1 ring-blue-300/30',
    });
  }
  const vl = business.verificationLevel;
  if (vl && vl !== 'ARGENT') {
    badges.push({
      label: VERIFICATION_LEVEL_LABELS[vl],
      icon: <Crown className="w-3.5 h-3.5" />,
      className: 'bg-amber-400/15 backdrop-blur-md text-amber-200 ring-1 ring-amber-300/30',
    });
  }
  if (business.isPremium && (!vl || vl === 'ARGENT')) {
    badges.push({
      label: 'Premium',
      icon: <Crown className="w-3.5 h-3.5" />,
      className: 'bg-amber-400/15 backdrop-blur-md text-amber-200 ring-1 ring-amber-300/30',
    });
  }
  if (business.isNew) {
    badges.push({
      label: 'Nouveau',
      icon: <Zap className="w-3.5 h-3.5" />,
      className: 'bg-emerald-400/15 backdrop-blur-md text-emerald-200 ring-1 ring-emerald-300/30',
    });
  }
  if (business.isTopSeller) {
    badges.push({
      label: 'Top vendeur',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      className: 'bg-purple-400/15 backdrop-blur-md text-purple-200 ring-1 ring-purple-300/30',
    });
  }
  if (business.isTopProvider) {
    badges.push({
      label: 'Top prestataire',
      icon: <Award className="w-3.5 h-3.5" />,
      className: 'bg-indigo-400/15 backdrop-blur-md text-indigo-200 ring-1 ring-indigo-300/30',
    });
  }
  if (business.isRecommended) {
    badges.push({
      label: 'Recommandé',
      icon: <BadgeCheck className="w-3.5 h-3.5" />,
      className: 'bg-teal-400/15 backdrop-blur-md text-teal-200 ring-1 ring-teal-300/30',
    });
  }

  return (
    <div className="relative group">
      {/* ─── Cover ─── */}
      <div className="relative h-64 sm:h-80 lg:h-[430px] w-full overflow-hidden">
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
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
            <div className="absolute -top-32 -right-20 w-[520px] h-[520px] rounded-full bg-brand-500/25 blur-3xl" />
            <div className="absolute -bottom-44 -left-24 w-[460px] h-[460px] rounded-full bg-teal-400/10 blur-3xl" />
          </>
        )}

        {/* Scrims cinéma */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-transparent" />

        {/* Fondu vers le fond de page */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/95 dark:from-gray-900/95 to-transparent" />
      </div>

      {/* ─── Contenu superposé ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-28 sm:-mt-32 lg:-mt-40 flex flex-col sm:flex-row items-start sm:items-end gap-5 sm:gap-8 pb-10">
          {/* Logo — double liseré + badge vérifié */}
          <div className="relative shrink-0">
            <div
              className="p-1.5 rounded-[1.4rem] bg-white/10 backdrop-blur-md ring-1 ring-white/25 shadow-2xl transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.02]"
            >
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-2xl overflow-hidden bg-white ring-4 ring-black/5">
                {business.logo ? (
                  <Image
                    src={business.logo}
                    alt={`Logo ${business.name}`}
                    fill
                    sizes="(max-width: 640px) 96px, 144px"
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 text-white text-4xl lg:text-5xl font-bold tracking-tight">
                    {business.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            {business.isVerified && (
              <span className="absolute -bottom-2.5 -right-2.5 w-9 h-9 rounded-full bg-blue-500 ring-4 ring-white dark:ring-gray-900 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <ShieldCheck className="w-4.5 h-4.5" />
              </span>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            {/* Pills : type + badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.15em] bg-white/12 backdrop-blur-md text-white ring-1 ring-white/20">
                {getBusinessTypeLabel(business.type)}
              </span>
              {badges.slice(0, 3).map((badge, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium backdrop-blur-md ${badge.className}`}
                >
                  {badge.icon} {badge.label}
                </span>
              ))}
            </div>

            {/* Nom XXL */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-3 [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
              {business.name}
            </h1>

            {/* Description courte */}
            {business.shortDescription && (
              <p className="hidden sm:block max-w-xl text-sm text-white/70 leading-relaxed mb-4 line-clamp-2">
                {business.shortDescription}
              </p>
            )}

            {/* Métadonnées : note + ville */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/15 text-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-white">{business.rating.toFixed(1)}</span>
                <span className="text-white/60">({business.reviewCount} avis)</span>
              </span>
              {(business.city || business.country) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/15 text-sm text-white/85">
                  <MapPin className="w-3.5 h-3.5 text-white/60" />
                  {business.city}
                  {business.city && business.country ? ', ' : ''}
                  {business.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compteur live */}
      {slug && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <LiveVisitorCounter slug={slug} variant="banner" />
        </div>
      )}
    </div>
  );
}
