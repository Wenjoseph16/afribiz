'use client';

import { cn } from '@/lib/utils';
import {
  Shield,
  Zap,
  CreditCard,
  Clock,
  Award,
  Star,
  Diamond,
  ThumbsUp,
  Building2,
  Hotel,
  UtensilsCrossed,
  Trophy,
  Sparkles,
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BadgeData {
  badge: string;
  label: string;
  description: string | null;
  icon: string | null;
  earnedAt?: string;
}

const BADGE_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; darkBg: string }
> = {
  BUSINESS_VERIFIED: {
    icon: Shield,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    darkBg: 'dark:bg-emerald-900/20',
  },
  PAYMENT_VERIFIED: {
    icon: CreditCard,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    darkBg: 'dark:bg-blue-900/20',
  },
  TOP_SELLER: {
    icon: Trophy,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    darkBg: 'dark:bg-purple-900/20',
  },
  TOP_PROVIDER: {
    icon: Award,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    darkBg: 'dark:bg-purple-900/20',
  },
  TOP_RESTAURANT: {
    icon: UtensilsCrossed,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    darkBg: 'dark:bg-orange-900/20',
  },
  TOP_HOTEL: {
    icon: Hotel,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    darkBg: 'dark:bg-orange-900/20',
  },
  TOP_RENTER: {
    icon: Building2,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    darkBg: 'dark:bg-orange-900/20',
  },
  TOP_EVENT: {
    icon: Sparkles,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    darkBg: 'dark:bg-pink-900/20',
  },
  BUSINESS_PREMIUM: {
    icon: Diamond,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/20',
  },
  BUSINESS_RECOMMENDED: {
    icon: ThumbsUp,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    darkBg: 'dark:bg-blue-900/20',
  },
  BUSINESS_RELIABLE: {
    icon: Star,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    darkBg: 'dark:bg-teal-900/20',
  },
  BUSINESS_ELITE: {
    icon: Diamond,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    darkBg: 'dark:bg-indigo-900/20',
  },
  RESPONSE_TIME: {
    icon: Zap,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    darkBg: 'dark:bg-amber-900/20',
  },
  ESCROW_ACTIVE: {
    icon: Lock,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    darkBg: 'dark:bg-teal-900/20',
  },
};

const DEFAULT_CONFIG = {
  icon: Award,
  color: 'text-gray-600',
  bg: 'bg-gray-50',
  darkBg: 'dark:bg-gray-800',
};

interface TrustBadgesProps {
  badges: BadgeData[];
  afriScore?: {
    overallScore: number;
    category: string;
  } | null;
  satisfactionScore?: number | null;
  surveyAverage?: number | null;
  className?: string;
  variant?: 'compact' | 'full';
  onBadgeClick?: (badge: BadgeData) => void;
}

function SatisfactionBadge({ score }: { score: number }) {
  const pct = Math.min(Math.max(score / 200, 0), 1);
  const colors =
    pct >= 0.75
      ? { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' }
      : pct >= 0.5
        ? { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
        : { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
        colors.bg,
        colors.border
      )}
      title="Score de satisfaction (avis publics + enquêtes)"
    >
      <Star className={cn('w-4 h-4', colors.text)} />
      <span className={cn('text-sm font-bold', colors.text)}>{score}</span>
      <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">satisfaction</span>
    </div>
  );
}

function ScoreBadge({ score, category }: { score: number; category: string }) {
  const getScoreColor = (s: number) => {
    if (s >= 800)
      return {
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        darkBg: 'dark:bg-emerald-900/20',
        border: 'border-emerald-200',
      };
    if (s >= 600)
      return {
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        darkBg: 'dark:bg-blue-900/20',
        border: 'border-blue-200',
      };
    if (s >= 400)
      return {
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        darkBg: 'dark:bg-amber-900/20',
        border: 'border-amber-200',
      };
    if (s >= 200)
      return {
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        darkBg: 'dark:bg-orange-900/20',
        border: 'border-orange-200',
      };
    return {
      text: 'text-red-600',
      bg: 'bg-red-50',
      darkBg: 'dark:bg-red-900/20',
      border: 'border-red-200',
    };
  };
  const colors = getScoreColor(score);
  const labels: Record<string, string> = {
    EXCELLENT: 'Excellent',
    GOOD: 'Bon',
    MEDIUM: 'Moyen',
    LOW: 'Faible',
    VERY_LOW: 'Très faible',
  };
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-lg border',
        colors.bg,
        colors.border,
        colors.darkBg
      )}
    >
      <Shield className={cn('w-4 h-4', colors.text)} />
      <div className="flex items-baseline gap-1">
        <span className={cn('text-sm font-bold', colors.text)}>{score}</span>
        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
          {labels[category] || category}
        </span>
      </div>
    </div>
  );
}

export function BadgeChip({ badge, onClick }: { badge: BadgeData; onClick?: () => void }) {
  const config = BADGE_CONFIG[badge.badge] || DEFAULT_CONFIG;
  const Icon = config.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
        'border border-gray-200 dark:border-gray-700',
        'hover:shadow-sm hover:scale-105 active:scale-95',
        config.bg,
        config.darkBg
      )}
      title={badge.description || badge.label}
    >
      <Icon className={cn('w-3.5 h-3.5', config.color)} />
      <span className={cn('text-gray-700 dark:text-gray-300', config.color)}>{badge.label}</span>
    </button>
  );
}

export function TrustBadges({
  badges,
  afriScore,
  satisfactionScore,
  className,
  variant = 'compact',
  onBadgeClick,
}: TrustBadgesProps) {
  if ((!badges || badges.length === 0) && !afriScore && !satisfactionScore) return null;
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {afriScore && afriScore.overallScore > 0 && (
          <ScoreBadge score={afriScore.overallScore} category={afriScore.category} />
        )}
        {satisfactionScore && satisfactionScore > 0 && (
          <SatisfactionBadge score={satisfactionScore} />
        )}
        {badges?.slice(0, variant === 'compact' ? 4 : badges.length).map((badge) => (
          <BadgeChip key={badge.badge} badge={badge} onClick={() => onBadgeClick?.(badge)} />
        ))}
        {variant === 'compact' && badges && badges.length > 4 && (
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            +{badges.length - 4}
          </span>
        )}
      </div>
      {variant === 'full' && badges && badges.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((badge) => {
            const config = BADGE_CONFIG[badge.badge] || DEFAULT_CONFIG;
            const Icon = config.icon;
            return (
              <div
                key={badge.badge}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer'
                )}
                onClick={() => onBadgeClick?.(badge)}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    config.bg,
                    config.darkBg
                  )}
                >
                  <Icon className={cn('w-5 h-5', config.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {badge.label}
                  </h4>
                  {badge.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {badge.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TrustBadgeIcon({ badge }: { badge: string }) {
  const config = BADGE_CONFIG[badge] || DEFAULT_CONFIG;
  const Icon = config.icon;
  const labels: Record<string, string> = {
    BUSINESS_VERIFIED: 'Vérifié',
    PAYMENT_VERIFIED: 'Paiement Sécurisé',
    TOP_SELLER: 'Top Vendeur',
    TOP_PROVIDER: 'Top Prestataire',
    TOP_RESTAURANT: 'Top Restaurant',
    TOP_HOTEL: 'Top Hôtel',
    TOP_RENTER: 'Top Loueur',
    TOP_EVENT: 'Top Événement',
    BUSINESS_PREMIUM: 'Premium',
    BUSINESS_RECOMMENDED: 'Recommandé',
    BUSINESS_RELIABLE: 'Fiable',
    BUSINESS_ELITE: 'Elite',
    RESPONSE_TIME: 'Réponse Rapide',
    ESCROW_ACTIVE: 'Escrow',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border',
        config.bg,
        config.darkBg,
        'border-gray-200 dark:border-gray-700'
      )}
      title={labels[badge] || badge}
    >
      <Icon className={cn('w-3 h-3', config.color)} />
      {labels[badge] || badge}
    </span>
  );
}
