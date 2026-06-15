'use client';

import Image from 'next/image';
import { Business } from '@/types/business';
import { MapPin, Star, ShieldCheck, Crown, Zap, Award, BadgeCheck, TrendingUp } from 'lucide-react';
import { getBusinessTypeLabel } from '@/utils/helpers';

interface BannerProps {
  business: Business;
}

export function Banner({ business }: BannerProps) {
  const badges: { label: string; icon: React.ReactNode; className: string }[] = [];

  if (business.isVerified) {
    badges.push({ label: 'Vérifié', icon: <ShieldCheck className="w-3 h-3" />, className: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' });
  }
  if (business.isPremium) {
    badges.push({ label: 'Premium', icon: <Crown className="w-3 h-3" />, className: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300' });
  }
  if (business.isNew) {
    badges.push({ label: 'Nouveau', icon: <Zap className="w-3 h-3" />, className: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' });
  }
  if (business.isTopSeller) {
    badges.push({ label: 'Top vendeur', icon: <TrendingUp className="w-3 h-3" />, className: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' });
  }
  if (business.isTopProvider) {
    badges.push({ label: 'Top prestataire', icon: <Award className="w-3 h-3" />, className: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' });
  }
  if (business.isRecommended) {
    badges.push({ label: 'Recommandé', icon: <BadgeCheck className="w-3 h-3" />, className: 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300' });
  }

  return (
    <div className="relative">
      <div className="h-48 sm:h-64 lg:h-80 w-full bg-gradient-to-br from-brand-600 to-brand-900 relative overflow-hidden">
        {business.coverImage && (
          <Image
            src={business.coverImage}
            alt={business.name}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20 sm:-mt-24 flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 pb-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-lg overflow-hidden flex-shrink-0">
            {business.logo ? (
              <Image src={business.logo} alt={business.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 text-2xl sm:text-3xl font-bold">
                {business.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-2 sm:pt-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-brand-700 dark:text-brand-300">
                {getBusinessTypeLabel(business.type)}
              </span>
              {badges.map((badge, i) => (
                <span key={i} className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.icon} {badge.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-sm">
                {business.name}
              </h1>
              <span className="flex items-center gap-1 text-sm text-white/90">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {business.rating.toFixed(1)}
                <span className="text-white/70">({business.reviewCount} avis)</span>
              </span>
            </div>
            {(business.shortDescription || business.city) && (
              <p className="mt-1 text-sm sm:text-base text-white/80 flex items-center gap-1">
                {business.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {business.city}
                    {business.country && `, ${business.country}`}
                  </span>
                )}
                {business.shortDescription && !business.city && business.shortDescription}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
